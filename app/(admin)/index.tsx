import { router, type Href } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { BrandMark } from '@/components/brand/BrandMark';
import { ResponsiveCenter } from '@/components/layout/ResponsiveCenter';
import { StaffStatCard } from '@/components/staff/StaffStatCard';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { useApp } from '@/context/AppContext';
import { useAdminDashboard } from '@/hooks/useAdminDashboard';
import { useResponsive } from '@/hooks/useResponsive';
import { getPlanLabel } from '@/data/membershipPlans';
import { colors, fonts, gradients, spacing } from '@/constants/theme';

export default function AdminHomeScreen() {
  const insets = useSafeAreaInsets();
  const { user, logout } = useApp();
  const { stats, members, syncing, refresh } = useAdminDashboard();
  const { horizontalPadding } = useResponsive();

  const onLogout = async () => {
    await logout();
    router.replace('/');
  };

  return (
    <View style={styles.root}>
      <StatusBar style="dark" />
      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingTop: insets.top + spacing.lg, paddingBottom: insets.bottom + spacing.xl },
        ]}
        refreshControl={<RefreshControl onRefresh={refresh} refreshing={syncing} tintColor={colors.brand[600]} />}
        showsVerticalScrollIndicator={false}>
        <ResponsiveCenter innerStyle={{ paddingHorizontal: horizontalPadding }}>
          <BrandMark size={44} />
          <Text style={styles.title}>Admin Paneli</Text>
          <Text style={styles.subtitle}>{user.email}</Text>

          <View style={styles.grid}>
            <StaffStatCard gradient={gradients.brand} icon="people" label="Üye" value={stats.memberCount} />
            <StaffStatCard
              gradient={gradients.coral}
              icon="star"
              label="Premium"
              value={stats.paidMemberCount}
            />
            <StaffStatCard gradient={gradients.violet} icon="briefcase" label="Personel" value={stats.staffCount} />
            <StaffStatCard
              gradient={gradients.teal}
              icon="chatbubbles"
              label="Sohbet"
              value={stats.threadCount}
            />
          </View>

          <Text style={styles.sectionTitle}>Son Üyeler</Text>
          {members.length > 0 ? (
            members.map((member) => (
              <Pressable key={member.id} onPress={() => router.push(`/members/${member.id}` as Href)}>
                <Card padding={spacing.md} style={styles.memberCard}>
                <Text style={styles.memberName}>{member.name}</Text>
                <Text style={styles.memberMeta}>
                  {getPlanLabel(member.membership)} · {member.membershipStatus}
                </Text>
                <Text style={styles.memberEmail}>{member.email}</Text>
                </Card>
              </Pressable>
            ))
          ) : (
            <Card padding={spacing.lg}>
              <Text style={styles.empty}>Henüz üye kaydı yok.</Text>
            </Card>
          )}

          <Button
            label="Personel Mesajları"
            onPress={() => router.push('/(admin)/messages' as Href)}
            style={styles.logout}
            variant="secondary"
          />
          <Button label="Çıkış Yap" onPress={onLogout} style={styles.logout} variant="secondary" />
        </ResponsiveCenter>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  content: { flexGrow: 1 },
  title: {
    marginTop: spacing.md,
    fontFamily: fonts.displayExtra,
    fontSize: 28,
    color: colors.text.primary,
  },
  subtitle: {
    marginTop: spacing.xs,
    fontFamily: fonts.regular,
    fontSize: 14,
    color: colors.text.secondary,
    marginBottom: spacing.xl,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: spacing.xl,
  },
  sectionTitle: {
    fontFamily: fonts.display,
    fontSize: 18,
    color: colors.text.primary,
    marginBottom: spacing.md,
  },
  memberCard: { marginBottom: spacing.sm },
  memberName: { fontFamily: fonts.display, fontSize: 15.5, color: colors.text.primary },
  memberMeta: {
    fontFamily: fonts.medium,
    fontSize: 12.5,
    color: colors.brand[600],
    marginTop: 3,
  },
  memberEmail: {
    fontFamily: fonts.regular,
    fontSize: 12.5,
    color: colors.text.muted,
    marginTop: 2,
  },
  empty: { fontFamily: fonts.regular, fontSize: 14, color: colors.text.secondary },
  logout: { marginTop: spacing.xl },
});
