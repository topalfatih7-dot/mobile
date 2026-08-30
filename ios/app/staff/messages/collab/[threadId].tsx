/**
 * LOCK: docs/mobile/screens/staff/collab-messages.md
 * Param = memberId (web `/staff/collab-messages/:memberId`); push may pass thread UUID
 * Roles: coach | dietitian | doctor
 */
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import Animated, { FadeInUp } from 'react-native-reanimated';

import { ChatDateChip } from '@/components/chat/ChatDateChip';
import { ChatKeyboardLayout } from '@/components/chat/ChatKeyboardLayout';
import { EmptyState } from '@/components/ui/EmptyState';
import { InlineSpinner } from '@/components/ui/InlineSpinner';
import { MeshBackground } from '@/components/ui/MeshBackground';
import { useAuth } from '@/context/AuthContext';
import { useData } from '@/context/DataContext';
import { useToast } from '@/context/ToastContext';
import { useActions } from '@/context/ActionsContext';
import {
  collabPeerName,
  fetchStaffCollabMessages,
  getOrCreateStaffCollabThread,
  markStaffCollabThreadRead,
  parseStaffCollabMessageRow,
  resolveStaffCollabThread,
  sendStaffCollabMessage,
  subscribeStaffCollabMessages,
  type StaffCollabMessage,
  type StaffCollabThread,
} from '@/services/staffCollabChat';
import { setActiveChatThreadId } from '@/services/activeChatThread';
import { normalizeStaffRole } from '@/utils/staffClients';
import { toInvertedChatRows } from '@/utils/chatTranscript';
import { mergeLiveMessage } from '@/utils/liveChatMerge';
import { chatComposerWebKeyDownProps } from '@/utils/chatComposerSubmit';
import { colors, fonts, radius, spacing } from '@/theme';

