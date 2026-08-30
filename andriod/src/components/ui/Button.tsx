import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View, type ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import type { ComponentProps } from 'react';

import { BrandLoader } from '@/components/ui/BrandLoader';
import { useScaledTheme } from '@/hooks/useScaledTheme';
import { colors, fonts, radius, spacing } from '@/theme';

type IconName = ComponentProps<typeof Ionicons>['name'];
type Variant = 'primary' | 'secondary' | 'ghost' | 'glass' | 'danger';
type Size = 'md' | 'lg';

type Props = {
  label: string;
  onPress?: () => void;
  loading?: boolean;
  disabled?: boolean;
  variant?: Variant;
  size?: Size;
  rightIcon?: IconName;
  style?: ViewStyle;
};

const SIZES: Record<Size, { height: number; font: number; padH: number; icon: number }> = {
  md: { height: 52, font: 15.5, padH: 22, icon: 18 },
  lg: { height: 56, font: 16.5, padH: 26, icon: 20 },
};

export function Button({
  label,
  onPress,
  loading,
  disabled,
  variant = 'primary',
  size = 'lg',
  rightIcon,
  style,
}: Props) {
  const t = useScaledTheme();
  const isDisabled = disabled || loading;
  const base = SIZES[size];
  const sz = {
    height: size === 'lg' ? t.buttonLg : t.buttonMd,
    font: t.ms(base.font),
    padH: t.ss(base.padH),
    icon: t.ms(base.icon),
  };

  const labelNode = loading ? (
    <BrandLoader
      mark={false}
      size="xs"
      tone={
        variant === 'glass' || variant === 'primary' || variant === 'danger' ? 'onDark' : 'brand'
      }
    />
  ) : (
    <View style={styles.row}>
      <Text
        numberOfLines={1}
        style={[
          styles.label,
          { fontSize: sz.font, flexShrink: 1 },
          variant === 'primary' && styles.labelOnDark,
          variant === 'glass' && styles.labelOnDark,
          variant === 'danger' && styles.labelOnDark,
          variant === 'secondary' && styles.labelSecondary,
          variant === 'ghost' && styles.labelGhost,
        ]}>
        {label}
      </Text>
      {rightIcon ? (
        <Ionicons
          color={
            variant === 'primary' || variant === 'glass' || variant === 'danger'
              ? colors.white
              : colors.brand[600]
          }
          name={rightIcon}
          size={sz.icon}
        />
      ) : null}
    </View>
  );

  if (variant === 'primary') {
    return (
      <Pressable
        accessibilityRole="button"
        disabled={isDisabled}
        onPress={onPress}
        style={({ pressed }) => [styles.wrap, pressed && styles.pressed, isDisabled && styles.disabled, style]}>
        <LinearGradient
          colors={[colors.brand[500], colors.brand[600], colors.sage[500]]}
          end={{ x: 1, y: 0.5 }}
          start={{ x: 0, y: 0.5 }}
          style={[styles.gradient, { minHeight: sz.height, paddingHorizontal: sz.padH }]}>
          {labelNode}
        </LinearGradient>
      </Pressable>
    );
  }

  if (variant === 'glass') {
    return (
      <Pressable
        accessibilityRole="button"
        disabled={isDisabled}
        onPress={onPress}
        style={({ pressed }) => [
          styles.wrap,
          styles.glass,
          { minHeight: sz.height, paddingHorizontal: sz.padH },
          pressed && styles.pressed,
          isDisabled && styles.disabled,
          style,
        ]}>
        {labelNode}
      </Pressable>
    );
  }

  if (variant === 'danger') {
    return (
      <Pressable
        accessibilityRole="button"
        disabled={isDisabled}
        onPress={onPress}
        style={({ pressed }) => [
          styles.wrap,
          styles.danger,
          { minHeight: sz.height, paddingHorizontal: sz.padH },
          pressed && styles.pressed,
          isDisabled && styles.disabled,
          style,
        ]}>
        {labelNode}
      </Pressable>
    );
  }

  return (
    <Pressable
      accessibilityRole="button"
      disabled={isDisabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.wrap,
        variant === 'secondary' ? styles.secondary : styles.ghost,
        { minHeight: sz.height, paddingHorizontal: sz.padH },
        pressed && styles.pressed,
        isDisabled && styles.disabled,
        style,
      ]}>
      {labelNode}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  wrap: { borderRadius: radius.lg, overflow: 'hidden' },
  gradient: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, maxWidth: '100%' },
  label: { fontFamily: fonts.sansSemi },
  labelOnDark: { color: colors.white },
  labelSecondary: { color: colors.brand[700] },
  labelGhost: { color: colors.brand[600] },
  secondary: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.brand[200],
    borderRadius: radius.lg,
  },
  ghost: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  glass: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.18)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.35)',
    borderRadius: radius.lg,
  },
  danger: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.danger[500],
    borderWidth: 1,
    borderColor: colors.danger[600],
    borderRadius: radius.lg,
  },
  pressed: { opacity: 0.9, transform: [{ scale: 0.985 }] },
  disabled: { opacity: 0.55 },
});
