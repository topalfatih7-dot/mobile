import { Ionicons } from '@expo/vector-icons';
import { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

import { PanelScaffold } from '@/components/panel/PanelScaffold';
import { FadeIn } from '@/components/ui/FadeIn';
import { colors, fonts, radius, spacing } from '@/theme';

const CALLS = [
  { label: 'Kalori metin', count: 128 },
  { label: 'Kalori görsel', count: 34 },
  { label: 'Sağlık analizi', count: 19 },
];

const MAX_CALLS = 128;

function RatioBar({ ratio }: { ratio: number }) {
  const width = useSharedValue(0);
  useEffect(() => {
    width.value = withTiming(ratio, { duration: 300 });
  }, [ratio, width]);
  const fill = useAnimatedStyle(() => ({ width: `${width.value * 100}%` }));
  return (
    <View style={styles.barTrack}>
      <Animated.View style={[styles.barFill, fill]} />
    </View>
  );
}

/** LOCK: docs/mobile/screens/admin/ai-costs.md */
export default function AdminAiCosts() {
  return (
    <PanelScaffold showBack subtitle="AI kullanım özeti" title="AI maliyetleri">
      <FadeIn>
        <View style={styles.card}>
          <View style={styles.kpiIcon}>
            <Ionicons color={colors.gold[400]} name="sparkles" size={20} />
          </View>
          <Text style={styles.kpi}>$42.18</Text>
          <Text style={styles.label}>Bu ay tahmini maliyet</Text>
        </View>
      </FadeIn>
      {CALLS.map((c, i) => (
        <FadeIn delay={40 + i * 40} key={c.label}>
          <View style={styles.row}>
            <Text style={styles.rowLabel}>{c.label}</Text>
            <RatioBar ratio={c.count / MAX_CALLS} />
            <Text style={styles.rowVal}>{c.count} çağrı</Text>
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
    borderRadius: radius.md,
    backgroundColor: `${colors.gold[400]}1F`,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  kpi: { fontFamily: fonts.displayExtra, fontSize: 32, color: colors.brand[700] },
  label: { fontFamily: fonts.sans, fontSize: 13, color: colors.cream[800], marginTop: 4 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.white,
    borderRadius: radius.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.cream[200],
    minHeight: 48,
  },
  rowLabel: { flex: 1, fontFamily: fonts.sans, fontSize: 14, color: colors.cream[800] },
  barTrack: {
    width: 64,
    height: 6,
    borderRadius: radius.full,
    backgroundColor: colors.cream[100],
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    borderRadius: radius.full,
    backgroundColor: colors.brand[100],
  },
  rowVal: { fontFamily: fonts.sansSemi, fontSize: 14, color: colors.cream[900] },
});
