import { StyleSheet, Text, View } from 'react-native';

import type { ProfileInfoRow } from '@/services/memberProfile';
import { colors, fonts, radius, spacing } from '@/constants/theme';

export function ProfileInfoGrid({ rows }: { rows: ProfileInfoRow[] }) {
  return (
    <View style={styles.grid}>
      {rows.map((row) => (
        <View key={row.label} style={styles.cell}>
          <Text style={styles.label}>{row.label}</Text>
          <Text style={styles.value}>{row.value}</Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  cell: {
    width: '48%',
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 2,
  },
  label: {
    fontFamily: fonts.semibold,
    fontSize: 10.5,
    letterSpacing: 0.6,
    textTransform: 'uppercase',
    color: colors.brand[600],
  },
  value: {
    fontFamily: fonts.medium,
    fontSize: 13.5,
    color: colors.text.primary,
    marginTop: 4,
    lineHeight: 19,
  },
});
