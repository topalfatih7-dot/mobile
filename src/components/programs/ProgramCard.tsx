import { Ionicons } from '@expo/vector-icons';
import { router, type Href } from 'expo-router';
import { StyleSheet, Text, View, type DimensionValue } from 'react-native';

import { Card } from '@/components/ui/Card';
import { IconTile } from '@/components/ui/IconTile';
import { ProgressBar } from '@/components/ui/ProgressBar';
import type { Program } from '@/data/programs';
import { colors, fonts, spacing } from '@/constants/theme';

export function ProgramCard({ program, width = '100%' }: { program: Program; width?: DimensionValue }) {
  return (
    <Card
      onPress={() => router.push(`/program/${program.id}` as Href)}
      padding={spacing.md}
      style={[styles.card, { width }]}>
      <View style={styles.row}>
        <IconTile gradient={program.gradient} icon={program.icon} size={52} />

        <View style={styles.body}>
          <Text style={[styles.category, { color: program.gradient[0] }]}>
            {program.category.toUpperCase()}
          </Text>
          <Text numberOfLines={1} style={styles.title}>
            {program.title}
          </Text>
          <Text style={styles.meta}>
            {program.level} · {program.weeks} hafta
          </Text>
        </View>

        <Ionicons color={colors.ink[300]} name="chevron-forward" size={20} />
      </View>

      <View style={styles.footer}>
        <View style={styles.footerTop}>
          <Text style={styles.perWeek}>{program.perWeek}</Text>
          <Text style={styles.percent}>%{Math.round(program.progress * 100)}</Text>
        </View>
        <ProgressBar gradient={program.gradient} height={7} progress={program.progress} />
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    marginBottom: spacing.md,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  body: {
    flex: 1,
    marginHorizontal: spacing.md,
  },
  category: {
    fontFamily: fonts.bold,
    fontSize: 10.5,
    letterSpacing: 0.8,
  },
  title: {
    fontFamily: fonts.display,
    fontSize: 16,
    color: colors.text.primary,
    marginTop: 2,
  },
  meta: {
    fontFamily: fonts.regular,
    fontSize: 12.5,
    color: colors.text.secondary,
    marginTop: 2,
  },
  footer: {
    marginTop: spacing.md,
  },
  footerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  perWeek: {
    fontFamily: fonts.medium,
    fontSize: 12.5,
    color: colors.text.secondary,
  },
  percent: {
    fontFamily: fonts.bold,
    fontSize: 12.5,
    color: colors.text.primary,
  },
});
