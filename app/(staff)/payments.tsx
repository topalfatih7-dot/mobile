/**
 * LOCK: docs/mobile/screens/staff/payments.md
 * Web mock payout UI — Demo badge; rows from live staffClients (no invented payout math).
 */
import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';

import { PanelScaffold } from '@/components/panel/PanelScaffold';
import { EmptyState } from '@/components/ui/EmptyState';
import { FadeIn } from '@/components/ui/FadeIn';
import { InlineSpinner } from '@/components/ui/InlineSpinner';
import { useData } from '@/context/DataContext';
import { getPlanLabel } from '@/data/membershipPlans';
import { colors, fonts, radius, spacing } from '@/theme';

const PLAN_COLORS: Record<string, { bg: string; fg: string }> = {
  vip: { bg: colors.gold[400], fg: colors.white },
  spor: { bg: colors.brand[100], fg: colors.brand[700] },
  diyet: { bg: colors.sage[100], fg: colors.sage[700] },
  doktor: { bg: colors.warm[100], fg: colors.warm[500] },
  eko: { bg: colors.mint[50], fg: colors.sage[700] },
};

export default function StaffPayments() {
  const { loading, staffClients } = useData();

  return (
    <PanelScaffold subtitle="Hak ediş özeti" title="Ödemeler" titleBadge="Demo">
      <FadeIn delay={40}>
        <View style={styles.card}>
          <View style={styles.kpiIcon}>
            <Ionicons color={colors.sage[600]} name="trending-up" size={18} />
          </View>
          <Text style={styles.kpi}>{staffClients.length}</Text>
          <Text style={styles.label}>Aktif danışan (hakediş hesabı web P2)</Text>
        </View>
      </FadeIn>
      {loading && staffClients.length === 0 ? (
        <InlineSpinner fill />
      ) : staffClients.length === 0 ? (
        <EmptyState title="Danışan yok." />
      ) : (
        staffClients.map((c, i) => {
          const plan = String(c.membership || 'free');
          const colorsFor = PLAN_COLORS[plan] || {
            bg: colors.cream[100],
            fg: colors.cream[800],
          };
          return (
            <FadeIn key={String(c.id)} delay={70 + i * 30}>
              <View style={styles.row}>
                <View style={styles.rowLeft}>
                  <Text style={styles.rowTitle}>{String(c.name)}</Text>
                  <View style={[styles.planBadge, { backgroundColor: colorsFor.bg }]}>
                    <Text style={[styles.planBadgeText, { color: colorsFor.fg }]}>
                      {getPlanLabel(plan)}
                    </Text>
                  </View>
                </View>
                <View style={styles.statusBadge}>
                  <Text style={styles.statusBadgeText}>
                    {String(c.membershipStatus || 'active')}
                  </Text>
                </View>
              </View>
            </FadeIn>
          );
        })
      )}
    </PanelScaffold>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.white,
    borderRadius: radius.xl,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.cream[200],
  },
  kpiIcon: {
    width: 36,
    height: 36,
    borderRadius: radius.full,
    backgroundColor: colors.mint[50],
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  kpi: { fontFamily: fonts.displayExtra, fontSize: 32, color: colors.brand[700] },
  label: { fontFamily: fonts.sans, fontSize: 13, color: colors.cream[800], marginTop: 4 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
    backgroundColor: colors.white,
    borderRadius: radius.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.cream[200],
  },
  rowLeft: { flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1 },
  rowTitle: { fontFamily: fonts.sansSemi, fontSize: 15, color: colors.cream[900] },
  planBadge: {
    borderRadius: radius.full,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  planBadgeText: { fontFamily: fonts.sansSemi, fontSize: 11 },
  statusBadge: {
    borderRadius: radius.full,
    paddingHorizontal: 8,
    paddingVertical: 2,
    backgroundColor: colors.sage[100],
  },
  statusBadgeText: { fontFamily: fonts.sansSemi, fontSize: 11, color: colors.sage[700] },
});
