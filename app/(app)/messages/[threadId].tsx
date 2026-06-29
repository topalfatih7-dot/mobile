import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router, useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
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
import {
  fetchChatMessages,
  fetchChatThreadById,
  markChatThreadRead,
  sendChatMessage,
  type DbChatMessage,
  type DbChatThread,
} from '@/services/db/chat';
import { colors, fonts, gradients, radius, spacing } from '@/constants/theme';

function formatMessageTime(iso: string) {
  const date = new Date(iso);
  return date.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });
}

function MessageBubble({ message, isMine }: { message: DbChatMessage; isMine: boolean }) {
  return (
    <View style={[styles.bubbleRow, isMine && styles.bubbleRowMine]}>
      <View style={[styles.bubble, isMine ? styles.bubbleMine : styles.bubbleTheirs]}>
        <Text style={[styles.bubbleText, isMine && styles.bubbleTextMine]}>{message.text}</Text>
        <Text style={[styles.bubbleTime, isMine && styles.bubbleTimeMine]}>
          {formatMessageTime(message.createdAt)}
        </Text>
      </View>
    </View>
  );
}

export default function ChatThreadScreen() {
  const { threadId } = useLocalSearchParams<{ threadId: string }>();
  const insets = useSafeAreaInsets();
  const { conversations, user, refresh } = useApp();
  const { horizontalPadding, isTablet } = useResponsive();

  const [thread, setThread] = useState<DbChatThread | null>(null);
  const [messages, setMessages] = useState<DbChatMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [draft, setDraft] = useState('');
  const listRef = useRef<FlatList<DbChatMessage>>(null);

  const conversation = useMemo(
    () => conversations.find((c) => c.id === threadId),
    [conversations, threadId],
  );

  const peerName = conversation?.name || thread?.staffName || 'Uzman';
  const peerRole = conversation?.role || 'Uzman';
  const peerGradient = conversation?.gradient || gradients.brand;

  const loadThread = useCallback(async () => {
    if (!threadId) return;
    setLoading(true);
    try {
      const [threadRow, msgs] = await Promise.all([
        fetchChatThreadById(threadId),
        fetchChatMessages(threadId),
      ]);
      setThread(threadRow);
      setMessages(msgs);
      await markChatThreadRead(threadId, 'member');
      void refresh();
    } finally {
      setLoading(false);
    }
  }, [threadId, refresh]);

  useEffect(() => {
    void loadThread();
  }, [loadThread]);

  useEffect(() => {
    if (messages.length === 0) return;
    requestAnimationFrame(() => {
      listRef.current?.scrollToEnd({ animated: false });
    });
  }, [messages.length]);

  const onSend = async () => {
    const text = draft.trim();
    if (!text || !thread || sending) return;

    setSending(true);
    setDraft('');
    try {
      const result = await sendChatMessage({
        thread,
        senderType: 'member',
        senderId: user.id || null,
        text,
      });
      if (result.success && result.message) {
        setMessages((prev) => [...prev, result.message!]);
        void refresh();
      } else {
        setDraft(text);
      }
    } finally {
      setSending(false);
    }
  };

  return (
    <View style={styles.root}>
      <LinearGradient
        colors={peerGradient}
        end={{ x: 1, y: 1 }}
        start={{ x: 0, y: 0 }}
        style={[styles.header, { paddingTop: insets.top + spacing.sm }]}>
        <Pressable
          accessibilityLabel="Geri"
          accessibilityRole="button"
          hitSlop={12}
          onPress={() => router.back()}
          style={styles.back}>
          <Ionicons color={colors.white} name="chevron-back" size={22} />
        </Pressable>

        <Avatar gradient={peerGradient} name={peerName} size={40} />
        <View style={styles.headerText}>
          <Text numberOfLines={1} style={styles.headerName}>
            {peerName}
          </Text>
          <Text style={styles.headerRole}>{peerRole}</Text>
        </View>
      </LinearGradient>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 8 : 0}
        style={styles.flex}>
        <ResponsiveCenter innerStyle={styles.threadInner} style={styles.flex}>
          {loading ? (
            <View style={styles.centered}>
              <ActivityIndicator color={colors.brand[600]} size="large" />
            </View>
          ) : (
            <FlatList
              ref={listRef}
              contentContainerStyle={[
                styles.list,
                { paddingHorizontal: horizontalPadding },
                isTablet && styles.listTablet,
              ]}
              data={messages}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <MessageBubble isMine={item.senderType === 'member'} message={item} />
              )}
              showsVerticalScrollIndicator={false}
            />
          )}

          <View
            style={[
              styles.composerWrap,
              { paddingBottom: insets.bottom + spacing.sm, paddingHorizontal: horizontalPadding },
            ]}>
            <View style={styles.composer}>
              <TextInput
                editable={!sending && !!thread}
                multiline
                onChangeText={setDraft}
                placeholder="Mesajını yaz…"
                placeholderTextColor={colors.text.muted}
                selectionColor={colors.ink[400]}
                style={styles.input}
                value={draft}
              />
              <Pressable
                accessibilityLabel="Gönder"
                accessibilityRole="button"
                disabled={!draft.trim() || sending || !thread}
                onPress={() => void onSend()}
                style={[styles.send, (!draft.trim() || sending) && styles.sendDisabled]}>
                {sending ? (
                  <ActivityIndicator color={colors.white} size="small" />
                ) : (
                  <Ionicons color={colors.white} name="send" size={18} />
                )}
              </Pressable>
            </View>
          </View>
        </ResponsiveCenter>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.background,
  },
  flex: {
    flex: 1,
  },
  threadInner: {
    flex: 1,
    width: '100%',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
  },
  back: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.2)',
    marginRight: spacing.xs,
  },
  headerText: {
    flex: 1,
  },
  headerName: {
    fontFamily: fonts.display,
    fontSize: 16,
    color: colors.white,
  },
  headerRole: {
    fontFamily: fonts.semibold,
    fontSize: 11.5,
    color: 'rgba(255,255,255,0.85)',
    marginTop: 1,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  list: {
    flexGrow: 1,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
    gap: spacing.sm,
  },
  listTablet: {
    paddingTop: spacing.lg,
  },
  bubbleRow: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
  },
  bubbleRowMine: {
    justifyContent: 'flex-end',
  },
  bubble: {
    maxWidth: '82%',
    borderRadius: radius.lg,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  bubbleTheirs: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderBottomLeftRadius: 6,
  },
  bubbleMine: {
    backgroundColor: colors.brand[600],
    borderBottomRightRadius: 6,
  },
  bubbleText: {
    fontFamily: fonts.regular,
    fontSize: 15,
    lineHeight: 21,
    color: colors.text.primary,
  },
  bubbleTextMine: {
    color: colors.white,
  },
  bubbleTime: {
    fontFamily: fonts.medium,
    fontSize: 10.5,
    color: colors.text.muted,
    marginTop: 4,
    alignSelf: 'flex-end',
  },
  bubbleTimeMine: {
    color: 'rgba(255,255,255,0.75)',
  },
  composerWrap: {
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.surface,
    paddingTop: spacing.sm,
  },
  composer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: spacing.sm,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.background,
    paddingLeft: spacing.md,
    paddingRight: spacing.xs,
    paddingVertical: spacing.xs,
  },
  input: {
    flex: 1,
    minHeight: 40,
    maxHeight: 120,
    fontFamily: fonts.regular,
    fontSize: 15,
    color: colors.text.primary,
    paddingVertical: Platform.OS === 'ios' ? 10 : 8,
  },
  send: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.brand[600],
  },
  sendDisabled: {
    opacity: 0.45,
  },
});
