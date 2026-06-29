import { Ionicons } from '@expo/vector-icons';
import { router, type Href } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { ProfileHeader } from '@/components/profile/ProfileHeader';
import { ResponsiveCenter } from '@/components/layout/ResponsiveCenter';
import { Card } from '@/components/ui/Card';
import { PressableScale } from '@/components/ui/PressableScale';
import { useApp } from '@/context/AppContext';
import { PROFILE_LINKS } from '@/data/user';
import { useResponsive } from '@/hooks/useResponsive';
import { buildProfileStats } from '@/services/memberProfile';
import { colors, fonts, radius, shadows, spacing } from '@/constants/theme';

const LINK_ROUTES: Partial<Record<string, Href>> = {
  membership: '/profile/membership',
  coach: '/profile/team',
  measurements: '/profile/measurements',
  notifications: '/profile/notifications',
  settings: '/profile/settings',
  support: '/profile/support',
};

export default function ProfileScreen() {
  const { user, member, programs, logout } = useApp();
  const { horizontalPadding, isTablet } = useResponsive();

  const displayName = user.name || 'Üye';
  const plan = (member?.membership as string) || 'free';
  const goal = (member?.goal as string) || 'Sağlıklı yaşam';
  const profileStats = buildProfileStats(member, programs);

  const onLogout = async () => {
    await logout();
    router.replace('/');
  };

  const onLinkPress = (id: string) => {
    const route = LINK_ROUTES[id];
    if (route) router.push(route);
  };

  return (
    <View style={styles.root}>
      <StatusBar style="light" />

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <ProfileHeader email={user.email} goal={goal} name={displayName} plan={plan} />

        <ResponsiveCenter innerStyle={{ paddingHorizontal: horizontalPadding }}>
          <View style={[styles.statsCard, isTablet && styles.statsCardTablet]}>
            {profileStats.map((stat) => (
              <View key={stat.id} style={styles.statCell}>
                <Text style={styles.statValue}>
                  {stat.value}
                  {stat.unit ? <Text style={styles.statUnit}> {stat.unit}</Text> : null}
                </Text>
                <Text style={styles.statLabel}>{stat.label}</Text>
              </View>
            ))}
          </View>

          <View style={styles.section}>
            <Card padding={0}>
              {PROFILE_LINKS.map((link, i) => (
                <PressableScale
                  key={link.id}
                  onPress={() => onLinkPress(link.id)}
                  scaleTo={0.98}
                  style={[styles.link, i > 0 && styles.linkBorder]}>
                  <View style={[styles.linkIcon, { backgroundColor: link.tint }]}>
                    <Ionicons color={colors.white} name={link.icon} size={18} />
                  </View>
                  <Text style={styles.linkLabel}>{link.label}</Text>
                  <Ionicons color={colors.ink[300]} name="chevron-forward" size={18} />
                </PressableScale>
              ))}
            </Card>
          </View>

          <View style={styles.section}>
            <PressableScale onPress={onLogout} scaleTo={0.98} style={styles.logout}>
              <Ionicons color={colors.danger} name="log-out-outline" size={20} />
              <Text style={styles.logoutText}>Çıkış Yap</Text>
            </PressableScale>
            <Text style={styles.version}>Yeni Form · Sürüm 1.0.0</Text>
          </View>
        </ResponsiveCenter>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    paddingBottom: spacing.xxl,
  },
  statsCard: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: -spacing.xxl,
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.sm,
    ...shadows.card,
  },
  statsCardTablet: {
    marginTop: -spacing.xl,
    paddingVertical: spacing.xl,
  },
  statCell: {
    width: '50%',
    alignItems: 'center',
    paddingVertical: spacing.sm,
  },
  statValue: {
    fontFamily: fonts.displayExtra,
    fontSize: 20,
    color: colors.text.primary,
  },
  statUnit: {
    fontFamily: fonts.medium,
    fontSize: 12,
    color: colors.text.muted,
  },
  statLabel: {
    fontFamily: fonts.medium,
    fontSize: 12.5,
    color: colors.text.secondary,
    marginTop: 3,
  },
  section: {
    marginTop: spacing.xl,
  },
  link: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: 14,
  },
  linkBorder: {
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  linkIcon: {
    width: 38,
    height: 38,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  linkLabel: {
    flex: 1,
    fontFamily: fonts.semibold,
    fontSize: 15,
    color: colors.text.primary,
  },
  logout: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    height: 54,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  logoutText: {
    fontFamily: fonts.bold,
    fontSize: 15,
    color: colors.danger,
  },
  version: {
    textAlign: 'center',
    fontFamily: fonts.regular,
    fontSize: 12.5,
    color: colors.text.muted,
    marginTop: spacing.lg,
  },
});
