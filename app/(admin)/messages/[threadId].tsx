/**
 * LOCK: docs/mobile/screens/admin/messages.md — admin staff chat thread
 * Param `threadId` is staff id (route stability).
 */
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import Animated, { FadeInUp } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { EmptyState } from '@/components/ui/EmptyState';
import { InlineSpinner } from '@/components/ui/InlineSpinner';
import { MeshBackground } from '@/components/ui/MeshBackground';
import { useAuth } from '@/context/AuthContext';
import { useData } from '@/context/DataContext';
import { useToast } from '@/context/ToastContext';
import {
  fetchAdminStaffMessages,
  getOrCreateAdminStaffThread,
  markAdminStaffThreadRead,
  sendAdminStaffMessage,
  subscribeAdminStaffChat,
  type AdminStaffMessage,
  type AdminStaffThread,
} from '@/services/adminStaffChat';
import { setActiveChatThreadId } from '@/services/activeChatThread';
import { colors, fonts, radius, spacing } from '@/theme';

const ROLE_LABELS: Record<string, string> = {
  coach: 'Koç',
  dietitian: 'Diyetisyen',
  doctor: 'Doktor',
};

export default function AdminMessageThread() {
  const insets = useSafeAreaInsets();
  const { threadId } = useLocalSearchParams<{ threadId: string }>();
  const staffId = String(threadId || '');
  const { loading, staffById, platform } = useData();
  const { userId } = useAuth();
  const { toast } = useToast();
  const staff =
    staffById[staffId] ||
    platform.staffList.find((s) => String(s.id) === staffId) ||
    null;

  const [thread, setThread] = useState<AdminStaffThread | null>(null);
  const [messages, setMessages] = useState<AdminStaffMessage[]>([]);
  const [draft, setDraft] = useState('');
  const [busy, setBusy] = useState(true);
  const [sending, setSending] = useState(false);
  const listRef = useRef<FlatList<AdminStaffMessage>>(null);

  const reload = useCallback(async (opts?: { silent?: boolean }) => {
    if (!staff) {
      setBusy(false);
      return;
    }
    if (!opts?.silent) setBusy(true);
    try {
      const t = await getOrCreateAdminStaffThread({
        id: String(staff.id),
        name: String(staff.name || ''),
        role: String(staff.role || ''),
      });
      setThread(t);
      if (t) {
        const msgs = await fetchAdminStaffMessages(t.id);
        setMessages(msgs);
        await markAdminStaffThreadRead(t.id, 'admin');
      }
    } catch (e) {
      toast(e instanceof Error ? e.message : 'Sohbet yüklenemedi', 'error');
    } finally {
      setBusy(false);
    }
  }, [staff, toast]);

  useEffect(() => {
    void reload();
  }, [reload]);

  useEffect(() => subscribeAdminStaffChat(() => void reload({ silent: true })), [reload]);

  useEffect(() => {
    const id = setInterval(() => void reload({ silent: true }), 8000);
    return () => clearInterval(id);
  }, [reload]);

  useEffect(() => {
    if (thread?.id) {
      setActiveChatThreadId(thread.id);
      return () => setActiveChatThreadId(null);
    }
    return undefined;
  }, [thread?.id]);

  const send = async () => {
    if (!thread) return;
    const text = draft.trim();
    if (!text) return;
    setSending(true);
    const res = await sendAdminStaffMessage({
      thread,
      senderType: 'admin',
      senderId: userId,
      text,
    });
    setSending(false);
    if (!res.success) {
      toast(res.error || 'Gönderilemedi', 'error');
      return;
    }
    setDraft('');
    await reload();
    setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 100);
  };

  if (loading && !staff) {
    return (
      <MeshBackground style={styles.root}>
        <InlineSpinner fill />
      </MeshBackground>
    );
  }

  if (!staff) {
    return (
      <MeshBackground style={styles.root}>
        <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
          <Pressable onPress={() => router.back()}>
            <Ionicons color={colors.brand[600]} name="chevron-back" size={22} />
          </Pressable>
        </View>
        <EmptyState icon="chatbubbles-outline" title="Sohbet bulunamadı." />
      </MeshBackground>
    );
  }

  return (
    <MeshBackground style={styles.root}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}>
        <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
          <Pressable onPress={() => router.back()}>
            <Ionicons color={colors.brand[600]} name="chevron-back" size={22} />
          </Pressable>
          <View style={{ flex: 1 }}>
            <Text style={styles.title}>{String(staff.name)}</Text>
            <Text style={styles.sub}>
              {ROLE_LABELS[String(staff.role)] || String(staff.role)}
            </Text>
          </View>
        </View>
        {busy ? (
          <InlineSpinner fill />
        ) : (
          <FlatList
            ref={listRef}
            contentContainerStyle={styles.list}
            data={messages}
            keyExtractor={(m) => m.id}
            onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: false })}
            renderItem={({ item }) => {
              const mine = item.senderType === 'admin';
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
        )}
        <View style={[styles.composer, { paddingBottom: insets.bottom + 10 }]}>
          <TextInput
            editable={!sending}
            multiline
            onChangeText={setDraft}
            placeholder="Mesaj yazın…"
            placeholderTextColor={colors.cream[300]}
            style={styles.input}
            value={draft}
          />
          <Pressable
            disabled={sending || !draft.trim()}
            onPress={() => void send()}
            style={[styles.send, (!draft.trim() || sending) && styles.sendOff]}>
            <Ionicons color={colors.white} name="send" size={18} />
          </Pressable>
        </View>
      </KeyboardAvoidingView>
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
    minHeight: 44,
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
