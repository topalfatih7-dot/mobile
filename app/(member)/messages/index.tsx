/**
 * LOCK: docs/mobile/screens/member/messages.md
 * Web parity: MessagesPage.jsx — flat contact inbox (tek dokunuşla sohbet)
 */
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router, useFocusEffect, type Href } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ChatConsentModal } from '@/components/chat/ChatConsentModal';
import { PresenceIndicator } from '@/components/chat/PresenceIndicator';
import { EmptyState } from '@/components/ui/EmptyState';
import { FadeIn } from '@/components/ui/FadeIn';
import { InlineSpinner } from '@/components/ui/InlineSpinner';
import { MeshBackground } from '@/components/ui/MeshBackground';
import { useChatUnread } from '@/context/ChatUnreadContext';
import { useData, useMember } from '@/context/DataContext';
import { useToast } from '@/context/ToastContext';
import { useChatPresence } from '@/hooks/useChatPresence';
import {
  ensureMemberChatThreads,
  recordChatConsent,
  type ChatThread,
} from '@/services/chat';
import { CHAT_CONSENT_KEY, getMemberChatContacts, memberHasChatAccess } from '@/utils/chatContacts';
import { colors, fonts, radius, spacing } from '@/theme';

const ROLE_LABEL: Record<string, string> = {
  coach: 'Koç',
  dietitian: 'Diyetisyen',
  doctor: 'Doktor',
};

const ROLE_AVATAR: Record<string, string> = {
  coach: colors.brand[500],
  dietitian: colors.sage[500],
  doctor: colors.warm[400],
};

