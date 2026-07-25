import { Ionicons } from '@expo/vector-icons';
import { router, type Href } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';

import { EmptyState } from '@/components/ui/EmptyState';
import { FadeIn } from '@/components/ui/FadeIn';
import { MeshBackground } from '@/components/ui/MeshBackground';
import { useActions } from '@/context/ActionsContext';
import { useMember } from '@/context/DataContext';
import { colors, fonts, radius, spacing } from '@/theme';

type Notif = {
  id: string;
  type?: string;
  title?: string;
  message?: string;
  text?: string;
  read?: boolean;
  createdAt?: string;
  staffRole?: string;
  action?: string;
};

type FilterId = 'unread' | 'all' | 'read';

const FILTERS: { id: FilterId; label: string }[] = [
  { id: 'unread', label: 'Okunmamışlar' },
  { id: 'all', label: 'Tümü' },
  { id: 'read', label: 'Okunanlar' },
];

/**
 * LOCK: docs/mobile/screens/member/notifications.md
 */
export default function NotificationsScreen() {
  const insets = useSafeAreaInsets();
  const member = useMember();
  const { markNotificationRead, markAllNotificationsRead, flushNotificationReads } =
    useActions();
  const [filter, setFilter] = useState<FilterId>('all');

  useEffect(() => {
    return () => {
      void flushNotificationReads();
    };
  }, [flushNotificationReads]);

  const all = useMemo(
    () =>
      (((member?.notifications as Notif[]) || []) as Notif[])
        .slice()
        .sort(
          (a, b) =>
            new Date(String(b.createdAt || 0)).getTime() -
            new Date(String(a.createdAt || 0)).getTime(),
        ),
    [member?.notifications],
  );

  const unreadCount = all.filter((n) => !n.read).length;
  const visible = all.filter((n) => {
    if (filter === 'unread') return !n.read;
    if (filter === 'read') return Boolean(n.read);
    return true;
  });

  const openNotif = async (n: Notif) => {
    await markNotificationRead(n.id);
    if (n.type === 'chat' && n.staffRole) {
      router.push(`/(member)/messages/${n.staffRole}` as Href);
      return;
    }
    if (n.type === 'program') {
      router.push('/(member)/programs' as Href);
      return;
    }
    if (n.type === 'availability' || n.action === 'availability') {
      router.push('/(member)/calendar?avail=1' as Href);
      return;
    }
    if (n.type === 'support-reply' || n.type === 'support') {
      router.push('/(member)/support' as Href);
    }
  };

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
          <View style={styles.headRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.title}>Bildirimler</Text>
              <Text style={styles.sub}>
                {unreadCount > 0
                  ? `${unreadCount} okunmamış mesajınız var`
                  : 'Her şey güncel görünüyor'}
              </Text>
            </View>
            {unreadCount > 0 ? (
              <Pressable
                accessibilityLabel="Bildirimleri okundu işaretle"
                accessibilityRole="button"
                onPress={() => markAllNotificationsRead()}
                style={styles.markAll}>
                <Text style={styles.markAllText}>Tümünü okundu işaretle</Text>
              </Pressable>
            ) : null}
          </View>
        </FadeIn>

        <View style={styles.filters}>
          {FILTERS.map((f) => {
            const on = f.id === filter;
            return (
              <Pressable
                accessibilityLabel={`${f.label} filtresi`}
                accessibilityRole="button"
                key={f.id}
                onPress={() => setFilter(f.id)}
                style={[styles.filter, on && styles.filterOn]}>
                <Text style={[styles.filterText, on && styles.filterTextOn]}>{f.label}</Text>
              </Pressable>
            );
          })}
        </View>

        {visible.length === 0 ? (
          <EmptyState
            description="Yeni bildirimler burada görünecek."
            icon="notifications-outline"
            title="Bildirim yok"
          />
        ) : (
          visible.map((n, i) => (
            <FadeIn key={n.id} delay={40 + i * 30}>
              <Pressable
                onPress={() => openNotif(n)}
                style={[styles.card, !n.read && styles.cardUnread]}>
                <View
                  style={[
                    styles.dot,
                    { backgroundColor: n.read ? colors.cream[200] : colors.brand[500] },
                  ]}
                />
                <View style={{ flex: 1 }}>
                  <Text style={styles.cardTitle}>{n.title || 'Bildirim'}</Text>
                  {n.message || n.text ? (
                    <Text numberOfLines={2} style={styles.cardMsg}>
                      {n.message || n.text}
                    </Text>
                  ) : null}
                  {n.createdAt ? (
                    <Text style={styles.cardTime}>
                      {format(new Date(n.createdAt), 'd MMM · HH:mm', { locale: tr })}
                    </Text>
                  ) : null}
                </View>
                <Ionicons color={colors.cream[300]} name="chevron-forward" size={16} />
              </Pressable>
            </FadeIn>
          ))
        )}
      </ScrollView>
    </MeshBackground>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  content: { paddingHorizontal: spacing.lg, gap: spacing.sm },
  back: { flexDirection: 'row', alignItems: 'center' },
  backText: { fontFamily: fonts.sansSemi, fontSize: 15, color: colors.brand[600] },
  headRow: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.sm },
  title: { fontFamily: fonts.displayExtra, fontSize: 28, color: colors.cream[900] },
  sub: { fontFamily: fonts.sans, fontSize: 14, color: colors.cream[800], marginTop: 4 },
  markAll: {
    marginTop: 6,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: radius.lg,
    backgroundColor: colors.brand[50],
    borderWidth: 1,
    borderColor: colors.brand[200],
    maxWidth: 140,
  },
  markAllText: {
    fontFamily: fonts.sansSemi,
    fontSize: 11,
    color: colors.brand[700],
    textAlign: 'center',
  },
  filters: { flexDirection: 'row', gap: 8, marginVertical: spacing.sm },
  filter: {
    flex: 1,
    minHeight: 40,
    borderRadius: radius.lg,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.cream[200],
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  filterOn: { backgroundColor: colors.brand[600], borderColor: colors.brand[600] },
  filterText: { fontFamily: fonts.sansSemi, fontSize: 12, color: colors.cream[800] },
  filterTextOn: { color: colors.white },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.white,
    borderRadius: radius.xl,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.cream[200],
  },
  cardUnread: { borderColor: colors.brand[200], backgroundColor: colors.brand[50] },
  dot: { width: 8, height: 8, borderRadius: 4 },
  cardTitle: { fontFamily: fonts.sansSemi, fontSize: 15, color: colors.cream[900] },
  cardMsg: { fontFamily: fonts.sans, fontSize: 13, color: colors.cream[800], marginTop: 2 },
  cardTime: { fontFamily: fonts.sans, fontSize: 11, color: colors.cream[800], marginTop: 4 },
});