export default function StaffCollabMessages() {
  const { threadId: routeParamRaw } = useLocalSearchParams<{ threadId: string }>();
  const routeParam = String(routeParamRaw || '');
  const { staff } = useAuth();
  const { platform } = useData();
  const { toast } = useToast();
  const { markRelatedChatNotificationsRead } = useActions();
  const role = normalizeStaffRole(staff?.role as string);
  const isAllowed = role === 'coach' || role === 'dietitian' || role === 'doctor';

  const [text, setText] = useState('');
  const [thread, setThread] = useState<StaffCollabThread | null>(null);
  const [msgs, setMsgs] = useState<StaffCollabMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const markReadTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const threadRef = useRef<StaffCollabThread | null>(null);
  const openedForRef = useRef('');
  threadRef.current = thread;

  const member = useMemo(() => {
    const id = thread?.memberId || routeParam;
    if (!id) return null;
    return platform.members.find((m) => String(m.id) === String(id)) || null;
  }, [platform.members, thread?.memberId, routeParam]);

  const peerName = useMemo(() => collabPeerName(thread, role), [thread, role]);
  const memberLabel = String(member?.name || thread?.memberName || 'Danışan');


  const bootstrap = useCallback(async () => {
    if (!staff?.id || !isAllowed || !routeParam) {
      setLoading(false);
      return;
    }
    if (threadRef.current && openedForRef.current === routeParam) return;
    const gen = routeParam;
    openedForRef.current = gen;
    setLoading(true);
    try {
      let t = await resolveStaffCollabThread(routeParam);
      if (!t) {
        const cached =
          platform.members.find((m) => String(m.id) === routeParam) || null;
        if (cached) {
          const staffList = platform.staffList.length
            ? platform.staffList
            : Object.values(platform.staffById);
          t = await getOrCreateStaffCollabThread(cached, staffList);
        }
      }
      if (openedForRef.current !== gen) return;
      setThread(t);
      if (t) {
        setMsgs(await fetchStaffCollabMessages(t.id));
        if (openedForRef.current !== gen) return;
        await markStaffCollabThreadRead(t.id, role);
      }
    } catch (e) {
      if (openedForRef.current !== gen) return;
      toast(e instanceof Error ? e.message : 'Sohbet yüklenemedi', 'error');
    } finally {
      if (openedForRef.current === gen) setLoading(false);
    }
  }, [
    routeParam,
    staff?.id,
    role,
    isAllowed,
    platform.members,
    platform.staffList,
    platform.staffById,
    toast,
  ]);

  useEffect(() => {
    void bootstrap();
  }, [bootstrap]);

  useEffect(() => {
    if (!thread?.memberId && !thread?.id) return;
    void markRelatedChatNotificationsRead({
      type: 'collab',
      memberId: thread.memberId || undefined,
      threadId: thread.id,
    });
  }, [thread?.id, thread?.memberId, markRelatedChatNotificationsRead]);

  const scheduleMarkRead = useCallback(() => {
    if (!thread?.id || !isAllowed) return;
    if (markReadTimerRef.current) clearTimeout(markReadTimerRef.current);
    const id = thread.id;
    markReadTimerRef.current = setTimeout(() => {
      void markStaffCollabThreadRead(id, role);
    }, 300);
  }, [thread?.id, isAllowed, role]);

  useEffect(() => {
    const id = thread?.id;
    if (!id) return;
    return subscribeStaffCollabMessages(id, (row) => {
      const incoming = parseStaffCollabMessageRow(row);
      setMsgs((prev) => mergeLiveMessage(prev, incoming));
      scheduleMarkRead();
    });
  }, [thread?.id, scheduleMarkRead]);

  useEffect(
    () => () => {
      if (markReadTimerRef.current) clearTimeout(markReadTimerRef.current);
    },
    [],
  );

  useEffect(() => {
    if (thread?.id) {
      setActiveChatThreadId(thread.id);
      return () => setActiveChatThreadId(null);
    }
    return undefined;
  }, [thread?.id]);

  const send = async () => {
    if (!thread || !staff?.id || !isAllowed) return;
    const body = text.trim();
    if (!body || sending) return;
    setSending(true);
    const optimisticId = `local-${Date.now()}`;
    const optimistic: StaffCollabMessage = {
      id: optimisticId,
      threadId: thread.id,
      senderType: role,
      senderId: String(staff.id),
      text: body,
      createdAt: new Date().toISOString(),
    };
    setMsgs((prev) => [...prev, optimistic]);
    setText('');
    const res = await sendStaffCollabMessage({
      thread,
      senderType: role,
      senderId: String(staff.id),
      text: body,
    });
    setSending(false);
    if (!res.success) {
      setMsgs((prev) => prev.filter((m) => m.id !== optimisticId));
      setText(body);
      toast(res.error || 'Gönderilemedi', 'error');
      return;
    }
    if (res.message) {
      setMsgs((prev) => mergeLiveMessage(prev, res.message as StaffCollabMessage));
    }
  };

  const markReadFromComposer = () => {
    if (!thread?.id || !isAllowed) return;
    void markStaffCollabThreadRead(thread.id, role);
  };

  const invertedRows = useMemo(() => toInvertedChatRows(msgs), [msgs]);

  const collabHeader = (
    <View style={[styles.header, { paddingTop: spacing.sm }]}>
      <Pressable onPress={() => router.back()}>
        <Ionicons color={colors.brand[600]} name="chevron-back" size={22} />
      </Pressable>
      {thread ? (
        <View>
          <Text style={styles.title}>{peerName}</Text>
          <Text style={styles.subtitle}>Danışan adına: {memberLabel}</Text>
        </View>
      ) : null}
    </View>
  );

  if (!isAllowed) {
    return (
      <MeshBackground style={styles.root}>
        <View style={[styles.header, { paddingTop: spacing.sm }]}>
          <Pressable onPress={() => router.back()}>
            <Ionicons color={colors.brand[600]} name="chevron-back" size={22} />
          </Pressable>
        </View>
        <EmptyState title="Bu rol için ekip sohbeti yok." />
      </MeshBackground>
    );
  }

  if (loading && !thread) {
    return (
      <MeshBackground style={styles.root}>
        {collabHeader}
        <InlineSpinner fill />
      </MeshBackground>
    );
  }

  if (!thread) {
    return (
      <MeshBackground style={styles.root}>
        {collabHeader}
        <EmptyState
          description="Bu ekip konuşması açılamadı. Geri dönüp listeden tekrar deneyin."
          title="Sohbet bulunamadı."
        />
        <Pressable
          accessibilityLabel="Yeniden dene"
          accessibilityRole="button"
          onPress={() => {
            openedForRef.current = '';
            threadRef.current = null;
            void bootstrap();
          }}
          style={styles.retry}>
          <Text style={styles.retryText}>Yeniden dene</Text>
        </Pressable>
      </MeshBackground>
    );
  }

  return (
    <MeshBackground style={styles.root}>
      <View style={{ flex: 1 }}>
        {collabHeader}
        <ChatKeyboardLayout
          list={
            loading ? (
              <InlineSpinner fill />
            ) : (
              <FlatList
                contentContainerStyle={styles.list}
                data={invertedRows}
                inverted
                keyboardDismissMode="on-drag"
                keyboardShouldPersistTaps="handled"
                keyExtractor={(row) => row.id}
                renderItem={({ item: row }) => {
                  if (row.kind === 'date') return <ChatDateChip label={row.label} />;
                  const item = row.message;
                  const mine = item.senderType === role;
                  return (
                    <Animated.View
                      entering={FadeInUp.duration(200)}
                      style={[styles.msgRow, mine && styles.msgRowMine]}>
                      {!mine ? (
                        <View style={styles.peerAvatar}>
                          <Text style={styles.peerAvatarText}>
                            {peerName.charAt(0).toUpperCase()}
                          </Text>
                        </View>
                      ) : null}
                      <View style={[styles.bubble, mine ? styles.bubbleMine : styles.bubbleThem]}>
                        <Text style={[styles.msgText, mine && styles.msgTextMine]}>{item.text}</Text>
                      </View>
                    </Animated.View>
                  );
                }}
              />
            )
          }
          composer={
            <View style={styles.composer}>
              <TextInput
                editable={!sending}
                multiline
                onChangeText={(value) => {
                  setText(value);
                  if (value.trim()) markReadFromComposer();
                }}
                onFocus={markReadFromComposer}
                placeholder="Mesaj yazın…"
                placeholderTextColor={colors.cream[300]}
                style={styles.input}
                value={text}
                {...chatComposerWebKeyDownProps(() => void send())}
              />
              <Pressable
                accessibilityLabel="Gönder"
                accessibilityRole="button"
                disabled={sending || !text.trim()}
                onPress={() => void send()}
                style={[styles.send, (!text.trim() || sending) && styles.sendOff]}>
                <Ionicons color={colors.white} name="send" size={18} />
              </Pressable>
            </View>
          }
        />
      </View>
    </MeshBackground>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.sm,
  },
  title: { fontFamily: fonts.displayBold, fontSize: 18, color: colors.cream[900] },
  subtitle: { fontFamily: fonts.sans, fontSize: 12, color: colors.brand[600] },
  list: { padding: spacing.lg, gap: 8, flexGrow: 1 },
  msgRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 8, marginBottom: 8 },
  msgRowMine: { justifyContent: 'flex-end' },
  peerAvatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.sage[100],
    alignItems: 'center',
    justifyContent: 'center',
  },
  peerAvatarText: { fontFamily: fonts.sansSemi, fontSize: 12, color: colors.sage[700] },
  bubble: {
    maxWidth: '78%',
    borderRadius: radius.lg,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  bubbleThem: { backgroundColor: colors.white, borderWidth: 1, borderColor: colors.cream[200] },
  bubbleMine: { backgroundColor: colors.brand[500] },
  msgText: { fontFamily: fonts.sans, fontSize: 15, color: colors.cream[900] },
  msgTextMine: { color: colors.white },
  composer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 8,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.cream[200],
    backgroundColor: 'rgba(255,255,255,0.9)',
  },
  input: {
    flex: 1,
    minHeight: 52,
    maxHeight: 120,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.cream[200],
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontFamily: fonts.sans,
    fontSize: 15,
    color: colors.cream[900],
    backgroundColor: colors.white,
  },
  send: {
    width: 44,
    height: 44,
    borderRadius: radius.lg,
    backgroundColor: colors.brand[500],
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendOff: { opacity: 0.4 },
  retry: {
    alignSelf: 'center',
    marginTop: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
  },
  retryText: { fontFamily: fonts.sansSemi, fontSize: 15, color: colors.brand[600] },
});
