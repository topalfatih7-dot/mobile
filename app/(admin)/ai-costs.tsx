/**
 * LOCK: docs/mobile/screens/admin/ai-costs.md — /api/auth action ai-usage-report
 */
import { Ionicons } from '@expo/vector-icons';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

import { PanelScaffold } from '@/components/panel/PanelScaffold';
import { EmptyState } from '@/components/ui/EmptyState';
import { FadeIn } from '@/components/ui/FadeIn';
import { InlineSpinner } from '@/components/ui/InlineSpinner';
import { postJson } from '@/services/api';
import { colors, fonts, radius, spacing } from '@/theme';

const ENDPOINT_LABELS: Record<string, string> = {
  'food-text': 'Kalori metin',
  'food-vision': 'Kalori görsel',
  'program-basic': 'AI program (Basic)',
  'program-eko': 'AI program (Eko)',
  'blog-generate': 'Blog üretimi',
  'daily-tip': 'Günün ipucu',
  other: 'Diğer',
};

type UsageReport = {
  totalCostUsd?: number;
  totalCalls?: number;
  byEndpoint?: Record<string, { calls?: number; costUsd?: number }>;
};

function formatUsd(n: number) {
  const v = Number(n) || 0;
  if (v === 0) return '$0.00';
  if (v < 0.01) return `$${v.toFixed(6)}`;
  return `$${v.toFixed(4)}`;
}

function RatioBar({ ratio }: { ratio: number }) {
  const width = useSharedValue(0);
  useEffect(() => {
    width.value = withTiming(Math.min(1, Math.max(0, ratio)), { duration: 300 });
  }, [ratio, width]);
  const fill = useAnimatedStyle(() => ({ width: `${width.value * 100}%` }));
  return (
    <View style={styles.barTrack}>
      <Animated.View style={[styles.barFill, fill]} />
    </View>
  );
}

export default function AdminAiCosts() {
  const [days, setDays] = useState(30);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<UsageReport | null>(null);

  const load = useCallback(async (d: number) => {
    setLoading(true);
    setError(null);
    const res = await postJson<UsageReport>('/api/auth', {
      action: 'ai-usage-report',
      days: d,
    });
    setLoading(false);
    if (!res.ok) {
      setData(null);
      setError(res.json.error || 'YZ gider raporu alınamadı');
      return;
    }
    setData(res.json);
  }, []);

  useEffect(() => {
    void load(days);
  }, [days, load]);

  const rows = useMemo(() => {
    const by = data?.byEndpoint || {};
    const entries = Object.entries(by).map(([key, val]) => ({
      key,
      label: ENDPOINT_LABELS[key] || key,
      count: Number(val?.calls || 0),
      cost: Number(val?.costUsd || 0),
    }));
    entries.sort((a, b) => b.count - a.count);
    return entries;
  }, [data]);

  const maxCalls = Math.max(1, ...rows.map((r) => r.count));

  return (
    <PanelScaffold showBack subtitle="AI kullanım özeti" title="AI maliyetleri">
      <View style={styles.daysRow}>
        {[7, 30, 90].map((d) => (
          <Pressable
            key={d}
            onPress={() => setDays(d)}
            style={[styles.dayChip, days === d && styles.dayChipOn]}>
            <Text style={[styles.dayChipText, days === d && styles.dayChipTextOn]}>{d}g</Text>
          </Pressable>
        ))}
      </View>

      {loading ? (
        <InlineSpinner fill />
      ) : error ? (
        <EmptyState title={error} />
      ) : (
        <>
          <FadeIn>
            <View style={styles.card}>
              <View style={styles.kpiIcon}>
                <Ionicons color={colors.gold[400]} name="sparkles" size={20} />
              </View>
              <Text style={styles.kpi}>{formatUsd(Number(data?.totalCostUsd || 0))}</Text>
              <Text style={styles.label}>
                Son {days} gün · {Number(data?.totalCalls || 0)} çağrı
              </Text>
            </View>
          </FadeIn>
          {rows.length === 0 ? (
            <EmptyState title="Kayıt yok." />
          ) : (
            rows.map((c, i) => (
              <FadeIn delay={40 + i * 40} key={c.key}>
                <View style={styles.row}>
                  <Text style={styles.rowLabel}>{c.label}</Text>
                  <RatioBar ratio={c.count / maxCalls} />
                  <Text style={styles.rowVal}>{c.count}</Text>
                </View>
              </FadeIn>
            ))
          )}
        </>
      )}
    </PanelScaffold>
  );
}

const styles = StyleSheet.create({
  daysRow: { flexDirection: 'row', gap: 8, marginBottom: spacing.md },
  dayChip: {
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: colors.cream[200],
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: colors.white,
  },
  dayChipOn: { backgroundColor: colors.brand[500], borderColor: colors.brand[500] },
  dayChipText: { fontFamily: fonts.sansSemi, fontSize: 12, color: colors.cream[800] },
  dayChipTextOn: { color: colors.white },
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
    gap: 10,
    backgroundColor: colors.white,
    borderRadius: radius.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.cream[200],
    marginTop: spacing.sm,
  },
  rowLabel: {
    width: 110,
    fontFamily: fonts.sansSemi,
    fontSize: 13,
    color: colors.cream[900],
  },
  barTrack: {
    flex: 1,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.cream[100],
    overflow: 'hidden',
  },
  barFill: { height: '100%', backgroundColor: colors.brand[400], borderRadius: 4 },
  rowVal: {
    width: 36,
    textAlign: 'right',
    fontFamily: fonts.sansSemi,
    fontSize: 13,
    color: colors.cream[800],
  },
});
