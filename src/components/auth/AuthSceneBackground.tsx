import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';

import { colors } from '@/theme';

function FloatingOrb({
  size,
  color,
  top,
  left,
  delay,
  drift = 18,
}: {
  size: number;
  color: string;
  top: number;
  left: number;
  delay: number;
  drift?: number;
}) {
  const y = useSharedValue(0);
  const scale = useSharedValue(1);

  useEffect(() => {
    y.value = withRepeat(
      withTiming(drift, { duration: 4200 + delay, easing: Easing.inOut(Easing.sin) }),
      -1,
      true,
    );
    scale.value = withRepeat(
      withTiming(1.08, { duration: 5200 + delay, easing: Easing.inOut(Easing.sin) }),
      -1,
      true,
    );
  }, [delay, drift, scale, y]);

  const style = useAnimatedStyle(() => ({
    transform: [{ translateY: y.value }, { scale: scale.value }],
  }));

  return (
    <Animated.View
      style={[
        styles.orb,
        style,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: color,
          top,
          left,
        },
      ]}
    />
  );
}

/** Login / auth atmosfer — 02-design-system brand/sage/warm mesh + soft motion */
export function AuthSceneBackground() {
  return (
    <View style={[StyleSheet.absoluteFill, { pointerEvents: 'none' }]}>
      <LinearGradient
        colors={[colors.brand[700], colors.brand[500], colors.sage[500]]}
        end={{ x: 1, y: 1 }}
        start={{ x: 0.1, y: 0 }}
        style={styles.heroBand}
      />
      <LinearGradient
        colors={['transparent', colors.cream[50]]}
        style={styles.fadeDown}
      />
      <View style={styles.lowerFill} />
      <FloatingOrb color="rgba(255,255,255,0.18)" delay={0} left={-40} size={180} top={40} />
      <FloatingOrb color="rgba(180,240,210,0.28)" delay={400} left={220} size={140} top={20} />
      <FloatingOrb color="rgba(255,212,188,0.35)" delay={800} drift={12} left={80} size={90} top={160} />
      <FloatingOrb color={colors.brand[200]} delay={200} left={-20} size={120} top={420} />
      <FloatingOrb color={colors.sage[200]} delay={600} left={260} size={100} top={520} />
    </View>
  );
}

const styles = StyleSheet.create({
  heroBand: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '46%',
  },
  fadeDown: {
    position: 'absolute',
    top: '34%',
    left: 0,
    right: 0,
    height: '18%',
  },
  lowerFill: {
    ...StyleSheet.absoluteFill,
    top: '48%',
    backgroundColor: colors.cream[50],
  },
  orb: {
    position: 'absolute',
    opacity: 0.9,
  },
});
