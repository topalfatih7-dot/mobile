import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { format } from 'date-fns';
import { router, useLocalSearchParams, type Href } from 'expo-router';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
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
import Animated, { withTiming } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ChatConsentModal } from '@/components/chat/ChatConsentModal';
import { ChatCollapsiblePrograms } from '@/components/chat/ChatCollapsiblePrograms';
import { PresenceIndicator } from '@/components/chat/PresenceIndicator';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { InlineSpinner } from '@/components/ui/InlineSpinner';
import { MeshBackground } from '@/components/ui/MeshBackground';
import { useData, useMember } from '@/context/DataContext';
import { useToast } from '@/context/ToastContext';
import { useChatPresence } from '@/hooks/useChatPresence';
import { setActiveChatThreadId } from '@/services/activeChatThread';
import {
  loadMemberChat,
  markChatThreadRead,
  recordChatConsent,
  sendChatMessage,
  subscribeMemberChat,
  type ChatMessage,
  type ChatThread,
} from '@/services/chat';
import { CHAT_CONSENT_KEY, getMemberChatContacts } from '@/utils/chatContacts';
import { colors, fonts, radius, spacing } from '@/theme';

const ROLE_LABEL: Record<string, string> = {
  coach: 'Koç',
  dietitian: 'Diyetisyen',
  doctor: 'Doktor',
};

/** Yeni balon: alttan 8px slide + fade (02-design-system motion). */
const bubbleEntering = () => {
  'worklet';
  return {
    initialValues: { opacity: 0, transform: [{ translateY: 8 }] },
    animations: {
      opacity: withTiming(1, { duration: 150 }),
      transform: [{ translateY: withTiming(0, { duration: 150 }) }],
    },
  };
};

/**
 * LOCK: docs/mobile/screens/member/messages.md — thread + consent + composer
 * Web: MessagesPage.jsx /messages/:role
 */
