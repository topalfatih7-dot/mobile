import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { format } from 'date-fns';
import { router, useFocusEffect, useLocalSearchParams, Redirect, type Href } from 'expo-router';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  AppState,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import Animated, { FadeInUp } from 'react-native-reanimated';

import { ChatConsentModal } from '@/components/chat/ChatConsentModal';
import { ChatCollapsiblePrograms } from '@/components/chat/ChatCollapsiblePrograms';
import { ChatDateChip } from '@/components/chat/ChatDateChip';
import { ChatKeyboardLayout } from '@/components/chat/ChatKeyboardLayout';
import { PresenceIndicator } from '@/components/chat/PresenceIndicator';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { InlineSpinner } from '@/components/ui/InlineSpinner';
import { MeshBackground } from '@/components/ui/MeshBackground';
import { useData, useMember } from '@/context/DataContext';
import { useToast } from '@/context/ToastContext';
import { useActions } from '@/context/ActionsContext';
import { useChatPresence } from '@/hooks/useChatPresence';
import { setActiveChatThreadId } from '@/services/activeChatThread';
import {
  CHAT_MESSAGE_PAGE_SIZE,
  ensureMemberChatThreads,
  fetchThreadMessagesPage,
  markChatThreadRead,
  parseChatMessageRow,
  recordChatConsent,
  sendChatMessage,
  subscribeChatThreadMessages,
  type ChatMessage,
  type ChatThread,
} from '@/services/chat';
import { CHAT_CONSENT_KEY, getMemberChatContacts } from '@/utils/chatContacts';
import { toInvertedChatRows } from '@/utils/chatTranscript';
import { mergeLiveMessage } from '@/utils/liveChatMerge';
import { enteringNative } from '@/utils/reanimatedEntering';
import { chatComposerWebKeyDownProps } from '@/utils/chatComposerSubmit';
import { colors, fonts, radius, spacing } from '@/theme';

const ROLE_LABEL: Record<string, string> = {
  coach: 'Koç',
  dietitian: 'Diyetisyen',
  doctor: 'Doktor',
};

/** Yeni balon: alttan fade (02-design-system motion). Web: predefined only. */
const bubbleEntering = FadeInUp.duration(150);

/**
 * LOCK: docs/mobile/screens/member/messages.md — thread + consent + composer
 * Web: MessagesPage.jsx /messages/:role
 */
