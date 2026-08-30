import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { SelectSheet } from '@/components/ui/SelectSheet';
import {
  COUNTRY_CODES,
  DEFAULT_COUNTRY_ISO,
  formatNationalNumber,
  getCountry,
} from '@/data/countryCodes';
import { useScaledTheme } from '@/hooks/useScaledTheme';
import { colors, fonts, radius, spacing } from '@/theme';

type Props = {
  label?: string;
  country?: string;
  value?: string;
  onCountryChange?: (iso: string) => void;
  onValueChange?: (formattedNational: string) => void;
  error?: string;
  hint?: string;
  disabled?: boolean;
  /** Parent already a RN Modal — nested SelectSheet iOS’ta açılmaz. */
  embedded?: boolean;
};

/** Web PhoneField parity — ülke kodu + ulusal numara. */
export function PhoneField({
  label = 'Telefon Numarası',
  country = DEFAULT_COUNTRY_ISO,
  value = '',
  onCountryChange,
  onValueChange,
  error,
  hint,
  disabled = false,
  embedded = false,
}: Props) {
  const t = useScaledTheme();
  const [countryOpen, setCountryOpen] = useState(false);
  const selected = getCountry(country);

  return (
    <View style={styles.wrap}>
      {label ? (
        <View style={styles.labelRow}>
          <Text style={[styles.label, { fontSize: t.type.sm }]}>{label}</Text>
          {disabled ? (
            <Ionicons color={colors.cream[300]} name="lock-closed" size={12} />
          ) : null}
        </View>
      ) : null}

      <View
        style={[
          styles.field,
          { minHeight: t.field },
          disabled && styles.fieldDisabled,
          error ? styles.fieldError : null,
        ]}>
        <Pressable
          disabled={disabled}
          onPress={() => setCountryOpen(true)}
          style={styles.countryBtn}>
          <Text style={styles.flag}>{selected.flag}</Text>
          <Text style={[styles.dial, { fontSize: t.ms(14) }]}>+{selected.dial}</Text>
          {!disabled ? (
            <Ionicons color={colors.cream[300]} name="chevron-down" size={14} />
          ) : null}
        </Pressable>
        <TextInput
          allowFontScaling={false}
          autoComplete="tel"
          autoCorrect={false}
          editable={!disabled}
          keyboardType="phone-pad"
          onChangeText={(raw) => onValueChange?.(formatNationalNumber(country, raw))}
          placeholder={country === 'TR' ? '5XX XXX XX XX' : 'Numara'}
          placeholderTextColor={colors.cream[300]}
          style={[styles.input, { fontSize: t.type.md }]}
          textContentType="telephoneNumber"
          value={value}
        />
      </View>

      {error ? (
        <Text style={styles.error}>{error}</Text>
      ) : hint ? (
        <Text style={styles.hint}>{hint}</Text>
      ) : null}

      <SelectSheet
        embedded={embedded}
        onClose={() => setCountryOpen(false)}
        onSelect={(iso) => onCountryChange?.(iso)}
        options={COUNTRY_CODES.map((c) => ({
          value: c.iso,
          label: `${c.flag} ${c.name} (+${c.dial})`,
        }))}
        title="Ülke kodu"
        value={country}
        visible={countryOpen}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 8 },
  labelRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  label: {
    fontFamily: fonts.sansSemi,
    fontSize: 13,
    color: colors.brand[700],
  },
  field: {
    minHeight: 56,
    borderRadius: radius.xl,
    borderWidth: 1.5,
    borderColor: colors.brand[200],
    backgroundColor: colors.brand[50],
    flexDirection: 'row',
    alignItems: 'center',
    overflow: 'hidden',
  },
  fieldDisabled: {
    opacity: 0.8,
    backgroundColor: colors.cream[100],
    borderColor: colors.cream[200],
  },
  fieldError: {
    borderColor: colors.danger[500],
    backgroundColor: colors.warm[50],
  },
  countryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    borderRightWidth: 1,
    borderRightColor: colors.cream[200],
    alignSelf: 'stretch',
  },
  flag: { fontSize: 16 },
  dial: { fontFamily: fonts.sansSemi, fontSize: 14, color: colors.cream[900] },
  input: {
    flex: 1,
    fontFamily: fonts.sansMedium,
    fontSize: 16,
    color: colors.cream[900],
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  error: { fontFamily: fonts.sans, fontSize: 12, color: colors.danger[600] },
  hint: { fontFamily: fonts.sans, fontSize: 12, color: colors.cream[800], opacity: 0.55 },
});
