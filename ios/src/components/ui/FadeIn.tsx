import { useEffect } from 'react';
import { Platform, View, type StyleProp, type ViewStyle } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withTiming,
} from 'react-native-reanimated';
import type { ReactNode } from 'react';

type Props = {
  children: ReactNode;
  delay?: number;
  style?: StyleProp<ViewStyle>;
};

/** Reanimated — 02-design-system motion (list/form fade). Web: no anim (opacity would stick at 0). */
export function FadeIn({ children, delay = 0, style }: Props) {
  if (Platform.OS === 'web') {
    return <View style={style}>{children}</View>;
  }
  return (
    <FadeInNative delay={delay} style={style}>
      {children}
    </FadeInNative>
  );
}

function FadeInNative({ children, delay = 0, style }: Props) {
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
