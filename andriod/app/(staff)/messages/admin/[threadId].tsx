/**
 * LOCK: docs/mobile/screens/staff/admin-messages.md
 * Param is admin_staff_threads.id
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
import { MeshBackground } from '@/components/ui/MeshBackground';
import { InlineSpinner } from '@/components/ui/InlineSpinner';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import { useActions } from '@/context/ActionsContext';
import {
  fetchAdminStaffMessages,
  getOrCreateAdminStaffThread,
  markAdminStaffThreadRead,
  parseAdminStaffMessageRow,
  sendAdminStaffMessage,
  subscribeAdminStaffMessages,
  type AdminStaffMessage,
  type AdminStaffThread,
} from '@/services/adminStaffChat';
import { setActiveChatThreadId } from '@/services/activeChatThread';
import { toInvertedChatRows } from '@/utils/chatTranscript';
import { mergeLiveMessage } from '@/utils/liveChatMerge';
import { chatComposerWebKeyDownProps } from '@/utils/chatComposerSubmit';
import { colors, fonts, radius, spacing } from '@/theme';

export default function StaffAdminMessages() {
  const { threadId } = useLocalSearchParams<{ threadId: string }>();
  const { staff } = useAuth();
  const { toast } = useToast();
  const { markRelatedChatNotificationsRead } = useActions();
  const [text, setText] = useState('');
  const [thread, setThread] = useState<AdminStaffThread | null>(null);
  const [msgs, setMsgs] = useState<AdminStaffMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const markReadTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const reload = useCallback(async () => {
    if (!staff?.id) {
      setLoading(false);
      return;
    }
    try {
      const t =
        (await getOrCreateAdminStaffThread({
          id: String(staff.id),
          name: String(staff.name || ''),
          role: String(staff.role || ''),
        })) || null;
      // Prefer route id if it matches an existing thread
      if (t && threadId && t.id !== threadId) {
        // still use created/fetched thread for this staff
      }
      setThread(t);
      if (t) {
        setMsgs(await fetchAdminStaffMessages(t.id));
        await markAdminStaffThreadRead(t.id, 'staff');
      }
    } catch (e) {
      toast(e instanceof Error ? e.message : 'Sohbet yüklenemedi', 'error');
    } finally {
      setLoading(false);
    }
  }, [staff, threadId, toast]);

  useEffect(() => {
    void reload();
  }, [reload]);

  useEffect(() => {
    const id = thread?.id || threadId;
    if (!id) return;
    void markRelatedChatNotificationsRead({
      type: 'admin-chat',
      threadId: String(id),
    });
  }, [thread?.id, threadId, markRelatedChatNotificationsRead]);

  const scheduleMarkRead = useCallback((id: string) => {
    if (markReadTimerRef.current) clearTimeout(markReadTimerRef.current);
    markReadTimerRef.current = setTimeout(() => {
      void markAdminStaffThreadRead(id, 'staff');
    }, 300);
  }, []);

  useEffect(() => {
    const id = thread?.id;
    if (!id) return;
    return subscribeAdminStaffMessages(id, (row) => {
      const incoming = parseAdminStaffMessageRow(row);
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
    if (!thread || !staff?.id) return;
    const body = text.trim();
    if (!body || sending) return;
    setSending(true);
    const optimisticId = `local-${Date.now()}`;
    const optimistic: AdminStaffMessage = {
      id: optimisticId,
      threadId: thread.id,
      senderType: 'staff',
      senderId: String(staff.id),
      text: body,
      createdAt: new Date().toISOString(),
    };
    setMsgs((prev) => [...prev, optimistic]);
    setText('');
    const res = await sendAdminStaffMessage({
      thread,
      senderType: 'staff',
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
      setMsgs((prev) => mergeLiveMessage(prev, res.message as AdminStaffMessage));
    }
  };

  const markReadFromComposer = () => {
    if (!thread?.id) return;
    void markAdminStaffThreadRead(thread.id, 'staff');
  };

  const invertedRows = useMemo(() => toInvertedChatRows(msgs), [msgs]);

  return (
    <MeshBackground style={styles.root}>
      <View style={{ flex: 1 }}>
        <View style={[styles.header, { paddingTop: spacing.sm }]}>
          <Pressable onPress={() => router.back()}>
            <Ionicons color={colors.brand[600]} name="chevron-back" size={22} />
          </Pressable>
          <View>
            <Text style={styles.title}>Admin</Text>
            <Text style={styles.sub}>Yönetim sohbeti</Text>
          </View>
        </View>
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
  title: { fontFamily: fonts.displayBold, fontSize: 18, color: colors.cream[900] },
  sub: { fontFamily: fonts.sans, fontSize: 12, color: colors.brand[600] },
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
