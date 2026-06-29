import { LinearGradient } from 'expo-linear-gradient';
import { StyleSheet, View } from 'react-native';
import Animated, {
  Extrapolation,
  interpolate,
  useAnimatedStyle,
  type SharedValue,
} from 'react-native-reanimated';

import { WELCOME_SLIDES } from '@/data/welcomeSlides';
import type { Gradient } from '@/constants/theme';

function GradientLayer({
  index,
  scrollX,
  scrollWidth,
  colors,
}: {
  index: number;
  scrollX: SharedValue<number>;
  scrollWidth: number;
  colors: Gradient;
}) {
  const style = useAnimatedStyle(() => ({
    opacity: interpolate(
      scrollX.value,
      [(index - 1) * scrollWidth, index * scrollWidth, (index + 1) * scrollWidth],
      [0, 1, 0],
      Extrapolation.CLAMP,
    ),
  }));

  return (
    <Animated.View style={[StyleSheet.absoluteFill, style]}>
      <LinearGradient
        colors={colors}
        start={{ x: 0, y: 0 }}
        end={{ x: 0.9, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
    </Animated.View>
  );
}

/** Slayta göre yumuşakça geçiş yapan tam ekran gradient arka plan + dekoratif baloncuklar. */
export function WelcomeBackground({
  scrollX,
  scrollWidth,
}: {
  scrollX: SharedValue<number>;
  scrollWidth: number;
}) {
  return (
    <View style={[StyleSheet.absoluteFill, styles.noTouch]}>
      {WELCOME_SLIDES.map((slide, i) => (
        <GradientLayer
          key={slide.id}
          colors={slide.gradient}
          index={i}
          scrollWidth={scrollWidth}
          scrollX={scrollX}
        />
      ))}

      <View style={[styles.blob, styles.blobTop]} />
      <View style={[styles.blob, styles.blobRight]} />
      <View style={[styles.blob, styles.blobBottom]} />

      <LinearGradient
        colors={['transparent', 'rgba(8, 28, 40, 0.28)']}
        style={styles.scrim}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  noTouch: {
    pointerEvents: 'none',
  },
  blob: {
    position: 'absolute',
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.10)',
  },
  blobTop: {
    width: 240,
    height: 240,
    top: -70,
    left: -60,
  },
  blobRight: {
    width: 160,
    height: 160,
    top: 120,
    right: -50,
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  blobBottom: {
    width: 300,
    height: 300,
    bottom: -120,
    right: -90,
    backgroundColor: 'rgba(255,255,255,0.06)',
  },
  scrim: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: '58%',
  },
});
