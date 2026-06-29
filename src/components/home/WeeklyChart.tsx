import { LinearGradient } from 'expo-linear-gradient';
import { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withTiming,
} from 'react-native-reanimated';

import { colors, fonts, gradients, radius, spacing } from '@/constants/theme';

const BAR_MAX = 116;

type Datum = { day: string; value: number };

function Bar({ value, label, index, highlight }: { value: number; label: string; index: number; highlight: boolean }) {
  const grow = useSharedValue(0);

  useEffect(() => {
    grow.value = withDelay(index * 70, withTiming(value, { duration: 680 }));
  }, [grow, index, value]);

  const barStyle = useAnimatedStyle(() => ({
    height: Math.max(6, grow.value * BAR_MAX),
  }));

  return (
    <View style={styles.col}>
      <View style={styles.track}>
        <Animated.View style={[styles.bar, barStyle]}>
          <LinearGradient
            colors={highlight ? gradients.coral : gradients.brand}
            start={{ x: 0, y: 0 }}
            end={{ x: 0, y: 1 }}
            style={StyleSheet.absoluteFill}
          />
        </Animated.View>
      </View>
      <Text style={[styles.day, highlight && styles.dayActive]}>{label}</Text>
    </View>
  );
}

export function WeeklyChart({ data }: { data: Datum[] }) {
  let maxIndex = 0;
  data.forEach((d, i) => {
    if (d.value > data[maxIndex].value) maxIndex = i;
  });

  return (
    <View style={styles.wrap}>
      {data.map((d, i) => (
        <Bar key={d.day} highlight={i === maxIndex} index={i} label={d.day} value={d.value} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  col: {
    alignItems: 'center',
    flex: 1,
  },
  track: {
    height: BAR_MAX,
    justifyContent: 'flex-end',
  },
  bar: {
    width: 13,
    borderRadius: radius.full,
    overflow: 'hidden',
  },
  day: {
    marginTop: spacing.sm,
    fontFamily: fonts.medium,
    fontSize: 11.5,
    color: colors.text.muted,
  },
  dayActive: {
    fontFamily: fonts.bold,
    color: colors.coral[600],
  },
});
