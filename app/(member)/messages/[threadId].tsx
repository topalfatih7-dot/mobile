import { Ionicons } from '@expo/vector-icons';
import { format } from 'date-fns';
import { router, useLocalSearchParams, type Href } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  FlatList,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import Animated, { withTiming } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button } from '@/components/ui/Button';
import { MeshBackground } from '@/components/ui/MeshBackground';
import { useData, useMember } from '@/context/DataContext';
import { useToast } from '@/context/ToastContext';
import {
  loadMemberChat,
  markChatThreadRead,
  recordChatConsent,
  sendChatMessage,
  subscribeMemberChat,
  type ChatMessage,
  type ChatThread,
} from '@/services/chat';
import { getMemberChatContacts } from '@/utils/chatContacts';
import { colors, fonts, radius, spacing } from '@/theme';

const CHAT_CONSENT_TEXT = `Bu mesajlaşma alanı, atanmış koçunuz, diyetisyeniniz ve/veya doktorunuzla paketiniz kapsamında iletişim kurmanız içindir.

Gönderdiğiniz ve aldığınız tüm mesajlar güvenli şekilde kaydedilir; hizmet kalitesi, uyumluluk ve olası süreç takipleri için saklanabilir.

Tıbbi acil durumlarda bu kanalı kullanmayın; 112 veya en yakın sağlık kuruluşuna başvurun.`;

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
 */
export default function MessageThreadScreen() {
  const insets = useSafeAreaInsets();
  const { threadId: rawId } = useLocalSearchParams<{ threadId: string }>();
  const threadRef = String(rawId || '');
  const member = useMember();
  const { staffById } = useData();
  const { toast } = useToast();
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [thread, setThread] = useState<ChatThread | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);

  const contacts = useMemo(
    () => getMemberChatContacts(member, staffById),
    [member, staffById],
  );

  const reload = useCallback(async () => {
    if (!member?.id) {
      setThread(null);
      setMessages([]);
      setLoaded(true);
      return;
    }
    try {
      const snap = await loadMemberChat(
        contacts,
        String(member.id),
        String(member?.name || 'Üye'),
      );
      const t =
        snap.threads.find(
          (row) => row.id === threadRef || row.staffRole === threadRef,
        ) || null;
      setThread(t);
      setMessages(t ? snap.messages[t.id] || [] : []);
    } catch {
      setThread(null);
      setMessages([]);
    } finally {
      setLoaded(true);
    }
  }, [contacts, member?.id, member?.name, threadRef]);

  useEffect(() => {
    void reload();
    return subscribeMemberChat(() => {
      void reload();
    }, member?.id ? String(member.id) : undefined);
  }, [reload, member?.id]);

  useEffect(() => {
    if (!loaded) return;
    if (!thread) {
      router.replace('/(member)/messages' as Href);
      return;
    }
    void markChatThreadRead(thread.id).catch(() => {});
  }, [loaded, thread?.id]);

  const needsConsent = thread && !thread.memberConsentAt;

  const onSend = async () => {
    if (!member?.id || !thread) return;
    setSending(true);
    const res = await sendChatMessage(thread.id, String(member.id), text);
    setSending(false);
    if (!res.success) {
      toast(res.error, 'error');
      return;
    }
    setText('');
    void reload();
  };

  const sortedMessages = useMemo(
    () =>
      messages.slice().sort(
        (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
      ),
    [messages],
  );

  if (!loaded || !thread) {
    return <MeshBackground style={styles.root} />;
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
            <Text style={styles.headerTitle}>{thread.staffName}</Text>
            <Text style={styles.headerSub}>
              {thread.staffRole === 'dietitian'
                ? 'Diyetisyen'
                : thread.staffRole === 'doctor'
                  ? 'Doktor'
                  : 'Koç'}
            </Text>
          </View>
        </View>

        <FlatList
          contentContainerStyle={styles.list}
          data={sortedMessages}
          keyExtractor={(m) => m.id}
          ListEmptyComponent={
            <View style={styles.emptyChat}>
              <Ionicons color={colors.cream[300]} name="chatbubble-outline" size={38} />
              <Text style={styles.emptyTitle}>{thread.staffName} ile sohbete başlayın</Text>
              <Text style={styles.emptyText}>Mesajlar güvenli şekilde saklanır.</Text>
            </View>
          }
          renderItem={({ item }) => {
            const mine = item.senderType === 'member';
            if (item.senderType === 'system') {
              return (
                <View style={styles.systemBubble}>
                  <Ionicons color={colors.gold[500]} name="information-circle-outline" size={16} />
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

      <Modal animationType="fade" transparent visible={Boolean(needsConsent)}>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <View style={styles.modalBadge}>
              <Ionicons color={colors.brand[600]} name="shield-checkmark" size={24} />
            </View>
            <Text style={styles.modalTitle}>Mesajlaşma Bilgilendirmesi</Text>
            <Text style={styles.modalBody}>{CHAT_CONSENT_TEXT}</Text>
            <Button
              label="Okudum, mesajlaşmaya başla"
              onPress={() => {
                void recordChatConsent(thread.id)
                  .then(() => {
                    void reload();
                  })
                  .catch(() => {
                    toast('Onay kaydedilemedi.', 'error');
                  });
              }}
            />
            <Button
              label="Vazgeç"
              onPress={() => router.back()}
              variant="ghost"
            />
          </View>
        </View>
      </Modal>
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
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(26,35,50,0.45)',
    justifyContent: 'center',
    padding: spacing.lg,
  },
  modalCard: {
    backgroundColor: colors.white,
    borderRadius: radius.xl,
    padding: spacing.lg,
    gap: spacing.md,
  },
  modalBadge: {
    width: 48,
    height: 48,
    borderRadius: radius.lg,
    backgroundColor: colors.brand[100],
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalTitle: { fontFamily: fonts.displayExtra, fontSize: 20, color: colors.cream[900] },
  modalBody: { fontFamily: fonts.sans, fontSize: 14, color: colors.cream[800], lineHeight: 20 },
});
