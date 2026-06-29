import { LinearGradient } from 'expo-linear-gradient';
import { useEffect } from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withTiming,
} from 'react-native-reanimated';

import { colors, gradients, radius, type Gradient } from '@/constants/theme';

type ProgressBarProps = {
  /** 0–1 arası ilerleme. */
  progress: number;
  gradient?: Gradient;
  height?: number;
  trackColor?: string;
  delay?: number;
  style?: StyleProp<ViewStyle>;
};

export function ProgressBar({
  progress,
  gradient = gradients.brand,
  height = 10,
  trackColor = colors.ink[100],
  delay = 120,
  style,
}: ProgressBarProps) {
  const clamped = Math.max(0, Math.min(1, progress));
  const width = useSharedValue(0);

  useEffect(() => {
    width.value = withDelay(delay, withTiming(clamped, { duration: 720 }));
  }, [clamped, delay, width]);

  const fillStyle = useAnimatedStyle(() => ({
    width: `${width.value * 100}%`,
  }));

  return (
    <View style={[styles.track, { height, borderRadius: height, backgroundColor: trackColor }, style]}>
      <Animated.View style={[styles.fill, { borderRadius: height }, fillStyle]}>
        <LinearGradient
          colors={gradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={StyleSheet.absoluteFill}
        />
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    width: '100%',
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    overflow: 'hidden',
    borderRadius: radius.full,
  },
});
