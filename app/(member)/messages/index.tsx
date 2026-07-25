import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams, type Href } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { EmptyState } from '@/components/ui/EmptyState';
import { FadeIn } from '@/components/ui/FadeIn';
import { MeshBackground } from '@/components/ui/MeshBackground';
import { useData, useMember } from '@/context/DataContext';
import {
  loadMemberChat,
  subscribeMemberChat,
  type ChatThread,
} from '@/services/chat';
import { getMemberChatContacts } from '@/utils/chatContacts';
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

/**
 * LOCK: docs/mobile/screens/member/messages.md
 */
export default function MessagesIndex() {
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ role?: string }>();
  const member = useMember();
  const { staffById } = useData();
  const [threads, setThreads] = useState<ChatThread[]>([]);

  const contacts = useMemo(
    () => getMemberChatContacts(member, staffById),
    [member, staffById],
  );

  const reload = useCallback(async () => {
    if (!member?.id) {
      setThreads([]);
      return;
    }
    try {
      const snap = await loadMemberChat(
        contacts,
        String(member.id),
        String(member?.name || 'Üye'),
      );
      setThreads(snap.threads);
    } catch {
      setThreads([]);
    }
  }, [contacts, member?.id, member?.name]);

  useEffect(() => {
    void reload();
    return subscribeMemberChat(() => {
      void reload();
    });
  }, [reload]);

  const roles = useMemo(
    () => [...new Set(contacts.map((c) => c.staffRole))],
    [contacts],
  );

  const roleParam = Array.isArray(params.role) ? params.role[0] : params.role;
  const activeRole =
    roleParam && roles.includes(roleParam as never)
      ? roleParam
      : roles[0] || 'coach';

  const visibleThreads = threads.filter((t) => t.staffRole === activeRole);
  const sortedThreads = visibleThreads.slice().sort((a, b) => {
    const unreadDiff = Number(b.memberUnread > 0) - Number(a.memberUnread > 0);
    if (unreadDiff) return unreadDiff;
    return (
      new Date(b.lastMessageAt || b.createdAt || 0).getTime() -
      new Date(a.lastMessageAt || a.createdAt || 0).getTime()
    );
  });

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

        {roles.length === 0 ? (
          <EmptyState
            description="Premium paketinizde koç, diyetisyen veya doktor atandığında buradan mesajlaşabilirsiniz."
            icon="chatbubbles-outline"
            title="Mesajlaşma henüz aktif değil"
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
            <View style={styles.tabs}>
              {roles.map((role) => {
                const on = role === activeRole;
                const unread = threads
                  .filter((t) => t.staffRole === role)
                  .reduce((a, t) => a + (t.memberUnread || 0), 0);
                return (
                  <Pressable
                    accessibilityLabel={`${ROLE_LABEL[role] || role} sekmesi`}
                    accessibilityRole="button"
                    key={role}
                    onPress={() => router.setParams({ role })}
                    style={[styles.tab, on && styles.tabOn]}>
                    <Text style={[styles.tabLabel, on && styles.tabLabelOn]}>
                      {ROLE_LABEL[role] || role}
                    </Text>
                    {unread > 0 ? (
                      <View style={styles.badge}>
                        <Text style={styles.badgeText}>{unread}</Text>
                      </View>
                    ) : null}
                  </Pressable>
                );
              })}
            </View>

            {sortedThreads.length === 0 ? (
              <EmptyState title="Sohbet yok" description="Bu rol için henüz konuşma yok." />
            ) : (
              sortedThreads.map((t, i) => (
                <ThreadRow key={t.id} delay={60 + i * 35} thread={t} />
              ))
            )}
          </>
        )}
      </ScrollView>
    </MeshBackground>
  );
}

function ThreadRow({ thread, delay }: { thread: ChatThread; delay: number }) {
  return (
    <FadeIn delay={delay}>
      <Pressable
        onPress={() => router.push(`/(member)/messages/${thread.staffRole}` as Href)}
        style={({ pressed }) => [styles.row, pressed && styles.pressed]}>
        <View
          style={[
            styles.avatar,
            { backgroundColor: ROLE_AVATAR[thread.staffRole] || colors.brand[500] },
          ]}>
          <Ionicons color={colors.white} name="person" size={18} />
        </View>
        <View style={styles.meta}>
          <Text style={styles.name}>{thread.staffName}</Text>
          <Text
            numberOfLines={1}
            style={[styles.preview, !thread.lastPreview && styles.previewEmpty]}>
            {thread.lastPreview || 'Sohbete başlayın'}
          </Text>
        </View>
        {thread.memberUnread > 0 ? (
          <View style={styles.unread}>
            <Text style={styles.unreadText}>{thread.memberUnread}</Text>
          </View>
        ) : (
          <Ionicons color={colors.cream[300]} name="chevron-forward" size={18} />
        )}
      </Pressable>
    </FadeIn>
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
  tabs: { flexDirection: 'row', gap: 8, marginBottom: spacing.sm },
  safety: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.warm[200],
    backgroundColor: colors.warm[50],
    padding: spacing.md,
  },
  safetyText: {
    flex: 1,
    fontFamily: fonts.sans,
    fontSize: 12,
    lineHeight: 18,
    color: colors.cream[800],
  },
  tab: {
    flex: 1,
    minHeight: 44,
    borderRadius: radius.lg,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.brand[200],
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 6,
    paddingHorizontal: 8,
  },
  tabOn: { backgroundColor: colors.brand[600], borderColor: colors.brand[600] },
  tabLabel: { fontFamily: fonts.sansSemi, fontSize: 13, color: colors.brand[700] },
  tabLabelOn: { color: colors.white },
  badge: {
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: colors.warm[500],
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  badgeText: { fontFamily: fonts.sansSemi, fontSize: 10, color: colors.white },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.white,
    borderRadius: radius.xl,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.cream[200],
    minHeight: 72,
  },
  pressed: { opacity: 0.92 },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: colors.brand[500],
    alignItems: 'center',
    justifyContent: 'center',
  },
  meta: { flex: 1 },
  name: { fontFamily: fonts.sansSemi, fontSize: 16, color: colors.cream[900] },
  preview: { fontFamily: fonts.sans, fontSize: 13, color: colors.cream[800], marginTop: 2 },
  previewEmpty: { fontStyle: 'italic', opacity: 0.5 },
  unread: {
    minWidth: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: colors.brand[600],
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
  },
  unreadText: { fontFamily: fonts.sansSemi, fontSize: 11, color: colors.white },
});
