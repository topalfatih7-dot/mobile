import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router, useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Avatar } from '@/components/ui/Avatar';
import { ResponsiveCenter } from '@/components/layout/ResponsiveCenter';
import { useApp } from '@/context/AppContext';
import { useResponsive } from '@/hooks/useResponsive';
import type { AdminStaffMessage } from '@/services/db/adminChat';
import { staffRoleLabel } from '@/utils/staffAccess';
import { colors, fonts, gradients, radius, spacing } from '@/constants/theme';

function formatMessageTime(iso: string) {
  return new Date(iso).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });
}

export default function AdminStaffChatScreen() {
  const { threadId } = useLocalSearchParams<{ threadId: string }>();
  const insets = useSafeAreaInsets();
  const {
    adminStaffThreads,
    adminStaffMessages,
    loadAdminStaffMessages,
    sendAdminStaffChat,
    markAdminStaffRead,
  } = useApp();
  const { horizontalPadding } = useResponsive();

  const thread = adminStaffThreads.find((t) => t.id === threadId) || null;
  const [messages, setMessages] = useState<AdminStaffMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [draft, setDraft] = useState('');
  const [error, setError] = useState('');
  const listRef = useRef<FlatList<AdminStaffMessage>>(null);

  const load = useCallback(async () => {
    if (!threadId) return;
    setLoading(true);
    try {
      const msgs = await loadAdminStaffMessages(threadId);
      setMessages(msgs);
      await markAdminStaffRead(threadId);
    } finally {
      setLoading(false);
    }
  }, [threadId, loadAdminStaffMessages, markAdminStaffRead]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    if (!threadId) return;
    const live = adminStaffMessages[threadId];
    if (live) setMessages(live);
  }, [adminStaffMessages, threadId]);

  const onSend = async () => {
    if (!thread || !draft.trim() || sending) return;
    setSending(true);
    setError('');
    try {
      const result = await sendAdminStaffChat(thread, draft.trim());
      if (!result.success) {
        setError(result.error || 'Gönderilemedi.');
        return;
      }
      setDraft('');
    } finally {
      setSending(false);
    }
  };

  return (
    <View style={styles.root}>
      <LinearGradient colors={gradients.violet} style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <ResponsiveCenter innerStyle={{ paddingHorizontal: horizontalPadding }}>
          <View style={styles.headerRow}>
            <Pressable hitSlop={12} onPress={() => router.back()}>
              <Ionicons color={colors.white} name="chevron-back" size={24} />
            </Pressable>
            <Avatar gradient={gradients.violet} name={thread?.staffName || 'Personel'} size={40} />
            <View style={styles.headerText}>
              <Text style={styles.headerTitle}>{thread?.staffName || 'Personel'}</Text>
              <Text style={styles.headerSub}>{staffRoleLabel(thread?.staffRole)}</Text>
            </View>
          </View>
        </ResponsiveCenter>
      </LinearGradient>

      {loading ? (
        <ActivityIndicator color={colors.violet[600]} style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          contentContainerStyle={styles.list}
          data={messages}
          keyExtractor={(item) => item.id}
          ref={listRef}
          renderItem={({ item }) => {
            const isMine = item.senderType === 'admin';
            return (
              <View style={[styles.bubbleRow, isMine && styles.bubbleRowMine]}>
                <View style={[styles.bubble, isMine ? styles.bubbleMine : styles.bubbleTheirs]}>
                  <Text style={[styles.bubbleText, isMine && styles.bubbleTextMine]}>{item.text}</Text>
                  <Text style={[styles.bubbleTime, isMine && styles.bubbleTimeMine]}>
                    {formatMessageTime(item.createdAt)}
                  </Text>
                </View>
              </View>
            );
          }}
          onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: false })}
        />
      )}

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={[styles.composer, { paddingBottom: Math.max(insets.bottom, 12) }]}>
          {error ? <Text style={styles.error}>{error}</Text> : null}
          <View style={styles.composerRow}>
            <TextInput
              multiline
              onChangeText={setDraft}
              placeholder="Mesaj yazın…"
              placeholderTextColor={colors.ink[300]}
              style={styles.input}
              value={draft}
            />
            <Pressable disabled={sending || !draft.trim()} onPress={() => void onSend()} style={styles.send}>
              {sending ? (
                <ActivityIndicator color={colors.white} size="small" />
              ) : (
                <Ionicons color={colors.white} name="send" size={18} />
              )}
            </Pressable>
          </View>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  header: { paddingBottom: spacing.md },
  headerRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  headerText: { flex: 1 },
  headerTitle: { fontFamily: fonts.display, fontSize: 17, color: colors.white },
  headerSub: { fontFamily: fonts.medium, fontSize: 12, color: 'rgba(255,255,255,0.85)' },
  list: { padding: spacing.lg, paddingBottom: spacing.xl },
  bubbleRow: { marginBottom: spacing.sm, alignItems: 'flex-start' },
  bubbleRowMine: { alignItems: 'flex-end' },
  bubble: {
    maxWidth: '82%',
    borderRadius: radius.lg,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.white,
  },
  bubbleMine: { backgroundColor: colors.violet[600] },
  bubbleTheirs: { backgroundColor: colors.white },
  bubbleText: { fontFamily: fonts.regular, fontSize: 15, color: colors.text.primary },
  bubbleTextMine: { color: colors.white },
  bubbleTime: { fontFamily: fonts.medium, fontSize: 11, color: colors.text.muted, marginTop: 4 },
  bubbleTimeMine: { color: 'rgba(255,255,255,0.75)' },
  composer: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
  },
  composerRow: { flexDirection: 'row', alignItems: 'flex-end', gap: spacing.sm },
  input: {
    flex: 1,
    minHeight: 42,
    maxHeight: 120,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.ink[100],
    paddingHorizontal: spacing.md,
    paddingVertical: 10,
    fontFamily: fonts.regular,
    fontSize: 15,
    color: colors.text.primary,
  },
  send: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.violet[600],
  },
  error: { fontFamily: fonts.medium, fontSize: 12, color: colors.danger, marginBottom: 6 },
});
