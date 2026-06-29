import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';

import { Card } from '@/components/ui/Card';
import { IconTile } from '@/components/ui/IconTile';
import { colors, fonts, spacing, type Gradient } from '@/constants/theme';
import type { IoniconName } from '@/types';

type StaffStatCardProps = {
  label: string;
  value: string | number;
  sub?: string;
  icon: IoniconName;
  gradient: Gradient;
};

export function StaffStatCard({ label, value, sub, icon, gradient }: StaffStatCardProps) {
  return (
    <Card contentStyle={styles.inner} padding={spacing.md} style={styles.card}>
      <IconTile gradient={gradient} icon={icon} size={40} />
      <Text style={styles.value}>{value}</Text>
      <Text style={styles.label}>{label}</Text>
      {sub ? <Text style={styles.sub}>{sub}</Text> : null}
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    width: '48%',
    marginBottom: spacing.md,
  },
  inner: {
    gap: spacing.xs,
  },
  value: {
    fontFamily: fonts.displayExtra,
    fontSize: 22,
    color: colors.text.primary,
    marginTop: spacing.xs,
  },
  label: {
    fontFamily: fonts.semibold,
    fontSize: 13,
    color: colors.text.primary,
  },
  sub: {
    fontFamily: fonts.regular,
    fontSize: 11.5,
    color: colors.text.muted,
  },
});
