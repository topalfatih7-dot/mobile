import { Ionicons } from '@expo/vector-icons';
import { useState, type Ref } from 'react';
import {
  InputAccessoryView,
  Keyboard,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
  type TextInputProps,
} from 'react-native';

import { useScaledTheme } from '@/hooks/useScaledTheme';
import { MAX_FONT_SIZE_MULTIPLIER, colors, fonts, radius, spacing } from '@/theme';

type Accent = 'brand' | 'sage' | 'warm';

type Props = TextInputProps & {
  label: string;
  error?: string;
  icon?: keyof typeof Ionicons.glyphMap;
  accent?: Accent;
  ref?: Ref<TextInput>;
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

const NUMBER_KEYBOARD_TYPES = new Set([
  'numeric',
  'number-pad',
  'decimal-pad',
  'phone-pad',
  'numbers-and-punctuation',
]);

const NUMBER_PAD_ACCESSORY_ID = 'yeniform.number-pad.done';

/**
 * Samsung Keyboard + `decimal-pad` (Android 15/16) native crash.
 * `decimal-pad` / `number-pad` → `numeric`; tahmin/düzeltme kapalı.
 */
function resolveKeyboardType(
  keyboardType: TextInputProps['keyboardType'],
): TextInputProps['keyboardType'] {
  if (
    Platform.OS === 'android' &&
    (keyboardType === 'decimal-pad' || keyboardType === 'number-pad')
  ) {
    return 'numeric';
  }
  return keyboardType;
}

export function TextField({
  ref,
  label,
  error,
  icon,
  accent = 'brand',
  secureTextEntry,
  style,
  onFocus,
  onBlur,
  keyboardType,
  autoCapitalize,
  autoCorrect,
  spellCheck,
  ...rest
}: Props) {
  const t = useScaledTheme();
  const chip = t.ss(36);
  const [show, setShow] = useState(false);
  const [focused, setFocused] = useState(false);
  const isSecure = Boolean(secureTextEntry);
  const tone = ACCENT[accent];
  const resolvedKeyboard = resolveKeyboardType(keyboardType);
  const isNumberPad = NUMBER_KEYBOARD_TYPES.has(String(keyboardType || resolvedKeyboard || ''));
  const isEmailPad =
    keyboardType === 'email-address' ||
    rest.textContentType === 'emailAddress' ||
    rest.autoComplete === 'email';
  const disableCorrect = isNumberPad || isEmailPad || isSecure;
  /** iOS: özel font + secureTextEntry mermi karakterlerini gizler. */
  const iosSecureBullets = Platform.OS === 'ios' && isSecure && !show;

  return (
    <View style={styles.wrap}>
      <Text style={[styles.label, { color: tone.label, fontSize: t.type.sm }]}>{label}</Text>
      <View
        style={[
          styles.field,
          {
            minHeight: t.field,
            backgroundColor: tone.fieldBg,
            borderColor: error ? colors.warm[500] : focused ? tone.borderFocus : tone.border,
          },
          focused && !error ? styles.fieldFocus : null,
          error ? styles.fieldError : null,
        ]}>
        {icon ? (
          <View style={[styles.iconChip, { backgroundColor: tone.iconBg, width: chip, height: chip }]}>
            <Ionicons color={tone.icon} name={icon} size={t.icon.sm} />
          </View>
        ) : null}
        <TextInput
          {...rest}
          ref={ref}
          autoCapitalize={autoCapitalize ?? 'none'}
          autoCorrect={autoCorrect ?? !disableCorrect}
          blurOnSubmit={rest.blurOnSubmit ?? isNumberPad}
          inputAccessoryViewID={
            Platform.OS === 'ios' && isNumberPad
              ? NUMBER_PAD_ACCESSORY_ID
              : rest.inputAccessoryViewID
          }
          keyboardType={resolvedKeyboard}
          onBlur={(e) => {
            setFocused(false);
            onBlur?.(e);
          }}
          onFocus={(e) => {
            setFocused(true);
            onFocus?.(e);
          }}
          onSubmitEditing={(e) => {
            if (isNumberPad) Keyboard.dismiss();
            rest.onSubmitEditing?.(e);
          }}
          returnKeyType={rest.returnKeyType ?? (isNumberPad ? 'done' : undefined)}
          allowFontScaling={false}
          maxFontSizeMultiplier={MAX_FONT_SIZE_MULTIPLIER}
          placeholderTextColor={colors.cream[300]}
          secureTextEntry={isSecure && !show}
          selectionColor={tone.borderFocus}
          spellCheck={spellCheck ?? !disableCorrect}
          style={[
            styles.input,
            {
              fontSize: t.type.md,
              minWidth: 0,
              fontFamily: iosSecureBullets ? undefined : fonts.sansMedium,
            },
            style,
          ]}
        />
        {isSecure ? (
          <Pressable
            accessibilityRole="button"
            hitSlop={8}
            onPress={() => setShow((v) => !v)}
            style={[styles.eyeChip, { backgroundColor: tone.iconBg, width: chip, height: chip }]}>
            <Ionicons
              color={tone.icon}
              name={show ? 'eye-off-outline' : 'eye-outline'}
              size={t.icon.sm}
            />
          </Pressable>
        ) : null}
      </View>
      {error ? <Text style={styles.error}>{error}</Text> : null}
      {Platform.OS === 'ios' && isNumberPad ? (
        <InputAccessoryView nativeID={NUMBER_PAD_ACCESSORY_ID}>
          <View style={styles.accessory}>
            <Pressable
              accessibilityLabel="Klavyeyi kapat"
              accessibilityRole="button"
              hitSlop={8}
              onPress={() => Keyboard.dismiss()}
              style={styles.accessoryBtn}>
              <Text style={styles.accessoryDone}>Tamam</Text>
            </Pressable>
          </View>
        </InputAccessoryView>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 8, width: '100%' },
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
    width: '100%',
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
    flexShrink: 0,
  },
  eyeChip: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  input: {
    flex: 1,
    fontFamily: fonts.sansMedium,
    fontSize: 16,
    color: colors.cream[900],
    paddingVertical: 12,
    ...(Platform.OS === 'android' ? { includeFontPadding: false } : null),
  },
  error: {
    fontFamily: fonts.sans,
    fontSize: 12,
    color: colors.danger[600],
    flexShrink: 1,
  },
  accessory: {
    minHeight: 44,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    paddingHorizontal: 12,
    backgroundColor: colors.cream[100],
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.cream[200],
  },
  accessoryBtn: {
    minHeight: 44,
    justifyContent: 'center',
    paddingHorizontal: 8,
  },
  accessoryDone: {
    fontFamily: fonts.sansSemi,
    fontSize: 16,
    color: colors.brand[600],
  },
});
