import { router, type Href } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { RefreshControl, ScrollView, StyleSheet, View } from 'react-native';

import { DashboardHeader } from '@/components/home/DashboardHeader';
import { QuickActions } from '@/components/home/QuickActions';
import { SessionCard } from '@/components/home/SessionCard';
import { StatCard } from '@/components/home/StatCard';
import { TodayRow } from '@/components/home/TodayRow';
import { WeeklyChart } from '@/components/home/WeeklyChart';
import { ResponsiveCenter } from '@/components/layout/ResponsiveCenter';
import { Card } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { useApp } from '@/context/AppContext';
import { useResponsive } from '@/hooks/useResponsive';
import { colors, spacing } from '@/constants/theme';

function formatDateLabel(date = new Date()) {
  return date
    .toLocaleDateString('tr-TR', {
      day: 'numeric',
      month: 'long',
      weekday: 'long',
    })
    .toLocaleUpperCase('tr-TR');
}

export default function HomeScreen() {
  const {
    user,
    member,
    syncing,
    refresh,
    dailyGoal,
    dailyStats,
    todayPlan,
    nextSession,
    weeklyActivity,
    toggleTask,
  } = useApp();
  const { statCardWidth, horizontalPadding } = useResponsive();

  const displayName = user.name?.trim() || 'Üye';
  const streakDays = typeof member?.streak === 'number' ? member.streak : 0;

  return (
    <View style={styles.root}>
      <StatusBar style="light" />

      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl onRefresh={refresh} refreshing={syncing} tintColor={colors.brand[600]} />}
        showsVerticalScrollIndicator={false}>
        <DashboardHeader
          dateLabel={formatDateLabel()}
          goalCompleted={dailyGoal.completed}
          goalProgress={dailyGoal.progress}
          goalTotal={dailyGoal.total || 0}
          name={displayName}
          streakDays={streakDays}
        />

        <ResponsiveCenter innerStyle={{ paddingHorizontal: horizontalPadding }}>
          <View style={styles.section}>
            <QuickActions />
          </View>

          <View style={styles.section}>
            <SectionHeader subtitle="Günlük hedeflerine göre" title="Bugünkü Özetin" />
            <View style={styles.grid}>
              {dailyStats.map((stat) => (
                <StatCard key={stat.id} stat={stat} width={statCardWidth} />
              ))}
            </View>
          </View>

          {nextSession ? (
            <View style={styles.section}>
              <SectionHeader
                actionLabel="Takvim"
                onActionPress={() => router.push('/profile/team' as Href)}
                title="Yaklaşan Görüşme"
              />
              <SessionCard session={nextSession} />
            </View>
          ) : null}

          <View style={styles.section}>
            <SectionHeader
              actionLabel="Tümü"
              onActionPress={() => router.push('/programs' as Href)}
              title="Bugünkü Planın"
            />
            {todayPlan.length > 0 ? (
              todayPlan.map((item) => (
                <TodayRow item={item} key={item.id} onToggle={(id) => void toggleTask(id)} />
              ))
            ) : (
              <EmptyState
                subtitle="Koçun veya diyetisyenin program atadığında görevlerin burada listelenir."
                title="Bugün için görev yok"
              />
            )}
          </View>

          <View style={styles.section}>
            <SectionHeader subtitle="Son 7 gün" title="Haftalık Aktivite" />
            <Card padding={spacing.lg}>
              <WeeklyChart data={weeklyActivity} />
            </Card>
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
  section: {
    marginBottom: spacing.xl,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
});
