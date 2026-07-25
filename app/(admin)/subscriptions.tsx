import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';

import { PanelScaffold } from '@/components/panel/PanelScaffold';
import { FadeIn } from '@/components/ui/FadeIn';
import { colors, fonts, radius, spacing } from '@/theme';

/** LOCK: docs/mobile/screens/admin/subscriptions.md */
export default function AdminSubscriptions() {
  return (
    <PanelScaffold showBack subtitle="Abonelik özeti" title="Abonelikler">
      <View style={styles.grid}>
        <FadeIn style={styles.cell}>
          <View style={styles.card}>
            <View style={[styles.iconBox, { backgroundColor: colors.sage[100] }]}>
              <Ionicons color={colors.sage[600]} name="checkmark-circle" size={20} />
            </View>
            <Text style={styles.kpi}>86</Text>
            <Text style={styles.label}>Aktif ücretli üyelik</Text>
          </View>
        </FadeIn>
        <FadeIn delay={40} style={styles.cell}>
          <View style={styles.card}>
            <View style={[styles.iconBox, { backgroundColor: colors.warm[100] }]}>
              <Ionicons color={colors.warm[500]} name="time" size={20} />
            </View>
            <Text style={[styles.kpi, styles.kpiWarn]}>12</Text>
            <Text style={styles.label}>7 gün içinde bitiyor</Text>
          </View>
        </FadeIn>
      </View>
    </PanelScaffold>
  );
}

const styles = StyleSheet.create({
  grid: { flexDirection: 'row', gap: spacing.sm },
  cell: { flex: 1 },
  card: {
    backgroundColor: colors.white,
    borderRadius: radius.xl,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.cream[200],
    gap: 6,
  },
  iconBox: {
    width: 36,
    height: 36,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  kpi: { fontFamily: fonts.displayExtra, fontSize: 28, color: colors.brand[700] },
  kpiWarn: { color: colors.warm[500] },
  label: { fontFamily: fonts.sans, fontSize: 13, color: colors.cream[800] },
});
