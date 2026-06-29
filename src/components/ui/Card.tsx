import type { ReactNode } from 'react';
import { LinearGradient } from 'expo-linear-gradient';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { PressableScale } from '@/components/ui/PressableScale';
import { colors, radius, shadows, spacing, type Gradient } from '@/constants/theme';

type CardProps = {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
  contentStyle?: StyleProp<ViewStyle>;
  onPress?: () => void;
  /** Gradient arka plan (verilirse yüzey yerine renkli geçiş kullanılır). */
  gradient?: Gradient;
  padding?: number;
  cornerRadius?: number;
  /** Gölge seviyesi. */
  elevation?: keyof typeof shadows | 'none';
  bordered?: boolean;
};

export function Card({
  children,
  style,
  contentStyle,
  onPress,
  gradient,
  padding = spacing.lg,
  cornerRadius = radius.lg,
  elevation = 'card',
  bordered = false,
}: CardProps) {
  const shadowStyle = elevation === 'none' ? null : shadows[elevation];
  const radiusStyle = { borderRadius: cornerRadius };

  const inner = gradient ? (
    <LinearGradient
      colors={gradient}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={[radiusStyle, { padding }, contentStyle]}>
      {children}
    </LinearGradient>
  ) : (
    <View
      style={[
        styles.surface,
        radiusStyle,
        { padding },
        bordered && styles.bordered,
        contentStyle,
      ]}>
      {children}
    </View>
  );

  // Shadow lives on the outer (no overflow), the clip on the inner — otherwise
  // `overflow: hidden` would clip the shadow on iOS.
  const clip = <View style={[styles.clip, radiusStyle]}>{inner}</View>;

  if (onPress) {
    return (
      <PressableScale
        accessibilityRole="button"
        onPress={onPress}
        style={[styles.shadowBase, radiusStyle, shadowStyle, style]}>
        {clip}
      </PressableScale>
    );
  }

  return <View style={[styles.shadowBase, radiusStyle, shadowStyle, style]}>{clip}</View>;
}

const styles = StyleSheet.create({
  shadowBase: {
    backgroundColor: colors.surface,
  },
  clip: {
    overflow: 'hidden',
  },
  surface: {
    backgroundColor: colors.surface,
  },
  bordered: {
    borderWidth: 1,
    borderColor: colors.border,
  },
});
