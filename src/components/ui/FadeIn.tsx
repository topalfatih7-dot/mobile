import { useEffect } from 'react';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withTiming,
} from 'react-native-reanimated';
import type { ReactNode } from 'react';
import type { StyleProp, ViewStyle } from 'react-native';

type Props = {
  children: ReactNode;
  delay?: number;
  style?: StyleProp<ViewStyle>;
};

/** Reanimated — 02-design-system motion (list/form fade) */
export function FadeIn({ children, delay = 0, style }: Props) {
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(14);

  useEffect(() => {
    opacity.value = withDelay(delay, withTiming(1, { duration: 420 }));
    translateY.value = withDelay(delay, withTiming(0, { duration: 420 }));
  }, [delay, opacity, translateY]);

  const anim = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }],
  }));

  return <Animated.View style={[anim, style]}>{children}</Animated.View>;
}
