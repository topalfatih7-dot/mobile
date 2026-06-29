import { Ionicons } from '@expo/vector-icons';
import { forwardRef, useState, type ComponentProps } from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
  type TextInputProps,
} from 'react-native';

import { colors, fonts, radius, spacing } from '@/constants/theme';

type IconName = ComponentProps<typeof Ionicons>['name'];

type InputProps = TextInputProps & {
  label?: string;
  icon?: IconName;
  error?: string;
  isPassword?: boolean;
};

export const Input = forwardRef<TextInput, InputProps>(function Input(
  { label, icon, error, isPassword, style, onFocus, onBlur, ...rest },
  ref,
) {
  const [hidden, setHidden] = useState(Boolean(isPassword));
  const borderColor = error ? colors.danger : colors.border;

  return (
    <View style={styles.wrap}>
      {label ? <Text style={styles.label}>{label}</Text> : null}

      <View style={[styles.field, { borderColor }]}>
        {icon ? (
          <Ionicons color={colors.text.muted} name={icon} size={19} style={styles.leftIcon} />
        ) : null}

        <TextInput
          ref={ref}
          cursorColor={colors.text.primary}
          placeholderTextColor={colors.text.muted}
          selectionColor={colors.ink[300]}
          secureTextEntry={hidden}
          style={[styles.input, style]}
          onFocus={onFocus}
          onBlur={onBlur}
          {...rest}
        />

        {isPassword ? (
          <Pressable hitSlop={10} onPress={() => setHidden((v) => !v)} style={styles.eye}>
            <Ionicons
              color={colors.text.muted}
              name={hidden ? 'eye-outline' : 'eye-off-outline'}
              size={19}
            />
          </Pressable>
        ) : null}
      </View>

      {error ? <Text style={styles.error}>{error}</Text> : null}
    </View>
  );
});

const styles = StyleSheet.create({
  wrap: {
    width: '100%',
  },
  label: {
    fontFamily: fonts.semibold,
    fontSize: 13.5,
    color: colors.text.secondary,
    marginBottom: spacing.sm,
    marginLeft: 2,
  },
  field: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 56,
    borderRadius: radius.md,
    borderWidth: 1.5,
    paddingHorizontal: spacing.md,
    backgroundColor: colors.surface,
  },
  leftIcon: {
    marginRight: spacing.sm,
  },
  input: {
    flex: 1,
    fontFamily: fonts.medium,
    fontSize: 15.5,
    color: colors.text.primary,
    height: '100%',
  },
  eye: {
    paddingLeft: spacing.sm,
  },
  error: {
    marginTop: 6,
    marginLeft: 2,
    fontFamily: fonts.medium,
    fontSize: 12.5,
    color: colors.danger,
  },
});
