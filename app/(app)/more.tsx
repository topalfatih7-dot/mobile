import { Ionicons } from '@expo/vector-icons';
import { router, type Href } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View } from 'react-native';
import type { ComponentProps } from 'react';

import { PressableScale } from '@/components/ui/PressableScale';
import { Screen } from '@/components/ui/Screen';
import { AppHeader } from '@/components/ui/AppHeader';
import { useApp } from '@/context/AppContext';
import { colors, fonts, radius, spacing } from '@/constants/theme';

type IconName = ComponentProps<typeof Ionicons>['name'];

type MoreLink = {
  href: Href;
  label: string;
  icon: IconName;
  tint: string;
};

const MORE_LINKS: MoreLink[] = [
  { href: '/profile' as Href, label: 'Profil', icon: 'person-outline', tint: colors.teal[600] },
  { href: '/health-test' as Href, label: 'Sağlık Testi', icon: 'heart-outline', tint: colors.coral[500] },
  { href: '/calendar' as Href, label: 'Takvim', icon: 'calendar-outline', tint: colors.teal[500] },
  { href: '/calorie' as Href, label: 'Kalori', icon: 'flame-outline', tint: colors.coral[600] },
  { href: '/schedule' as Href, label: 'Randevular', icon: 'calendar-clear-outline', tint: colors.champagne },
  { href: '/library' as Href, label: 'Kütüphane', icon: 'library-outline', tint: colors.teal[700] },
  { href: '/profile/notifications' as Href, label: 'Bildirimler', icon: 'notifications-outline', tint: colors.amber[500] },
  { href: '/profile/support' as Href, label: 'Destek', icon: 'help-circle-outline', tint: colors.violet[500] },
  { href: '/profile/payments' as Href, label: 'Ödeme', icon: 'wallet-outline', tint: colors.champagne },
  { href: '/profile/membership' as Href, label: 'Planlar', icon: 'diamond-outline', tint: colors.teal[600] },
];

export default function MoreScreen() {
  const { notificationUnreadCount } = useApp();

  return (
    <Screen scroll aurora contentStyle={styles.content}>
      <StatusBar style="dark" />
      <AppHeader subtitle="Diğer üye araçları" title="Daha" />

      <View style={styles.list}>
        {MORE_LINKS.map((link) => {
          const badge =
            link.href === '/profile/notifications' && notificationUnreadCount > 0
              ? notificationUnreadCount
              : 0;
          return (
            <PressableScale
              key={String(link.href)}
              accessibilityRole="button"
              onPress={() => router.push(link.href)}
              scaleTo={0.98}
              style={styles.row}>
              <View style={[styles.iconWrap, { backgroundColor: `${link.tint}18` }]}>
                <Ionicons color={link.tint} name={link.icon} size={20} />
              </View>
              <Text style={styles.label}>{link.label}</Text>
              {badge > 0 ? (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>{badge > 99 ? '99+' : badge}</Text>
                </View>
              ) : null}
              <Ionicons color={colors.ink[300]} name="chevron-forward" size={18} />
            </PressableScale>
          );
        })}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: 0,
    paddingBottom: spacing.xxl,
  },
  list: {
    marginHorizontal: spacing.lg,
    borderRadius: radius.lg,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    flex: 1,
    fontFamily: fonts.semibold,
    fontSize: 15.5,
    color: colors.text.primary,
  },
  badge: {
    minWidth: 22,
    height: 22,
    paddingHorizontal: 6,
    borderRadius: radius.full,
    backgroundColor: colors.coral[500],
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: {
    fontFamily: fonts.bold,
    fontSize: 11,
    color: colors.white,
  },
});
