import { StyleSheet, Text, View, type DimensionValue } from 'react-native';

import { Card } from '@/components/ui/Card';
import { IconTile } from '@/components/ui/IconTile';
import { ProgressBar } from '@/components/ui/ProgressBar';
import type { DailyStat } from '@/data/dashboard';
import { colors, fonts, spacing } from '@/constants/theme';

export function StatCard({ stat, width = '48%' }: { stat: DailyStat; width?: DimensionValue }) {
  return (
    <Card contentStyle={styles.inner} padding={spacing.md} style={[styles.card, { width }]}>
      <IconTile gradient={stat.gradient} icon={stat.icon} size={42} />

      <Text style={styles.value}>
        {stat.value}
        <Text style={styles.unit}> {stat.unit}</Text>
      </Text>
      <Text style={styles.label}>{stat.label}</Text>

      <ProgressBar gradient={stat.gradient} height={6} progress={stat.progress} />
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    marginBottom: spacing.md,
  },
  inner: {
    gap: spacing.sm,
  },
  value: {
    fontFamily: fonts.display,
    fontSize: 21,
    color: colors.text.primary,
  },
  unit: {
    fontFamily: fonts.medium,
    fontSize: 12,
    color: colors.text.muted,
  },
  label: {
    fontFamily: fonts.medium,
    fontSize: 13,
    color: colors.text.secondary,
    marginTop: -4,
    marginBottom: 2,
  },
});
