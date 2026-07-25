import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
  type TextInputProps,
} from 'react-native';

import { colors, fonts, radius, spacing } from '@/theme';

type Accent = 'brand' | 'sage' | 'warm';

type Props = TextInputProps & {
  label: string;
  error?: string;
  icon?: keyof typeof Ionicons.glyphMap;
  accent?: Accent;
};

const ACCENT = {
  brand: {
    iconBg: colors.brand[50],
    icon: colors.brand[600],
    border: colors.brand[200],
    borderFocus: colors.brand[500],
    fieldBg: colors.brand[50],
    label: colors.brand[700],
  },
  sage: {
    iconBg: colors.sage[50],
    icon: colors.sage[600],
    border: colors.sage[200],
    borderFocus: colors.sage[500],
    fieldBg: colors.sage[50],
    label: colors.sage[700],
  },
  warm: {
    iconBg: colors.warm[50],
    icon: colors.warm[500],
    border: colors.warm[200],
    borderFocus: colors.warm[500],
    fieldBg: colors.warm[50],
    label: colors.warm[500],
  },
} as const;

export function TextField({
  label,
  error,
  icon,
  accent = 'brand',
  secureTextEntry,
  style,
  onFocus,
  onBlur,
  ...rest
}: Props) {
  const [show, setShow] = useState(false);
  const [focused, setFocused] = useState(false);
  const isSecure = Boolean(secureTextEntry);
  const tone = ACCENT[accent];

  return (
    <View style={styles.wrap}>
      <Text style={[styles.label, { color: tone.label }]}>{label}</Text>
      <View
        style={[
          styles.field,
          {
            backgroundColor: tone.fieldBg,
            borderColor: error ? colors.warm[500] : focused ? tone.borderFocus : tone.border,
          },
          focused && !error ? styles.fieldFocus : null,
          error ? styles.fieldError : null,
        ]}>
        {icon ? (
          <View style={[styles.iconChip, { backgroundColor: tone.iconBg }]}>
            <Ionicons color={tone.icon} name={icon} size={18} />
          </View>
        ) : null}
        <TextInput
          autoCapitalize="none"
          onBlur={(e) => {
            setFocused(false);
            onBlur?.(e);
          }}
          onFocus={(e) => {
            setFocused(true);
            onFocus?.(e);
          }}
          placeholderTextColor={colors.cream[300]}
          secureTextEntry={isSecure && !show}
          style={[styles.input, style]}
          {...rest}
        />
        {isSecure ? (
          <Pressable
            accessibilityRole="button"
            hitSlop={8}
            onPress={() => setShow((v) => !v)}
            style={[styles.eyeChip, { backgroundColor: tone.iconBg }]}>
            <Ionicons
              color={tone.icon}
              name={show ? 'eye-off-outline' : 'eye-outline'}
              size={18}
            />
          </Pressable>
        ) : null}
      </View>
      {error ? <Text style={styles.error}>{error}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 8 },
  label: {
    fontFamily: fonts.sansSemi,
    fontSize: 13,
  },
  field: {
    minHeight: 56,
    borderRadius: radius.xl,
    borderWidth: 1.5,
    paddingHorizontal: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  // Gölge/elevation yok — focus’ta layout değişimi web’de scroll jump yapıyordu
  fieldFocus: {},
  fieldError: {
    backgroundColor: colors.warm[50],
  },
  iconChip: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  eyeChip: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  input: {
    flex: 1,
    fontFamily: fonts.sansMedium,
    fontSize: 16,
    color: colors.cream[900],
    paddingVertical: 12,
  },
  error: {
    fontFamily: fonts.sans,
    fontSize: 12,
    color: colors.danger[600],
  },
});
