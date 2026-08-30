import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { useScaledTheme } from '@/hooks/useScaledTheme';
import { colors, fonts, radius, spacing } from '@/theme';

type Props = {
  value: '' | 'female' | 'male';
  onChange: (v: 'female' | 'male') => void;
  error?: string;
  /** Kayıt sonrası cinsiyet kilitli (web GenderSelect.locked parity). */
  locked?: boolean;
  hint?: string;
};

/** LOCK: Kadın / Erkek */
export function GenderSelect({ value, onChange, error, locked = false, hint }: Props) {
  const t = useScaledTheme();
  return (
    <View style={styles.wrap}>
      <View style={styles.labelRow}>
        <Text style={[styles.label, { fontSize: t.type.sm }]}>Cinsiyet</Text>
        {locked ? <Ionicons color={colors.cream[300]} name="lock-closed" size={12} /> : null}
      </View>
      <View style={styles.row}>
        {(
          [
            { id: 'female' as const, label: 'Kadın', tint: colors.warm[100], active: colors.warm[500] },
            { id: 'male' as const, label: 'Erkek', tint: colors.brand[100], active: colors.brand[600] },
          ] as const
        ).map((opt) => {
          const selected = value === opt.id;
          return (
            <Pressable
              key={opt.id}
              accessibilityRole="button"
              accessibilityState={{ selected }}
              disabled={locked}
              onPress={() => onChange(opt.id)}
              style={[
                styles.chip,
                { minHeight: Math.max(48, t.hit), backgroundColor: selected ? opt.active : opt.tint },
                selected && styles.chipSelected,
                locked && styles.chipLocked,
              ]}>
              <Text style={[styles.chipText, { fontSize: t.type.body }, selected && styles.chipTextOn]}>
                {opt.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
      {error ? <Text style={styles.error}>{error}</Text> : null}
      {!error && hint ? <Text style={styles.hint}>{hint}</Text> : null}
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
  row: { flexDirection: 'row', gap: spacing.sm },
  chip: {
    flex: 1,
    minHeight: 48,
    borderRadius: radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chipSelected: {
    boxShadow: '0px 4px 10px rgba(26,69,92,0.15)',
    elevation: 3,
  },
  chipLocked: { opacity: 0.75 },
  chipText: {
    fontFamily: fonts.sansSemi,
    fontSize: 15,
    color: colors.cream[900],
  },
  chipTextOn: { color: colors.white },
  error: { fontFamily: fonts.sans, fontSize: 12, color: colors.danger[600] },
  hint: { fontFamily: fonts.sans, fontSize: 12, color: colors.cream[800], opacity: 0.55 },
});
