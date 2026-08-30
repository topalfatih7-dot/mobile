/**
 * LOCK: docs/mobile/screens/staff/messages.md — thread
 * Web: StaffMessagesPage.jsx — presence + ChatCollapsiblePrograms
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

import { ChatCollapsiblePrograms } from '@/components/chat/ChatCollapsiblePrograms';
import { ChatDateChip } from '@/components/chat/ChatDateChip';
import { ChatKeyboardLayout } from '@/components/chat/ChatKeyboardLayout';
import { PresenceIndicator } from '@/components/chat/PresenceIndicator';
import { MeshBackground } from '@/components/ui/MeshBackground';
import { InlineSpinner } from '@/components/ui/InlineSpinner';
import { useAuth } from '@/context/AuthContext';
import { useData } from '@/context/DataContext';
import { useToast } from '@/context/ToastContext';
import { useActions } from '@/context/ActionsContext';
import { getPlanLabel } from '@/data/membershipPlans';
import { useChatPresence } from '@/hooks/useChatPresence';
import {
  loadStaffClientThread,
  markStaffChatThreadRead,
  parseChatMessageRow,
  sendStaffChatMessage,
  subscribeChatThreadMessages,
  type ChatMessage,
  type ChatThread,
} from '@/services/chat';
import { setActiveChatThreadId } from '@/services/activeChatThread';
import { normalizeStaffRole } from '@/utils/staffClients';
import { toInvertedChatRows } from '@/utils/chatTranscript';
import { mergeLiveMessage } from '@/utils/liveChatMerge';
import { chatComposerWebKeyDownProps } from '@/utils/chatComposerSubmit';
import { colors, fonts, radius, spacing } from '@/theme';

const ROLE_LABEL: Record<string, string> = {
  coach: 'Koç',
  dietitian: 'Diyetisyen',
  doctor: 'Doktor',
};

export default function StaffThread() {
  const { threadId: memberId } = useLocalSearchParams<{ threadId: string }>();
  const { staffClients, platform } = useData();
  const { staff } = useAuth();
  const { markRelatedChatNotificationsRead } = useActions();
  const client = staffClients.find((c) => String(c.id) === String(memberId));
  const { toast } = useToast();
  const [text, setText] = useState('');
  const [thread, setThread] = useState<ChatThread | null>(null);
  const [msgs, setMsgs] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const markReadTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const role = normalizeStaffRole(staff?.role as string);
  const peerId = client?.id ? String(client.id) : null;
  const { isOnline, lastSeenAt } = useChatPresence(peerId ? [peerId] : []);

  const memberPrograms = useMemo(
    () =>
      (platform.programs || []).filter(
        (p) => String(p.memberId || '') === String(memberId),
      ),
    [platform.programs, memberId],
  );

  const reload = useCallback(async () => {
    if (!client?.id || !staff?.id) {
      setLoading(false);
      return;
    }
    try {
      const res = await loadStaffClientThread(
        String(client.id),
        String(staff.id),
        String(staff.role || 'coach'),
        String(client.name || 'Üye'),
        String(staff.name || ''),
      );
      setThread(res.thread);
      setMsgs(res.messages);
      if (res.thread?.id) await markStaffChatThreadRead(res.thread.id);
    } catch (e) {
      toast(e instanceof Error ? e.message : 'Sohbet yüklenemedi', 'error');
    } finally {
      setLoading(false);
    }
  }, [client, staff, toast]);

  const scheduleMarkRead = useCallback((id: string) => {
    if (markReadTimerRef.current) clearTimeout(markReadTimerRef.current);
    markReadTimerRef.current = setTimeout(() => {
      void markStaffChatThreadRead(id);
      setThread((prev) =>
        prev?.id === id ? { ...prev, staffUnread: 0 } : prev,
      );
    }, 300);
  }, []);

  useEffect(() => {
    void reload();
  }, [reload]);

  useEffect(() => {
    if (!memberId) return;
    void markRelatedChatNotificationsRead({
      type: 'chat',
      memberId: String(memberId),
    });
  }, [memberId, markRelatedChatNotificationsRead]);

  useEffect(() => {
    const id = thread?.id;
    if (!id) return;
    return subscribeChatThreadMessages(id, (change) => {
      if (!change.newRow) return;
      const incoming = parseChatMessageRow(change.newRow);
      setMsgs((prev) => mergeLiveMessage(prev, incoming));
      scheduleMarkRead(id);
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
    if (!thread?.id || !staff?.id) return;
    const body = text.trim();
    if (!body || sending) return;
    setSending(true);
    const optimisticId = `local-${Date.now()}`;
    const optimistic: ChatMessage = {
      id: optimisticId,
      threadId: thread.id,
      senderType: 'staff',
      senderId: String(staff.id),
      text: body,
      createdAt: new Date().toISOString(),
    };
    setMsgs((prev) => [...prev, optimistic]);
    setText('');
    const res = await sendStaffChatMessage(thread.id, String(staff.id), body);
    setSending(false);
    if (!res.success) {
      setMsgs((prev) => prev.filter((m) => m.id !== optimisticId));
      setText(body);
      toast(res.error, 'error');
      return;
    }
    if (res.message) {
      setMsgs((prev) => mergeLiveMessage(prev, res.message as ChatMessage));
    }
  };

  const markReadFromComposer = () => {
    if (!thread?.id) return;
    void markStaffChatThreadRead(thread.id);
    setThread((prev) =>
      prev?.id === thread.id ? { ...prev, staffUnread: 0 } : prev,
    );
  };

  const invertedRows = useMemo(() => toInvertedChatRows(msgs), [msgs]);

  const initial = String(client?.name || '?').charAt(0).toUpperCase();
  const planLabel =
    getPlanLabel(String(client?.membership || '')) || String(client?.membership || '');
  const subtitle = `${ROLE_LABEL[role] || 'Personel'} · ${planLabel}`;
  const peerOnline = peerId ? isOnline(peerId) : false;
  const peerLastSeen = peerId ? lastSeenAt(peerId) : null;

  return (
    <MeshBackground style={styles.root}>
      <View style={{ flex: 1 }}>
        <View style={[styles.header, { paddingTop: spacing.sm }]}>
          <Pressable onPress={() => router.back()}>
            <Ionicons color={colors.brand[600]} name="chevron-back" size={22} />
          </Pressable>
          <View style={styles.headerAvatar}>
            <Text style={styles.headerAvatarText}>{initial}</Text>
            {peerId ? (
              <View style={styles.presenceDot}>
                <PresenceIndicator lastSeenAt={peerLastSeen} online={peerOnline} />
              </View>
            ) : null}
          </View>
          <View style={styles.headerMeta}>
            <Text style={styles.title}>{client ? String(client.name) : 'Sohbet'}</Text>
            <View style={styles.headerSubRow}>
              <Text style={styles.subtitle}>{subtitle}</Text>
              {peerId ? (
                <PresenceIndicator
                  lastSeenAt={peerLastSeen}
                  online={peerOnline}
                  showLabel
                />
              ) : null}
            </View>
          </View>
        </View>

        <ChatCollapsiblePrograms
          memberName={String(client?.name || '')}
          programs={memberPrograms as never}
          role={role}
        />

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
                  const mine = item.senderType === 'staff';
                  return (
                    <Animated.View
                      entering={FadeInUp.duration(200)}
                      style={[styles.msgRow, mine && styles.msgRowMine]}>
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
  headerAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.brand[500],
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  presenceDot: {
    position: 'absolute',
    right: -2,
    bottom: -2,
    backgroundColor: colors.white,
    borderRadius: 8,
    padding: 1,
  },
  headerAvatarText: { fontFamily: fonts.sansSemi, fontSize: 13, color: colors.white },
  headerMeta: { flex: 1, minWidth: 0 },
  title: { fontFamily: fonts.displayBold, fontSize: 18, color: colors.cream[900] },
  headerSubRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 2,
  },
  subtitle: { fontFamily: fonts.sans, fontSize: 12, color: colors.cream[800] },
  list: { padding: spacing.lg, gap: 8, flexGrow: 1 },
  msgRow: { flexDirection: 'row', marginBottom: 8 },
  msgRowMine: { justifyContent: 'flex-end' },
  bubble: {
    maxWidth: '80%',
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
});
