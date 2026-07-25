import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';

import { PanelScaffold } from '@/components/panel/PanelScaffold';
import { FadeIn } from '@/components/ui/FadeIn';
import { colors, fonts, radius, spacing } from '@/theme';

const ROWS: { id: string; name: string; plan: string; planBg: string; planFg: string }[] = [
  {
    id: 'ui-demo-member',
    name: 'Demo Üye',
    plan: 'Vip',
    planBg: colors.gold[400],
    planFg: colors.white,
  },
  {
    id: 'ui-client-2',
    name: 'Ayşe Yılmaz',
    plan: 'Spor',
    planBg: colors.brand[100],
    planFg: colors.brand[700],
  },
];

/** LOCK: docs/mobile/screens/staff/payments.md */
export default function StaffPayments() {
  return (
    <PanelScaffold subtitle="Hak ediş özeti" title="Ödemeler" titleBadge="Demo">
      <FadeIn delay={40}>
        <View style={styles.card}>
          <View style={styles.kpiIcon}>
            <Ionicons color={colors.sage[600]} name="trending-up" size={18} />
          </View>
          <Text style={styles.kpi}>₺12.400</Text>
          <Text style={styles.label}>Bu ay tahmini hak ediş</Text>
        </View>
      </FadeIn>
      {ROWS.map((r, i) => (
        <FadeIn key={r.id} delay={70 + i * 30}>
          <View style={styles.row}>
            <View style={styles.rowLeft}>
              <Text style={styles.rowTitle}>{r.name}</Text>
              <View style={[styles.planBadge, { backgroundColor: r.planBg }]}>
                <Text style={[styles.planBadgeText, { color: r.planFg }]}>{r.plan}</Text>
              </View>
            </View>
            <View style={styles.statusBadge}>
              <Text style={styles.statusBadgeText}>Aktif</Text>
            </View>
          </View>
        </FadeIn>
      ))}
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
