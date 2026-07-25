import { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withTiming,
} from 'react-native-reanimated';

import {
  RADAR_SCORE_LABELS,
  type RadarScores,
} from '@/services/aiAnalysis';
import { colors, fonts, radius, spacing } from '@/theme';

const DIMENSION_KEYS = [
  'metabolic',
  'nutrition',
  'activity',
  'sleep',
  'stress',
  'digestion',
  'lifestyle',
] as const;

function scoreTone(score: number): string {
  if (score >= 75) return colors.sage[500];
  if (score >= 55) return colors.brand[500];
  if (score >= 40) return colors.warm[500];
  return colors.danger[500];
}

function ScoreBar({
  score,
  delay,
  color,
}: {
  score: number;
  delay: number;
  color: string;
}) {
  const width = useSharedValue(0);
  useEffect(() => {
    width.value = withDelay(
      delay,
      withTiming(score, { duration: 550, easing: Easing.out(Easing.ease) }),
    );
  }, [score, delay, width]);

  const anim = useAnimatedStyle(() => ({ width: `${width.value}%` }));
  return (
    <View style={styles.track}>
      <Animated.View style={[styles.fill, { backgroundColor: color }, anim]} />
    </View>
  );
}

/**
 * Web parity: Adsız `HealthRadarScores.jsx`
 */
export function HealthRadarScores({
  radarScores,
  title = '360° Sağlık Analizi',
}: {
  radarScores: RadarScores | Record<string, number> | null | undefined;
  title?: string;
}) {
  if (!radarScores || typeof radarScores !== 'object') return null;
  const overall = radarScores.overall;

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <View style={{ flex: 1 }}>
          <Text style={styles.kicker}>{title}</Text>
          <Text style={styles.title}>Genel değerlendirme</Text>
          <Text style={styles.sub}>
            Cevaplarınıza göre yedi boyutta sağlık profiliniz.
          </Text>
        </View>
        {overall != null ? (
          <View style={styles.overall}>
            <Text style={styles.overallNum}>{overall}</Text>
            <Text style={styles.overallDenom}>/100</Text>
          </View>
        ) : null}
      </View>

      <View style={styles.dims}>
        {DIMENSION_KEYS.map((key, i) => {
          const score = radarScores[key];
          if (score == null) return null;
          return (
            <View key={key} style={styles.dimRow}>
              <View style={styles.dimLabelRow}>
                <Text style={styles.dimLabel}>
                  {RADAR_SCORE_LABELS[key] || key}
                </Text>
                <Text style={styles.dimScore}>{score}</Text>
              </View>
              <ScoreBar
                color={scoreTone(Number(score))}
                delay={i * 40}
                score={Number(score)}
              />
            </View>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.white,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.brand[200],
    padding: spacing.lg,
    gap: spacing.md,
  },
  header: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.md },
  kicker: {
    fontFamily: fonts.sansSemi,
    fontSize: 11,
    color: colors.brand[700],
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    opacity: 0.75,
  },
  title: {
    fontFamily: fonts.displayExtra,
    fontSize: 20,
    color: colors.cream[900],
    marginTop: 2,
  },
  sub: {
    fontFamily: fonts.sans,
    fontSize: 13,
    color: colors.cream[800],
    opacity: 0.65,
    marginTop: 4,
    lineHeight: 18,
  },
  overall: {
    width: 64,
    height: 64,
    borderRadius: 16,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.brand[100],
    alignItems: 'center',
    justifyContent: 'center',
  },
  overallNum: {
    fontFamily: fonts.displayExtra,
    fontSize: 22,
    color: colors.brand[700],
  },
  overallDenom: {
    fontFamily: fonts.sansSemi,
    fontSize: 9,
    color: colors.cream[800],
    opacity: 0.45,
    textTransform: 'uppercase',
  },
  dims: { gap: 12 },
  dimRow: { gap: 4 },
  dimLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dimLabel: {
    fontFamily: fonts.sansSemi,
    fontSize: 13,
    color: colors.cream[900],
  },
  dimScore: {
    fontFamily: fonts.sansSemi,
    fontSize: 13,
    color: colors.cream[800],
    opacity: 0.7,
  },
  track: {
    height: 8,
    borderRadius: 999,
    backgroundColor: colors.cream[100],
    overflow: 'hidden',
  },
  fill: { height: '100%', borderRadius: 999 },
});