export default function MessagesIndex() {
  const insets = useSafeAreaInsets();
  const member = useMember();
  const { staffById, loading: dataLoading } = useData();
  const { subscribeBump } = useChatUnread();
  const { toast } = useToast();
  const [threads, setThreads] = useState<ChatThread[]>([]);
  const [busy, setBusy] = useState(true);
  const [localConsent, setLocalConsent] = useState(false);
  const [pendingRole, setPendingRole] = useState<string | null>(null);
  const [accepting, setAccepting] = useState(false);

  const contacts = useMemo(
    () => getMemberChatContacts(member, staffById),
    [member, staffById],
  );

  const peerIds = useMemo(
    () => contacts.map((c) => c.staffId).filter(Boolean),
    [contacts],
  );
  const { isOnline, lastSeenAt } = useChatPresence(peerIds);

  useEffect(() => {
    void AsyncStorage.getItem(CHAT_CONSENT_KEY).then((v) => {
      if (v === '1') setLocalConsent(true);
    });
  }, []);

  const reload = useCallback(async () => {
    if (!member?.id) {
      setThreads([]);
      setBusy(false);
      return;
    }
    try {
      const list = await ensureMemberChatThreads(
        contacts,
        String(member.id),
        String(member.name || 'Üye'),
      );
      setThreads(list);
    } catch (e) {
      toast(e instanceof Error ? e.message : 'Mesajlar yüklenemedi', 'error');
    } finally {
      setBusy(false);
    }
  }, [contacts, member?.id, member?.name, toast]);

  // Layout owns chat subscription; inbox listens to shared bump
  useEffect(() => subscribeBump(() => void reload()), [subscribeBump, reload]);

  // Thread’den dönüşte rozet tazele (Expo Router stack — web navigate('/messages') eşleniği)
  useFocusEffect(
    useCallback(() => {
      setBusy(true);
      void reload();
    }, [reload]),
  );

  const inbox = useMemo(() => {
    return contacts
      .map((c) => {
        const thread = threads.find((t) => t.staffRole === c.staffRole) || null;
        return { contact: c, thread };
      })
      .sort((a, b) => {
        const ua = Number(a.thread?.memberUnread || 0) > 0 ? 1 : 0;
        const ub = Number(b.thread?.memberUnread || 0) > 0 ? 1 : 0;
        if (ua !== ub) return ub - ua;
        const ma = a.thread?.lastMessageAt
          ? new Date(a.thread.lastMessageAt).getTime()
          : 0;
        const mb = b.thread?.lastMessageAt
          ? new Date(b.thread.lastMessageAt).getTime()
          : 0;
        return mb - ma;
      });
  }, [contacts, threads]);

  const openThread = (role: string) => {
    const thread = threads.find((t) => t.staffRole === role);
    const hasConsent =
      localConsent || Boolean(thread?.memberConsentAt);
    if (!hasConsent) {
      setPendingRole(role);
      return;
    }
    router.push(`/(member)/messages/${role}` as Href);
  };

  /** Web MessagesPage.handleConsent — local önce, DB best-effort, modal kapanır */
  const acceptConsent = async () => {
    if (!pendingRole || accepting) return;
    const role = pendingRole;
    setAccepting(true);
    try {
      await AsyncStorage.setItem(CHAT_CONSENT_KEY, '1');
      setLocalConsent(true);
      setPendingRole(null);
      router.push(`/(member)/messages/${role}` as Href);
      const thread = threads.find((t) => t.staffRole === role);
      if (thread?.id) void recordChatConsent(thread.id);
    } catch {
      toast('Onay kaydedilemedi. Tekrar deneyin.', 'error');
    } finally {
      setAccepting(false);
    }
  };

  const waitingMember = !member?.id && dataLoading;
  const waitingStaffDir =
    Boolean(member?.id) &&
    dataLoading &&
    contacts.length === 0 &&
    memberHasChatAccess(member);

  return (
    <MeshBackground style={styles.root}>
      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingTop: insets.top + 12, paddingBottom: insets.bottom + 32 },
        ]}>
        <FadeIn>
          <Pressable
            accessibilityLabel="Geri"
            accessibilityRole="button"
            hitSlop={10}
            onPress={() => router.back()}
            style={styles.back}>
            <Ionicons color={colors.brand[600]} name="chevron-back" size={22} />
            <Text style={styles.backText}>Geri</Text>
          </Pressable>
          <Text style={styles.title}>Mesajlar</Text>
          <Text style={styles.sub}>Paketinize atanmış uzmanlarınızla iletişim</Text>
        </FadeIn>

        {waitingMember || waitingStaffDir || (busy && contacts.length === 0 && threads.length === 0) ? (
          <InlineSpinner fill />
        ) : contacts.length === 0 ? (
          <EmptyState
            description="Paketinizdeki uzman ataması tamamlanınca buradan mesajlaşabilirsiniz. Atama profilinizde görünecektir."
            icon="chatbubbles-outline"
            title="Uzmanınız atanıyor"
          />
        ) : (
          <>
            <View style={styles.safety}>
              <Ionicons color={colors.gold[500]} name="shield-checkmark-outline" size={18} />
              <Text style={styles.safetyText}>
                Tüm mesajlar güvenli şekilde saklanır. Tıbbi acil durumlarda 112&apos;yi
                arayın.
              </Text>
            </View>
            {inbox.map(({ contact, thread }, i) => (
              <FadeIn delay={40 + i * 35} key={contact.staffRole}>
                <Pressable
                  onPress={() => openThread(contact.staffRole)}
                  style={({ pressed }) => [styles.row, pressed && styles.pressed]}>
                  <View
                    style={[
                      styles.avatar,
                      {
                        backgroundColor:
                          ROLE_AVATAR[contact.staffRole] || colors.brand[500],
                      },
                    ]}>
                    <Text style={styles.avatarText}>
                      {String(contact.name || '?').charAt(0).toUpperCase()}
                    </Text>
                    <View style={styles.presenceDot}>
                      <PresenceIndicator
                        lastSeenAt={lastSeenAt(contact.staffId)}
                        online={isOnline(contact.staffId)}
                      />
                    </View>
                  </View>
                  <View style={styles.meta}>
                    <Text style={styles.name}>{contact.name}</Text>
                    <Text style={styles.role}>
                      {ROLE_LABEL[contact.staffRole] || contact.staffRole}
                      {' · '}
                      {isOnline(contact.staffId) ? 'Çevrimiçi' : 'Çevrimdışı'}
                    </Text>
                    <Text
                      numberOfLines={1}
                      style={[
                        styles.preview,
                        !thread?.lastPreview && styles.previewEmpty,
                      ]}>
                      {thread?.lastPreview || 'Sohbete başlayın'}
                    </Text>
                  </View>
                  {thread && thread.memberUnread > 0 ? (
                    <View style={styles.unread}>
                      <Text style={styles.unreadText}>{thread.memberUnread}</Text>
                    </View>
                  ) : (
                    <Ionicons color={colors.cream[300]} name="chevron-forward" size={18} />
                  )}
                </Pressable>
              </FadeIn>
            ))}
          </>
        )}
      </ScrollView>

      <ChatConsentModal
        accepting={accepting}
        onAccept={() => void acceptConsent()}
        onClose={() => {
          if (!accepting) setPendingRole(null);
        }}
        visible={Boolean(pendingRole)}
      />
    </MeshBackground>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  content: { paddingHorizontal: spacing.lg, gap: spacing.sm },
  back: { flexDirection: 'row', alignItems: 'center' },
  backText: { fontFamily: fonts.sansSemi, fontSize: 15, color: colors.brand[600] },
  title: { fontFamily: fonts.displayExtra, fontSize: 28, color: colors.cream[900] },
  sub: {
    fontFamily: fonts.sans,
    fontSize: 14,
    color: colors.cream[800],
    marginBottom: spacing.sm,
  },
  safety: {
    flexDirection: 'row',
    gap: 10,
    alignItems: 'flex-start',
    backgroundColor: colors.warm[50],
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.warm[200],
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  safetyText: {
    flex: 1,
    fontFamily: fonts.sans,
    fontSize: 13,
    color: colors.cream[800],
    lineHeight: 18,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: colors.white,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.cream[200],
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  pressed: { opacity: 0.92 },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  presenceDot: {
    position: 'absolute',
    right: -1,
    bottom: -1,
    backgroundColor: colors.white,
    borderRadius: 10,
    padding: 2,
  },
  avatarText: { fontFamily: fonts.sansSemi, fontSize: 18, color: colors.white },
  meta: { flex: 1 },
  name: { fontFamily: fonts.sansSemi, fontSize: 16, color: colors.cream[900] },
  role: { fontFamily: fonts.sans, fontSize: 12, color: colors.brand[600], marginTop: 1 },
  preview: { fontFamily: fonts.sans, fontSize: 13, color: colors.cream[800], marginTop: 2 },
  previewEmpty: { color: colors.cream[300] },
  unread: {
    minWidth: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: colors.brand[500],
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
  },
  unreadText: { fontFamily: fonts.sansSemi, fontSize: 11, color: colors.white },
});
