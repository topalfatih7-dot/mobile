/**
 * Web parity: Adsız `HealthScoreCard.jsx` + `HealthScoreSimpleTrend`
 */
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router, type Href } from 'expo-router';
import { useEffect, useMemo } from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withTiming,
} from 'react-native-reanimated';

import {
  HEALTH_SCORE_KEYS,
  HEALTH_SCORE_META,
  type HealthScoreAnalysis,
  type HealthScoreHistoryEntry,
  type HealthScoreKey,
  type HealthTestLockState,
} from '@/services/healthScoreAnalysis';
import { colors, fonts, radius, spacing } from '@/theme';

function formatRetakeDate(date: Date | string | null | undefined): string {
  if (!date) return '';
  try {
    return new Intl.DateTimeFormat('tr-TR', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    }).format(date instanceof Date ? date : new Date(date));
  } catch {
    return '';
  }
}

function scoreTone(score: number) {
  if (score >= 75) {
    return {
      bar: colors.sage[500],
      ring: colors.sage[200],
      text: colors.sage[700],
      glow: [colors.sage[400], colors.sage[600]] as const,
    };
  }
  if (score >= 55) {
    return {
      bar: colors.brand[500],
      ring: colors.brand[200],
      text: colors.brand[700],
      glow: [colors.brand[400], colors.brand[600]] as const,
    };
  }
  if (score >= 40) {
    return {
      bar: colors.warm[500],
      ring: colors.warm[200],
      text: colors.warm[500],
      glow: [colors.warm[400], colors.warm[500]] as const,
    };
  }
  return {
    bar: colors.danger[500],
    ring: colors.danger[100],
    text: colors.danger[700],
    glow: [colors.danger[500], colors.danger[600]] as const,
  };
}

function DimensionCard({
  scoreKey,
  score,
  delay,
}: {
  scoreKey: HealthScoreKey;
  score: number | undefined;
  delay: number;
}) {
  const meta = HEALTH_SCORE_META[scoreKey];
  const value = score ?? 0;
  const tone = scoreTone(value);
  const width = useSharedValue(0);

  useEffect(() => {
    width.value = withDelay(
      delay,
      withTiming(Math.max(0, Math.min(100, value)), {
        duration: 550,
        easing: Easing.out(Easing.ease),
      }),
    );
  }, [value, delay, width]);

  const fill = useAnimatedStyle(() => ({ width: `${width.value}%` }));

  return (
    <View style={styles.dimCard}>
      <View style={styles.dimHeader}>
        <Text numberOfLines={1} style={styles.dimLabel}>
          <Text style={styles.dimEmoji}>{meta.emoji} </Text>
          {meta.label}
        </Text>
        <Text style={[styles.dimScore, { color: tone.text }]}>
          {score != null ? score : '—'}
        </Text>
      </View>
      <View style={styles.dimTrack}>
        <Animated.View style={[styles.dimFill, { backgroundColor: tone.bar }, fill]} />
      </View>
    </View>
  );
}

function SimpleTrend({ history }: { history: HealthScoreHistoryEntry[] }) {
  const { width: screenW } = useWindowDimensions();
  const chartW = Math.max(240, Math.min(screenW - 72, 380));
  const height = 120;

  const chart = useMemo(() => {
    const points = (history || [])
      .filter((h) => h?.overallScore != null || h?.overallScore === 0)
      .slice(-12)
      .map((h) => {
        const day = String(h.at || '').slice(0, 10);
        const [, m, d] = day.split('-');
        return {
          label: m && d ? `${d}.${m}` : '',
          value: Number(h.overallScore),
        };
      })
      .filter((p) => Number.isFinite(p.value));

    if (points.length < 2) return null;

    const padX = 8;
    const padTop = 10;
    const axisH = 18;
    const chartH = height - axisH;
    const innerW = chartW - padX * 2;
    const innerH = chartH - padTop - 6;
    const minV = 0;
    const maxV = 100;
    const range = maxV - minV;

    const coords = points.map((p, i) => {
      const x = padX + (i / (points.length - 1)) * innerW;
      const y = padTop + innerH - ((p.value - minV) / range) * innerH;
      return { ...p, x, y };
    });

    const segments: {
      key: string;
      left: number;
      top: number;
      width: number;
      angle: number;
    }[] = [];

    for (let i = 0; i < coords.length - 1; i++) {
      const a = coords[i];
      const b = coords[i + 1];
      const dx = b.x - a.x;
      const dy = b.y - a.y;
      const len = Math.sqrt(dx * dx + dy * dy) || 1;
      const angle = (Math.atan2(dy, dx) * 180) / Math.PI;
      segments.push({
        key: `s-${i}`,
        left: (a.x + b.x) / 2 - len / 2,
        top: (a.y + b.y) / 2 - 1.25,
        width: len,
        angle,
      });
    }

    return { coords, segments, chartH, chartW, padX };
  }, [history, chartW]);

  if (!chart) return null;

  return (
    <View style={styles.trend}>
      <Text style={styles.trendLabel}>Skor trendi</Text>
      <View style={[styles.trendCanvas, { height: chart.chartH, width: chart.chartW }]}>
        {[0, 0.5, 1].map((t) => (
          <View
            key={`g-${t}`}
            style={[
              styles.trendGrid,
              { top: 10 + (chart.chartH - 28) * (1 - t) },
            ]}
          />
        ))}
        {chart.segments.map((s) => (
          <View
            key={s.key}
            style={[
              styles.trendSeg,
              {
                left: s.left,
                top: s.top,
                width: s.width,
                transform: [{ rotate: `${s.angle}deg` }],
              },
            ]}
          />
        ))}
        {chart.coords.map((c, i) => (
          <View
            key={`d-${i}`}
            style={[styles.trendDot, { left: c.x - 3.5, top: c.y - 3.5 }]}
          />
        ))}
      </View>
      <View style={styles.trendAxis}>
        <Text style={styles.trendAxisText}>{chart.coords[0]?.label}</Text>
        <Text style={styles.trendAxisText}>
          {chart.coords[chart.coords.length - 1]?.label}
        </Text>
      </View>
    </View>
  );
}

