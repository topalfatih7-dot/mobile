import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import type { ComponentProps } from 'react';
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';

import { PressableScale } from '@/components/ui/PressableScale';
import { colors, fonts, glow, gradients, radius, type Gradient } from '@/constants/theme';

type IconName = ComponentProps<typeof Ionicons>['name'];
type Variant = 'primary' | 'solid' | 'secondary' | 'ghost' | 'glass';
type Size = 'sm' | 'md' | 'lg';

type ButtonProps = {
  label: string;
  onPress?: () => void;
  variant?: Variant;
  size?: Size;
  /** primary varyantı için gradient. */
  gradient?: Gradient;
  /** solid varyantı veya metin aksanı için renk. */
  color?: string;
  leftIcon?: IconName;
  rightIcon?: IconName;
  loading?: boolean;
  disabled?: boolean;
  fullWidth?: boolean;
  style?: StyleProp<ViewStyle>;
};

const SIZES: Record<Size, { height: number; font: number; padH: number; icon: number }> = {
  sm: { height: 46, font: 14.5, padH: 18, icon: 17 },
  md: { height: 54, font: 16, padH: 24, icon: 19 },
  lg: { height: 58, font: 16.5, padH: 28, icon: 20 },
};

export function Button({
  label,
  onPress,
  variant = 'primary',
  size = 'md',
  gradient = gradients.brand,
  color = colors.brand[600],
  leftIcon,
  rightIcon,
  loading = false,
  disabled = false,
  fullWidth = true,
  style,
}: ButtonProps) {
  const dims = SIZES[size];

  const textColor =
    variant === 'secondary'
      ? colors.brand[700]
      : variant === 'ghost'
        ? colors.brand[600]
        : colors.white;

  const content = (
    <View style={styles.content}>
      {loading ? (
        <ActivityIndicator color={textColor} size="small" />
      ) : (
        <>
          {leftIcon ? (
            <Ionicons color={textColor} name={leftIcon} size={dims.icon} style={styles.iconLeft} />
          ) : null}
          <Text style={[styles.label, { fontSize: dims.font, color: textColor }]}>{label}</Text>
          {rightIcon ? (
            <Ionicons color={textColor} name={rightIcon} size={dims.icon} style={styles.iconRight} />
          ) : null}
        </>
      )}
    </View>
  );

  const baseStyle: StyleProp<ViewStyle> = [
    styles.base,
    { height: dims.height, paddingHorizontal: dims.padH, borderRadius: radius.full },
    fullWidth ? styles.fullWidth : styles.auto,
    disabled && styles.disabled,
    style,
  ];

  if (variant === 'primary') {
    return (
      <PressableScale
        accessibilityRole="button"
        disabled={disabled || loading}
        onPress={onPress}
        style={[baseStyle, !disabled && glow(gradient[0], 0.32)]}>
        <LinearGradient
          colors={gradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[StyleSheet.absoluteFill, { borderRadius: radius.full }]}
        />
        {content}
      </PressableScale>
    );
  }

  const surfaceStyle =
    variant === 'solid'
      ? [{ backgroundColor: color }, !disabled && glow(color, 0.3)]
      : variant === 'secondary'
        ? styles.secondary
        : variant === 'glass'
          ? styles.glass
          : styles.ghost;

  return (
    <PressableScale
      accessibilityRole="button"
      disabled={disabled || loading}
      onPress={onPress}
      style={[baseStyle, surfaceStyle]}>
      {content}
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  base: {
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  fullWidth: {
    alignSelf: 'stretch',
  },
  auto: {
    alignSelf: 'flex-start',
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    fontFamily: fonts.semibold,
    letterSpacing: 0.2,
  },
  iconLeft: {
    marginRight: 8,
  },
  iconRight: {
    marginLeft: 8,
  },
  secondary: {
    backgroundColor: colors.surface,
    borderWidth: 1.5,
    borderColor: colors.brand[200],
  },
  glass: {
    backgroundColor: 'rgba(255,255,255,0.18)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.32)',
  },
  ghost: {
    backgroundColor: 'transparent',
  },
  disabled: {
    opacity: 0.5,
  },
});