export default function MessageThreadScreen() {
  const { threadId: rawId } = useLocalSearchParams<{ threadId: string }>();
  const threadRef = String(rawId || '');
  const member = useMember();
  const { staffById, loading: dataLoading, myPrograms, isUnpaidMember } = useData();
  const { toast } = useToast();
  const { markRelatedChatNotificationsRead } = useActions();
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [thread, setThread] = useState<ChatThread | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [localConsent, setLocalConsent] = useState(false);
  const [accepting, setAccepting] = useState(false);
  /** Expo Router stack: thread ekranı unmount olmayabilir — focus ile okundu (web: activeThread.id effect). */
  const focusedRef = useRef(false);
  const threadSnapRef = useRef<ChatThread | null>(null);
  threadSnapRef.current = thread;
  const markReadTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const contacts = useMemo(
    () => getMemberChatContacts(member, staffById),
    [member, staffById],
  );

  const contact = useMemo(
    () => contacts.find((c) => c.staffRole === threadRef) || null,
    [contacts, threadRef],
  );

  const peerId = contact?.staffId || null;
  const presenceIds = useMemo(() => (peerId ? [peerId] : []), [peerId]);
  const { isOnline, lastSeenAt } = useChatPresence(presenceIds);

  const memberId = member?.id ? String(member.id) : '';
  const memberName = String(member?.name || 'Üye');
  const contactStaffId = contact?.staffId || '';
  const contactRole = contact?.staffRole;
  const contactsRef = useRef(contacts);
  contactsRef.current = contacts;
  const contactRef = useRef(contact);
  contactRef.current = contact;
  const loadGenRef = useRef(0);

  useEffect(() => {
    void AsyncStorage.getItem(CHAT_CONSENT_KEY).then((v) => {
      if (v === '1') setLocalConsent(true);
    });
  }, []);

  /** Web AppContext: mark sonrası chatThreads patch — RN’de lokal state + DB. */
  const clearMemberUnread = useCallback(async (id: string) => {
    setThread((prev) => {
      if (!prev || prev.id !== id) return prev;
      if (Number(prev.memberUnread || 0) === 0) return prev;
      return { ...prev, memberUnread: 0 };
    });
    try {
      await markChatThreadRead(id);
    } catch (e) {
      if (__DEV__) console.warn('[chat] markChatThreadRead', e);
    }
  }, []);

  const scheduleMarkRead = useCallback(
    (id: string) => {
      if (markReadTimerRef.current) clearTimeout(markReadTimerRef.current);
      markReadTimerRef.current = setTimeout(() => {
        void clearMemberUnread(id);
      }, 300);
    },
    [clearMemberUnread],
  );

  const markReadFromComposer = useCallback(() => {
    const t = threadSnapRef.current;
    if (!t?.id) return;
    void clearMemberUnread(t.id);
  }, [clearMemberUnread]);

  const reload = useCallback(async () => {
    if (!memberId) {
      return;
    }
    const gen = loadGenRef.current;
    const keepUi = Boolean(threadSnapRef.current);
    const contactNow = contactRef.current;
    const stillCurrent = () => gen === loadGenRef.current;
    // loadedReady: only mark `loaded` when we have a definitive result.
    // When contact is missing AND data is still loading, we keep loaded=false
    // so the spinner stays on screen instead of flashing the error/retry view.
    let loadedReady = false;
    try {
      setLoadError(null);
      if (!contactNow) {
        if (!keepUi && stillCurrent()) {
          setThread(null);
          setMessages([]);
        }
        if (!dataLoading) {
          // Data finished loading but no contact found → genuine missing assignment.
          setLoadError('Bu sohbet bulunamadı. Uzman atamanızı kontrol edin.');
          loadedReady = true;
        }
        // While dataLoading=true, leave loaded=false so the spinner persists.
        return;
      }
      const threads = await ensureMemberChatThreads(
        contactsRef.current,
        memberId,
        memberName,
      );
      if (!stillCurrent()) return;
      const t =
        threads.find(
          (row) => row.id === threadRef || row.staffRole === contactNow.staffRole,
        ) || null;
      setThread(t);
      // Live inserts already merge in; don't replace the list (or unmount the
      // composer) when member/notifications identity changes on each message.
      if (!keepUi || threadSnapRef.current?.id !== t?.id) {
        const page = t
          ? await fetchThreadMessagesPage(t.id, { limit: CHAT_MESSAGE_PAGE_SIZE })
          : [];
        if (!stillCurrent()) return;
        setMessages(page);
      }
      if (!stillCurrent()) return;
      if (!t) {
        setLoadError('Bu sohbet bulunamadı. Uzman atamanızı kontrol edin.');
      } else if (focusedRef.current) {
        setActiveChatThreadId(t.id);
        if (Number(t.memberUnread || 0) > 0) {
          void clearMemberUnread(t.id);
        }
      }
      loadedReady = true;
    } catch (e) {
      if (!stillCurrent()) return;
      setLoadError(e instanceof Error ? e.message : 'Sohbet yüklenemedi');
      if (!keepUi) {
        setThread(null);
        setMessages([]);
      }
      loadedReady = true;
    } finally {
      if (stillCurrent() && loadedReady) setLoaded(true);
    }
  }, [clearMemberUnread, dataLoading, memberId, memberName, threadRef]);

  useEffect(() => {
    loadGenRef.current += 1;
    threadSnapRef.current = null;
    setLoaded(false);
    setThread(null);
    setMessages([]);
  }, [threadRef]);

  useEffect(() => {
    void reload();
  }, [reload, contactStaffId, contactRole]);

  useEffect(() => {
    const id = thread?.id;
    if (!id) return;
    return subscribeChatThreadMessages(id, (change) => {
      if (!change.newRow) return;
      const incoming = parseChatMessageRow(change.newRow);
      setMessages((prev) => mergeLiveMessage(prev, incoming));
      if (focusedRef.current) {
        scheduleMarkRead(id);
      }
    });
  }, [thread?.id, scheduleMarkRead]);

  useEffect(
    () => () => {
      if (markReadTimerRef.current) clearTimeout(markReadTimerRef.current);
    },
    [],
  );

  // Web MessagesPage: sohbet açılınca markChatThreadRead — RN’de useFocusEffect
  // (stack’te ekran mount kalır; yeniden focus = yeniden okundu).
  useFocusEffect(
    useCallback(() => {
      focusedRef.current = true;
      const t = threadSnapRef.current;
      if (t?.id) {
        setActiveChatThreadId(t.id);
        void clearMemberUnread(t.id);
      }
      if (threadRef) {
        void markRelatedChatNotificationsRead({
          type: 'chat',
          staffRole: threadRef,
        });
      }
      return () => {
        focusedRef.current = false;
        setActiveChatThreadId(null);
      };
    }, [clearMemberUnread, markRelatedChatNotificationsRead, threadRef]),
  );

  // Arka plandan dönüşte focus event gelmeyebilir — AppState ile tamamla
  useEffect(() => {
    const sub = AppState.addEventListener('change', (state) => {
      if (state !== 'active' || !focusedRef.current) return;
      const t = threadSnapRef.current;
      if (!t?.id) return;
      setActiveChatThreadId(t.id);
      if (Number(t.memberUnread || 0) > 0) {
        void clearMemberUnread(t.id);
      }
    });
    return () => sub.remove();
  }, [clearMemberUnread]);

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
    if (res.message) {
      setMessages((prev) => mergeLiveMessage(prev, res.message as ChatMessage));
    }
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

  const invertedRows = useMemo(() => toInvertedChatRows(messages), [messages]);

  const title = contact?.name || thread?.staffName || 'Sohbet';
  const subtitle =
    ROLE_LABEL[contact?.staffRole || ''] || contact?.staffRole || '';
  const staffRole = String(thread?.staffRole || threadRef || '');
  const peerOnline = peerId ? isOnline(peerId) : false;
  const peerLastSeen = peerId ? lastSeenAt(peerId) : null;

  if (isUnpaidMember) {
    return <Redirect href={'/(member)/messages' as Href} />;
  }

  if (!loaded) {
    return (
      <MeshBackground style={styles.root}>
        <InlineSpinner fill />
      </MeshBackground>
    );
  }

  if (!member?.id && dataLoading) {
    return (
      <MeshBackground style={styles.root}>
        <InlineSpinner fill />
      </MeshBackground>
    );
  }

  if (dataLoading && !contact && !thread) {
    return (
      <MeshBackground style={styles.root}>
        <InlineSpinner fill />
      </MeshBackground>
    );
  }

  if (!thread) {
    return (
      <MeshBackground style={styles.root}>
        <View style={[styles.header, { paddingTop: spacing.sm }]}>
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
          description={
            loadError ||
            'Paketinizdeki uzman ataması tamamlanınca buradan mesajlaşabilirsiniz. Atama profilinizde görünecektir.'
          }
          icon="chatbubble-ellipses-outline"
          title={contact ? 'Sohbet bulunamadı' : 'Uzmanınız atanıyor'}
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
      <View style={styles.flex}>
        <View style={[styles.header, { paddingTop: spacing.sm }]}>
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

        <ChatKeyboardLayout
          list={
            <FlatList
              contentContainerStyle={styles.list}
              data={invertedRows}
              inverted
              keyboardDismissMode="on-drag"
              keyboardShouldPersistTaps="handled"
              keyExtractor={(row) => row.id}
              ListEmptyComponent={
                <View style={[styles.emptyChat, styles.emptyInverted]}>
                  <Ionicons color={colors.cream[300]} name="chatbubble-outline" size={38} />
                  <Text style={styles.emptyTitle}>{title} ile sohbete başlayın</Text>
                  <Text style={styles.emptyText}>Mesajlar güvenli şekilde saklanır.</Text>
                </View>
              }
              renderItem={({ item: row }) => {
                if (row.kind === 'date') {
                  return <ChatDateChip label={row.label} />;
                }
                const item = row.message;
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
                    entering={enteringNative(bubbleEntering)}
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
          }
          composer={
            <View style={styles.composer}>
              <View style={styles.liveBadge}>
                <Ionicons color={colors.sage[600]} name="radio-outline" size={14} />
                <Text style={styles.liveText}>Canlı — mesajlar kayıt altına alınır</Text>
              </View>
              <TextInput
                editable={!needsConsent}
                multiline
                onChangeText={(value) => {
                  setText(value);
                  if (value.trim()) markReadFromComposer();
                }}
                onFocus={markReadFromComposer}
                placeholder={needsConsent ? 'Önce onay gerekli' : 'Mesaj yazın…'}
                placeholderTextColor={colors.cream[300]}
                style={styles.input}
                value={text}
                {...chatComposerWebKeyDownProps(() => void onSend())}
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
          }
        />
      </View>

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
  emptyInverted: { transform: [{ scaleY: -1 }] },
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
    minHeight: 52,
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
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: colors.brand[600],
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendDisabled: { opacity: 0.45 },
});
