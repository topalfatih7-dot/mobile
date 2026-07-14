import { Ionicons } from '@expo/vector-icons';
import { router, type Href } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { AppHeader } from '@/components/ui/AppHeader';
import { Button } from '@/components/ui/Button';
import { PressableScale } from '@/components/ui/PressableScale';
import { Screen } from '@/components/ui/Screen';
import { useApp } from '@/context/AppContext';
import {
  getCompletedSections,
  HEALTH_SECTIONS_META,
  type HealthSectionMeta,
} from '@/data/healthTestSections';
import { colors, fonts, radius, spacing } from '@/constants/theme';

function audienceLabel(audience: HealthSectionMeta['audience']) {
  if (audience === 'coach') return 'Koç';
  if (audience === 'dietitian') return 'Diyetisyen';
  return 'Genel';
}

export default function HealthTestHubScreen() {
  const { member } = useApp();
  const completed = useMemo(() => getCompletedSections(member?.healthTest), [member?.healthTest]);
  const progress = HEALTH_SECTIONS_META.length
    ? Math.round((completed.length / HEALTH_SECTIONS_META.length) * 100)
    : 0;

  return (
    <Screen scroll contentStyle={styles.screen}>
      <StatusBar style="dark" />
      <AppHeader
        showBack
        subtitle={`${completed.length}/${HEALTH_SECTIONS_META.length} bölüm · %${progress}`}
        title="Sağlık Testi"
      />

      <View style={styles.content}>
      <View style={styles.progressCard}>
        <Text style={styles.progressTitle}>İlerleme</Text>
        <View style={styles.track}>
          <View style={[styles.fill, { width: `${progress}%` }]} />
        </View>
      </View>

      <View style={styles.list}>
        {HEALTH_SECTIONS_META.map((section) => {
          const done = completed.includes(section.id);
          return (
            <PressableScale
              key={section.id}
              onPress={() => router.push(`/health-test/${section.id}` as Href)}
              scaleTo={0.98}
              style={styles.row}>
              <View style={[styles.icon, done && styles.iconDone]}>
                <Ionicons
                  color={done ? colors.white : colors.teal[600]}
                  name={done ? 'checkmark' : section.icon}
                  size={18}
                />
              </View>
              <View style={styles.meta}>
                <Text style={styles.title}>{section.title}</Text>
                <Text style={styles.subtitle}>{section.subtitle}</Text>
                <Text style={styles.audience}>{audienceLabel(section.audience)}</Text>
              </View>
              <Ionicons color={colors.ink[300]} name="chevron-forward" size={18} />
            </PressableScale>
          );
        })}
      </View>

      <Button
        label="Bitir"
        onPress={() => router.push('/health-test/finish' as Href)}
        variant="secondary"
      />
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
  progressCard: {
    padding: spacing.md,
    borderRadius: radius.lg,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  progressTitle: {
    fontFamily: fonts.semibold,
    fontSize: 13,
    color: colors.text.secondary,
    marginBottom: spacing.sm,
  },
  track: {
    height: 8,
    borderRadius: radius.full,
    backgroundColor: colors.surfaceAlt,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    backgroundColor: colors.teal[500],
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
  icon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.teal[50],
  },
  iconDone: {
    backgroundColor: colors.teal[600],
  },
  meta: {
    flex: 1,
  },
  title: {
    fontFamily: fonts.semibold,
    fontSize: 15,
    color: colors.text.primary,
  },
  subtitle: {
    marginTop: 2,
    fontFamily: fonts.regular,
    fontSize: 13,
    color: colors.text.secondary,
  },
  audience: {
    marginTop: 4,
    fontFamily: fonts.medium,
    fontSize: 11.5,
    color: colors.champagne,
  },
});