export default function MessageThreadScreen() {
  const insets = useSafeAreaInsets();
  const { threadId: rawId } = useLocalSearchParams<{ threadId: string }>();
  const threadRef = String(rawId || '');
  const member = useMember();
  const { staffById, loading: dataLoading, myPrograms } = useData();
  const { toast } = useToast();
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [thread, setThread] = useState<ChatThread | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [localConsent, setLocalConsent] = useState(false);
  const [accepting, setAccepting] = useState(false);
  const markedReadRef = useRef<string | null>(null);

  const contacts = useMemo(
    () => getMemberChatContacts(member, staffById),
    [member, staffById],
  );

  const contact = useMemo(
    () => contacts.find((c) => c.staffRole === threadRef) || null,
    [contacts, threadRef],
  );

  const peerId = contact?.staffId || null;
  const { isOnline, lastSeenAt } = useChatPresence(peerId ? [peerId] : []);

  useEffect(() => {
    void AsyncStorage.getItem(CHAT_CONSENT_KEY).then((v) => {
      if (v === '1') setLocalConsent(true);
    });
  }, []);

  const reload = useCallback(async () => {
    if (!member?.id) {
      return;
    }
    try {
      setLoadError(null);
      const snap = await loadMemberChat(
        contacts,
        String(member.id),
        String(member.name || 'Üye'),
      );
      const t =
        snap.threads.find(
          (row) => row.id === threadRef || row.staffRole === threadRef,
        ) || null;
      setThread(t);
      setMessages(t ? snap.messages[t.id] || [] : []);
      if (!t) {
        setLoadError('Bu sohbet bulunamadı. Uzman atamanızı kontrol edin.');
      }
    } catch (e) {
      setLoadError(e instanceof Error ? e.message : 'Sohbet yüklenemedi');
      setThread(null);
      setMessages([]);
    } finally {
      setLoaded(true);
    }
  }, [contacts, member?.id, member?.name, threadRef]);

  useEffect(() => {
    setLoaded(false);
    void reload();
    if (!member?.id) return;
    return subscribeMemberChat(() => {
      void reload();
    }, String(member.id));
  }, [reload, member?.id]);

  useEffect(() => {
    if (!member?.id || !thread?.id) return;
    const id = setInterval(() => {
      void reload();
    }, 8000);
    return () => clearInterval(id);
  }, [reload, member?.id, thread?.id]);

  useEffect(() => {
    if (!thread?.id) return;
    setActiveChatThreadId(thread.id);
    if (markedReadRef.current !== thread.id) {
      markedReadRef.current = thread.id;
      void markChatThreadRead(thread.id).catch(() => {});
    }
    return () => setActiveChatThreadId(null);
  }, [thread?.id]);

  const needsConsent = Boolean(thread && !thread.memberConsentAt && !localConsent);

  const onSend = async () => {
    if (!member?.id || !thread) return;
    const body = text.trim();
    if (!body || sending) return;

    setSending(true);
    const optimisticId = `local-${Date.now()}`;
    const optimistic: ChatMessage = {
      id: optimisticId,
      threadId: thread.id,
      senderType: 'member',
      senderId: String(member.id),
      text: body,
      createdAt: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, optimistic]);
    setText('');

    const res = await sendChatMessage(thread.id, String(member.id), body);
    setSending(false);
    if (!res.success) {
      setMessages((prev) => prev.filter((m) => m.id !== optimisticId));
      setText(body);
      toast(res.error, 'error');
      return;
    }
    void reload();
  };

  const acceptConsent = async () => {
    if (!thread || accepting) return;
    setAccepting(true);
    try {
      await AsyncStorage.setItem(CHAT_CONSENT_KEY, '1');
      setLocalConsent(true);
      void recordChatConsent(thread.id).then((ok) => {
        if (ok) void reload();
      });
    } catch {
      toast('Onay kaydedilemedi. Tekrar deneyin.', 'error');
    } finally {
      setAccepting(false);
    }
  };

  const sortedMessages = useMemo(
    () =>
      messages
        .slice()
        .sort(
          (a, b) =>
            new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
        ),
    [messages],
  );

  const title =
    thread?.staffName || contact?.name || ROLE_LABEL[threadRef] || 'Sohbet';
  const subtitle =
    ROLE_LABEL[thread?.staffRole || threadRef] || thread?.staffRole || '';
  const staffRole = String(thread?.staffRole || threadRef || '');
  const peerOnline = peerId ? isOnline(peerId) : false;
  const peerLastSeen = peerId ? lastSeenAt(peerId) : null;

  if (!member?.id && dataLoading) {
    return (
      <MeshBackground style={styles.root}>
        <InlineSpinner fill />
      </MeshBackground>
    );
  }

  if (!loaded && member?.id) {
    return (
      <MeshBackground style={styles.root}>
        <InlineSpinner fill />
      </MeshBackground>
    );
  }

  if (!thread) {
    return (
      <MeshBackground style={styles.root}>
        <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
          <Pressable
            accessibilityLabel="Geri"
            accessibilityRole="button"
            hitSlop={10}
            onPress={() => router.replace('/(member)/messages' as Href)}
            style={styles.back}>
            <Ionicons color={colors.brand[600]} name="chevron-back" size={22} />
          </Pressable>
          <View style={styles.headerMeta}>
            <Text style={styles.headerTitle}>{title}</Text>
            <Text style={styles.headerSub}>{subtitle}</Text>
          </View>
        </View>
        <EmptyState
          description={loadError || 'Sohbet açılamadı. Tekrar deneyin.'}
          icon="chatbubble-ellipses-outline"
          title="Sohbet bulunamadı"
        />
        <View style={styles.retryWrap}>
          <Button label="Yeniden dene" onPress={() => void reload()} />
          <Button
            label="Mesajlara dön"
            onPress={() => router.replace('/(member)/messages' as Href)}
            variant="ghost"
          />
        </View>
      </MeshBackground>
    );
  }

  return (
    <MeshBackground style={styles.root}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.flex}>
        <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
          <Pressable
            accessibilityLabel="Geri"
            accessibilityRole="button"
            hitSlop={10}
            onPress={() => router.back()}
            style={styles.back}>
            <Ionicons color={colors.brand[600]} name="chevron-back" size={22} />
          </Pressable>
          <View style={styles.headerMeta}>
            <Text style={styles.headerTitle}>{title}</Text>
            <View style={styles.headerSubRow}>
              <Text style={styles.headerSub}>{subtitle}</Text>
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
          memberName={String(member?.name || '')}
          programs={myPrograms as never}
          role={staffRole}
        />

        <FlatList
          contentContainerStyle={styles.list}
          data={sortedMessages}
          keyExtractor={(m) => m.id}
          ListEmptyComponent={
            <View style={styles.emptyChat}>
              <Ionicons color={colors.cream[300]} name="chatbubble-outline" size={38} />
              <Text style={styles.emptyTitle}>{title} ile sohbete başlayın</Text>
              <Text style={styles.emptyText}>Mesajlar güvenli şekilde saklanır.</Text>
            </View>
          }
          renderItem={({ item }) => {
            const mine = item.senderType === 'member';
            if (item.senderType === 'system') {
              return (
                <View style={styles.systemBubble}>
                  <Ionicons
                    color={colors.gold[500]}
                    name="information-circle-outline"
                    size={16}
                  />
                  <Text style={styles.systemText}>{item.text}</Text>
                </View>
              );
            }
            return (
              <Animated.View
                entering={bubbleEntering}
                style={[styles.bubble, mine ? styles.bubbleMine : styles.bubbleOther]}>
                <Text style={[styles.bubbleText, mine && styles.bubbleTextMine]}>
                  {item.text}
                </Text>
                <Text style={[styles.bubbleTime, mine && styles.bubbleTimeMine]}>
                  {format(new Date(item.createdAt), 'HH:mm')}
                </Text>
              </Animated.View>
            );
          }}
        />

        <View style={[styles.composer, { paddingBottom: insets.bottom + 10 }]}>
          <View style={styles.liveBadge}>
            <Ionicons color={colors.sage[600]} name="radio-outline" size={14} />
            <Text style={styles.liveText}>Canlı — mesajlar kayıt altına alınır</Text>
          </View>
          <TextInput
            editable={!needsConsent}
            multiline
            onChangeText={setText}
            placeholder={needsConsent ? 'Önce onay gerekli' : 'Mesaj yazın…'}
            placeholderTextColor={colors.cream[300]}
            style={styles.input}
            value={text}
          />
          <Pressable
            accessibilityLabel="Gönder"
            accessibilityRole="button"
            disabled={needsConsent || sending || !text.trim()}
            onPress={() => void onSend()}
            style={[
              styles.send,
              (needsConsent || sending || !text.trim()) && styles.sendDisabled,
            ]}>
            <Ionicons color={colors.white} name="send" size={18} />
          </Pressable>
        </View>
      </KeyboardAvoidingView>

      <ChatConsentModal
        accepting={accepting}
        onAccept={() => void acceptConsent()}
        onClose={() => {
          if (!accepting) router.back();
        }}
        visible={Boolean(needsConsent)}
      />
    </MeshBackground>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  flex: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.cream[200],
    backgroundColor: 'rgba(255,255,255,0.72)',
  },
  back: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  headerMeta: { flex: 1 },
  headerTitle: { fontFamily: fonts.sansSemi, fontSize: 17, color: colors.cream[900] },
  headerSubRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 2,
  },
  headerSub: { fontFamily: fonts.sans, fontSize: 12, color: colors.cream[800] },
  list: { padding: spacing.lg, gap: 8, paddingBottom: spacing.md },
  emptyChat: {
    minHeight: 180,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.lg,
  },
  emptyTitle: {
    marginTop: spacing.sm,
    fontFamily: fonts.sansSemi,
    fontSize: 14,
    color: colors.cream[800],
    textAlign: 'center',
  },
  emptyText: {
    marginTop: 4,
    fontFamily: fonts.sans,
    fontSize: 12,
    color: colors.cream[800],
    opacity: 0.55,
  },
  retryWrap: { paddingHorizontal: spacing.lg, gap: spacing.sm },
  systemBubble: {
    maxWidth: '92%',
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 6,
    borderRadius: radius.lg,
    backgroundColor: colors.warm[50],
    borderWidth: 1,
    borderColor: colors.warm[200],
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginBottom: 8,
  },
  systemText: {
    flex: 1,
    fontFamily: fonts.sans,
    fontSize: 12,
    lineHeight: 17,
    color: colors.cream[800],
  },
  bubble: {
    maxWidth: '82%',
    borderRadius: radius.lg,
    paddingVertical: 10,
    paddingHorizontal: 14,
    marginBottom: 8,
  },
  bubbleMine: {
    alignSelf: 'flex-end',
    backgroundColor: colors.brand[600],
    borderBottomRightRadius: 4,
  },
  bubbleOther: {
    alignSelf: 'flex-start',
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.cream[200],
    borderBottomLeftRadius: 4,
  },
  bubbleText: { fontFamily: fonts.sans, fontSize: 15, color: colors.cream[900], lineHeight: 21 },
  bubbleTextMine: { color: colors.white },
  bubbleTime: {
    fontFamily: fonts.sans,
    fontSize: 10,
    color: colors.cream[800],
    opacity: 0.6,
    marginTop: 4,
    alignSelf: 'flex-end',
  },
  bubbleTimeMine: { color: colors.white },
  composer: {
    flexWrap: 'wrap',
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.cream[200],
    backgroundColor: 'rgba(255,255,255,0.9)',
  },
  liveBadge: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderRadius: radius.lg,
    backgroundColor: colors.sage[50],
    paddingVertical: 5,
    paddingHorizontal: 10,
  },
  liveText: {
    fontFamily: fonts.sansSemi,
    fontSize: 11,
    color: colors.sage[700],
  },
  input: {
    flex: 1,
    minHeight: 44,
    maxHeight: 120,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.cream[200],
    backgroundColor: colors.white,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontFamily: fonts.sans,
    fontSize: 15,
    color: colors.cream[900],
  },
  send: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: colors.brand[600],
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendDisabled: { opacity: 0.45 },
});
