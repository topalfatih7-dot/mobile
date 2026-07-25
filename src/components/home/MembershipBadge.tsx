import { StyleSheet, Text, View } from 'react-native';

import { getPlanLabel } from '@/data/membershipPlans';
import { colors, fonts, radius, spacing } from '@/theme';

export function MembershipBadge({
  tier,
  status,
}: {
  tier?: string | null;
  status?: string | null;
}) {
  return (
    <View style={styles.wrap}>
      <View style={styles.pill}>
        <Text style={styles.tier}>{getPlanLabel(tier)}</Text>
      </View>
      {status && status !== 'active' ? (
        <View style={[styles.pill, styles.status]}>
          <Text style={styles.statusText}>{status}</Text>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  pill: {
    backgroundColor: colors.brand[50],
    borderColor: colors.brand[200],
    borderWidth: 1,
    borderRadius: radius.full,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  tier: {
    fontFamily: fonts.sansSemi,
    fontSize: 13,
    color: colors.brand[700],
  },
  status: {
    backgroundColor: colors.warm[50],
    borderColor: colors.warm[200],
  },
  statusText: {
    fontFamily: fonts.sansSemi,
    fontSize: 12,
    color: colors.warm[500],
    textTransform: 'capitalize',
  },
});
