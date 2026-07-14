import { Ionicons } from '@expo/vector-icons';
import { router, type Href } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { Button } from '@/components/ui/Button';
import { AppHeader } from '@/components/ui/AppHeader';
import { EmptyState } from '@/components/ui/EmptyState';
import { PressableScale } from '@/components/ui/PressableScale';
import { Screen } from '@/components/ui/Screen';
import { useApp } from '@/context/AppContext';
import {
  formatSessionWhen,
  getAllUpcomingSessions,
  sessionRoleLabel,
} from '@/utils/memberSessions';
import { colors, fonts, radius, spacing } from '@/constants/theme';

export default function CalendarScreen() {
  const { member, nextSession } = useApp();
  const upcoming = useMemo(() => getAllUpcomingSessions(member), [member]);

  const monthLabel = new Date().toLocaleDateString('tr-TR', { month: 'long', year: 'numeric' });

  return (
    <Screen scroll contentStyle={styles.screen}>
      <StatusBar style="dark" />
      <AppHeader showBack subtitle={monthLabel} title="Takvim" />

      <View style={styles.content}>
      <Button
        label="Randevu al"
        onPress={() => router.push('/schedule' as Href)}
        rightIcon="calendar"
        variant="secondary"
      />

      {nextSession ? (
        <View style={styles.nextCard}>
          <Text style={styles.nextLabel}>Sıradaki seans</Text>
          <Text style={styles.nextTitle}>
            {nextSession.coach} · {nextSession.role}
          </Text>
          <Text style={styles.nextWhen}>
            {nextSession.date}, {nextSession.time} · {nextSession.durationMin} dk
          </Text>
        </View>
      ) : null}

      {upcoming.length === 0 ? (
        <EmptyState
          subtitle="Planlanmış seanslarınız olduğunda burada listelenir. Yeni randevu için Randevu al’a dokunun."
          title="Yaklaşan seans yok"
        />
      ) : (
        <View style={styles.list}>
          {upcoming.map((session) => (
            <PressableScale
              key={session.id || `${session.sessionType}-${session.date}-${session.time}`}
              onPress={() => router.push(`/schedule` as Href)}
              scaleTo={0.98}
              style={styles.row}>
              <View style={styles.dot} />
              <View style={styles.meta}>
                <Text style={styles.role}>{sessionRoleLabel(session.sessionType)}</Text>
                <Text style={styles.name}>{session.coachName || session.coach || 'Uzmanınız'}</Text>
                <Text style={styles.when}>{formatSessionWhen(session)}</Text>
              </View>
              <Ionicons color={colors.ink[300]} name="chevron-forward" size={18} />
            </PressableScale>
          ))}
        </View>
      )}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  screen: {
    paddingHorizontal: 0,
    paddingBottom: spacing.xxl,
  },
  content: {
    paddingHorizontal: spacing.lg,
    gap: spacing.md,
  },
  nextCard: {
    padding: spacing.lg,
    borderRadius: radius.lg,
    backgroundColor: colors.teal[600],
  },
  nextLabel: {
    fontFamily: fonts.medium,
    fontSize: 12,
    color: 'rgba(255,255,255,0.8)',
  },
  nextTitle: {
    marginTop: 4,
    fontFamily: fonts.displaySemibold,
    fontSize: 18,
    color: colors.white,
  },
  nextWhen: {
    marginTop: 6,
    fontFamily: fonts.regular,
    fontSize: 14,
    color: 'rgba(255,255,255,0.9)',
  },
  list: {
    gap: spacing.sm,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.md,
    borderRadius: radius.lg,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.teal[500],
  },
  meta: {
    flex: 1,
  },
  role: {
    fontFamily: fonts.medium,
    fontSize: 12,
    color: colors.text.secondary,
  },
  name: {
    fontFamily: fonts.semibold,
    fontSize: 15,
    color: colors.text.primary,
    marginTop: 2,
  },
  when: {
    marginTop: 2,
    fontFamily: fonts.regular,
    fontSize: 13,
    color: colors.text.secondary,
  },
});
