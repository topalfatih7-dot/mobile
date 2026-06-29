import { router, type Href } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';

import { ResponsiveCenter } from '@/components/layout/ResponsiveCenter';
import { StaffStatCard } from '@/components/staff/StaffStatCard';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { useApp } from '@/context/AppContext';
import { useStaffDashboard } from '@/hooks/useStaffDashboard';
import { useResponsive } from '@/hooks/useResponsive';
import { colors, fonts, gradients, spacing } from '@/constants/theme';

function formatAppointmentDate(date?: string) {
  if (!date) return '—';
  const parsed = new Date(date);
  if (Number.isNaN(parsed.getTime())) return date;
  return parsed.toLocaleDateString('tr-TR', { day: 'numeric', month: 'short', weekday: 'short' });
}

export default function StaffOverviewScreen() {
  const { user } = useApp();
  const { roleLabel, stats, syncing, refresh } = useStaffDashboard();
  const { horizontalPadding } = useResponsive();
  const firstName = user.name?.split(' ')[0] || 'Merhaba';

  return (
    <View style={styles.root}>
      <StatusBar style="dark" />
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl onRefresh={refresh} refreshing={syncing} tintColor={colors.brand[600]} />}
        showsVerticalScrollIndicator={false}>
        <ResponsiveCenter innerStyle={{ paddingHorizontal: horizontalPadding }}>
          <View style={styles.hero}>
            <Text style={styles.greeting}>Merhaba, {firstName}</Text>
            <Text style={styles.subtitle}>{roleLabel}</Text>
          </View>

          <View style={styles.grid}>
            <StaffStatCard
              gradient={gradients.brand}
              icon="people"
              label="Danışan"
              sub="Aktif ücretli üye"
              value={stats.clientCount}
            />
            <StaffStatCard
              gradient={gradients.forest}
              icon="calendar"
              label="Bu Hafta"
              sub="Planlanan görüşme"
              value={stats.weekAppointments}
            />
            <StaffStatCard
              gradient={gradients.coral}
              icon="clipboard"
              label="Program"
              sub="Oluşturduğun"
              value={stats.programCount}
            />
            <StaffStatCard
              gradient={gradients.violet}
              icon="chatbubbles"
              label="Mesaj"
              sub="Açık sohbet"
              value={stats.clientCount}
            />
          </View>

          <SectionHeader title="Yaklaşan Görüşmeler" />
          {stats.upcomingAppointments.length > 0 ? (
            stats.upcomingAppointments.map((item) => (
              <Card key={`${item.memberId}-${item.id}`} padding={spacing.md} style={styles.appointment}>
                <Text style={styles.appointmentName}>{item.memberName}</Text>
                <Text style={styles.appointmentMeta}>
                  {formatAppointmentDate(item.date)} · {item.time || '—'} · {item.type || 'Görüşme'}
                </Text>
                <Button
                  label="Görüşmeye Katıl"
                  leftIcon="videocam"
                  onPress={() => router.push(`/call/${item.sessionType}/${item.id}` as Href)}
                  size="sm"
                  style={styles.joinBtn}
                  variant="secondary"
                />
              </Card>
            ))
          ) : (
            <EmptyState
              subtitle="Danışanlarınızla planlanmış görüşme olduğunda burada listelenir."
              title="Yaklaşan görüşme yok"
            />
          )}
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
    paddingTop: spacing.xl,
    paddingBottom: spacing.xxl,
  },
  hero: {
    marginBottom: spacing.lg,
  },
  greeting: {
    fontFamily: fonts.displayExtra,
    fontSize: 28,
    color: colors.text.primary,
  },
  subtitle: {
    fontFamily: fonts.medium,
    fontSize: 14,
    color: colors.text.secondary,
    marginTop: 4,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: spacing.xl,
  },
  appointment: {
    marginBottom: spacing.sm,
  },
  appointmentName: {
    fontFamily: fonts.display,
    fontSize: 15.5,
    color: colors.text.primary,
  },
  appointmentMeta: {
    fontFamily: fonts.regular,
    fontSize: 13,
    color: colors.text.secondary,
    marginTop: 4,
  },
  joinBtn: {
    marginTop: spacing.sm,
    alignSelf: 'flex-start',
  },
});
