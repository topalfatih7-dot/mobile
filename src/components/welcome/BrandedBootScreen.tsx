import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  Easing,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';

import { BrandMark } from '@/components/brand/BrandMark';
import { MeshBackground } from '@/components/ui/MeshBackground';
import { colors, spacing } from '@/theme';

/**
 * Soğuk açılış JS boot — native splash sonrası.
 * Yalnız kare marka (wordmark yok: logo PNG’de “Form” açık zeminde kayboluyordu).
 */
export function BrandedBootScreen() {
  const enter = useSharedValue(0);
  const pulse = useSharedValue(0);
  const ring = useSharedValue(0);

  useEffect(() => {
    enter.value = withTiming(1, {
      duration: 720,
      easing: Easing.out(Easing.cubic),
    });
    pulse.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 1400, easing: Easing.inOut(Easing.quad) }),
        withTiming(0, { duration: 1400, easing: Easing.inOut(Easing.quad) }),
      ),
      -1,
      false,
    );
    ring.value = withDelay(
      200,
      withRepeat(
        withTiming(1, { duration: 2200, easing: Easing.out(Easing.quad) }),
        -1,
        false,
      ),
    );
  }, [enter, pulse, ring]);

  const markStyle = useAnimatedStyle(() => ({
    opacity: enter.value,
    transform: [
      { scale: interpolate(enter.value, [0, 1], [0.82, 1]) },
      { translateY: interpolate(enter.value, [0, 1], [18, 0]) },
    ],
  }));

  const glowStyle = useAnimatedStyle(() => ({
    opacity: interpolate(pulse.value, [0, 1], [0.22, 0.48]),
    transform: [{ scale: interpolate(pulse.value, [0, 1], [1, 1.08]) }],
  }));

  const ringStyle = useAnimatedStyle(() => ({
    opacity: interpolate(ring.value, [0, 0.35, 1], [0.45, 0.22, 0]),
    transform: [{ scale: interpolate(ring.value, [0, 1], [0.92, 1.55]) }],
  }));

  const ring2Style = useAnimatedStyle(() => ({
    opacity: interpolate(ring.value, [0, 0.5, 1], [0.35, 0.12, 0]),
    transform: [{ scale: interpolate(ring.value, [0, 1], [1.05, 1.85]) }],
  }));

  return (
    <MeshBackground accessibilityLabel="Yeni Form" style={styles.root}>
      <View style={styles.blobWarm} />
      <View style={styles.blobGold} />
      <View style={styles.center}>
        <View style={styles.markWrap}>
          <Animated.View style={[styles.ring, styles.ringSage, ringStyle]} />
          <Animated.View style={[styles.ring, styles.ringGold, ring2Style]} />
          <Animated.View style={[styles.glow, glowStyle]} />
          <Animated.View style={markStyle}>
            <BrandMark glowing size={88} />
          </Animated.View>
        </View>
      </View>
    </MeshBackground>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  blobWarm: {
    position: 'absolute',
    width: 260,
    height: 260,
    borderRadius: 999,
    top: '18%',
    right: -90,
    backgroundColor: colors.warm[200],
    opacity: 0.45,
  },
  blobGold: {
    position: 'absolute',
    width: 180,
    height: 180,
    borderRadius: 999,
    bottom: '16%',
    left: -60,
    backgroundColor: colors.gold[400],
    opacity: 0.18,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
  },
  markWrap: {
    width: 160,
    height: 160,
    alignItems: 'center',
    justifyContent: 'center',
  },
  glow: {
    position: 'absolute',
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: colors.brand[300],
  },
  ring: {
    position: 'absolute',
    width: 108,
    height: 108,
    borderRadius: 54,
    borderWidth: 2,
  },
  ringSage: {
    borderColor: colors.sage[400],
  },
  ringGold: {
    borderColor: colors.gold[400],
  },
});