type Props = {
  analysis: HealthScoreAnalysis | null;
  history?: HealthScoreHistoryEntry[];
  loading?: boolean;
  complete?: boolean;
  error?: string | null;
  lockState?: HealthTestLockState | null;
  scoresOnly?: boolean;
};

export function HealthScoreCard({
  analysis,
  history = [],
  loading = false,
  complete = false,
  error = null,
  lockState = null,
  scoresOnly = false,
}: Props) {
  if (!complete) {
    return (
      <LinearGradient
        colors={[colors.brand[50], colors.white, colors.sage[50]]}
        end={{ x: 1, y: 1 }}
        start={{ x: 0, y: 0 }}
        style={styles.incompleteCard}>
        <View style={styles.incompleteRow}>
          <View style={{ flex: 1, gap: 4 }}>
            <View style={styles.kickerRow}>
              <Ionicons color={colors.brand[600]} name="sparkles" size={14} />
              <Text style={styles.kicker}>YeniForm Sağlık Skoru</Text>
            </View>
            <Text style={styles.incompleteTitle}>
              Kişisel sağlık analizinizi tamamlayın
            </Text>
            <Text style={styles.incompleteSub}>
              Genel Sağlık Testini (1. aşama) tamamlayıp analizi başlattığınızda
              8 boyutlu skorunuz burada görünecek.
            </Text>
          </View>
          <Pressable
            onPress={() => router.push('/(member)/health-test' as Href)}
            style={styles.cta}>
            <Text style={styles.ctaText}>Analize git</Text>
            <Ionicons color={colors.white} name="arrow-forward" size={14} />
          </Pressable>
        </View>
      </LinearGradient>
    );
  }

  const scores = analysis?.scores || {};
  const overall = analysis?.overallScore;
  const tone = scoreTone(overall ?? 0);
  const showSkeleton = loading && overall == null;

  return (
    <LinearGradient
      colors={[colors.brand[50], colors.white, colors.sage[50]]}
      end={{ x: 1, y: 1 }}
      start={{ x: 0, y: 0 }}
      style={styles.card}>
      <View style={styles.headerRow}>
        <View style={{ flex: 1, gap: 4, minWidth: 0 }}>
          <View style={styles.kickerRow}>
            <Ionicons color={colors.brand[600]} name="heart" size={14} />
            <Text style={styles.kicker}>YeniForm Sağlık Skoru</Text>
          </View>
          <Text style={styles.title}>Kişisel sağlık profiliniz</Text>
          {analysis?.summary && !scoresOnly ? (
            <Text style={styles.summary}>{analysis.summary}</Text>
          ) : !scoresOnly ? (
            <Text style={styles.summaryMuted}>
              Cevaplarınıza göre 8 boyutta değerlendirildiniz.
            </Text>
          ) : null}
          {lockState?.locked && lockState?.lockedUntil ? (
            <View style={styles.lockBadge}>
              <Ionicons color={colors.warm[500]} name="time-outline" size={12} />
              <Text style={styles.lockBadgeText}>
                Güncellenebilir: {formatRetakeDate(lockState.lockedUntil)}
              </Text>
            </View>
          ) : null}
          {lockState?.canRetake ? (
            <View style={styles.lockBadge}>
              <Ionicons color={colors.brand[600]} name="refresh" size={12} />
              <Text style={styles.lockBadgeText}>Yeniden çözebilirsiniz</Text>
            </View>
          ) : null}
          {error ? <Text style={styles.errorText}>{error}</Text> : null}
        </View>

        <View style={[styles.overallBadge, { borderColor: tone.ring }]}>
          {showSkeleton ? (
            <ActivityIndicator color={tone.text} />
          ) : (
            <>
              <Text style={[styles.overallNum, { color: tone.text }]}>
                {overall ?? '—'}
              </Text>
              <Text style={styles.overallDenom}>/100</Text>
            </>
          )}
          <LinearGradient
            colors={[...tone.glow]}
            end={{ x: 1, y: 0 }}
            start={{ x: 0, y: 0 }}
            style={styles.overallGlow}
          />
        </View>
      </View>

      <View style={styles.grid}>
        {HEALTH_SCORE_KEYS.map((key, i) => (
          <View key={key} style={styles.gridItem}>
            <DimensionCard delay={i * 40} score={scores[key]} scoreKey={key} />
          </View>
        ))}
      </View>

      <SimpleTrend history={history} />
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  incompleteCard: {
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.brand[200],
    padding: spacing.lg,
  },
  incompleteRow: {
    gap: spacing.md,
  },
  incompleteTitle: {
    fontFamily: fonts.displayBold,
    fontSize: 20,
    color: colors.cream[900],
  },
  incompleteSub: {
    fontFamily: fonts.sans,
    fontSize: 13,
    lineHeight: 19,
    color: 'rgba(58,69,80,0.6)',
  },
  lockBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
    alignSelf: 'flex-start',
    backgroundColor: colors.warm[50],
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  lockBadgeText: {
    fontFamily: fonts.sansMedium,
    fontSize: 11,
    color: colors.cream[900],
  },
  cta: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.brand[500],
    borderRadius: radius.full,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  ctaText: {
    fontFamily: fonts.sansSemi,
    fontSize: 13,
    color: colors.white,
  },
  card: {
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.brand[200],
    padding: spacing.lg,
    gap: spacing.md,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.md,
  },
  kickerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  kicker: {
    fontFamily: fonts.sansSemi,
    fontSize: 11,
    letterSpacing: 0.4,
    textTransform: 'uppercase',
    color: 'rgba(31,98,137,0.7)',
  },
  title: {
    fontFamily: fonts.displayBold,
    fontSize: 20,
    color: colors.cream[900],
  },
  summary: {
    fontFamily: fonts.sans,
    fontSize: 13,
    lineHeight: 19,
    color: 'rgba(58,69,80,0.65)',
  },
  summaryMuted: {
    fontFamily: fonts.sans,
    fontSize: 13,
    color: 'rgba(58,69,80,0.55)',
  },
  errorText: {
    fontFamily: fonts.sans,
    fontSize: 11,
    color: colors.warm[500],
    marginTop: 4,
  },
  overallBadge: {
    width: 80,
    height: 80,
    borderRadius: radius.lg,
    backgroundColor: colors.white,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  overallNum: {
    fontFamily: fonts.displayExtra,
    fontSize: 28,
    lineHeight: 32,
  },
  overallDenom: {
    fontFamily: fonts.sansSemi,
    fontSize: 10,
    textTransform: 'uppercase',
    color: 'rgba(58,69,80,0.45)',
  },
  overallGlow: {
    position: 'absolute',
    left: 8,
    right: 8,
    bottom: 0,
    height: 3,
    borderRadius: 2,
    opacity: 0.7,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  gridItem: {
    width: '47.5%',
    flexGrow: 1,
  },
  dimCard: {
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.cream[100],
    backgroundColor: 'rgba(255,255,255,0.92)',
    padding: 12,
    gap: 8,
  },
  dimHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 6,
  },
  dimLabel: {
    flex: 1,
    fontFamily: fonts.sansSemi,
    fontSize: 11,
    color: colors.cream[900],
  },
  dimEmoji: {
    fontSize: 12,
  },
  dimScore: {
    fontFamily: fonts.sansBold,
    fontSize: 13,
  },
  dimTrack: {
    height: 6,
    borderRadius: 999,
    backgroundColor: colors.cream[100],
    overflow: 'hidden',
  },
  dimFill: {
    height: '100%',
    borderRadius: 999,
  },
  trend: {
    borderTopWidth: 1,
    borderTopColor: 'rgba(184,220,239,0.8)',
    paddingTop: spacing.md,
    gap: 6,
  },
  trendLabel: {
    fontFamily: fonts.sansSemi,
    fontSize: 11,
    letterSpacing: 0.4,
    textTransform: 'uppercase',
    color: 'rgba(31,98,137,0.6)',
  },
  trendCanvas: {
    position: 'relative',
    alignSelf: 'center',
  },
  trendGrid: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.cream[200],
  },
  trendSeg: {
    position: 'absolute',
    height: 2.5,
    backgroundColor: '#d44d8a',
    borderRadius: 2,
  },
  trendDot: {
    position: 'absolute',
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: '#d44d8a',
  },
  trendAxis: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 4,
  },
  trendAxisText: {
    fontFamily: fonts.sans,
    fontSize: 10,
    color: 'rgba(58,69,80,0.45)',
  },
});
