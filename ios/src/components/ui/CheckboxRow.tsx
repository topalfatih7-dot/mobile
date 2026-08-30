import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text } from 'react-native';

import { useScaledTheme } from '@/hooks/useScaledTheme';
import { colors, fonts, spacing } from '@/theme';

type Props = {
  label: string;
  checked: boolean;
  onChange: (next: boolean) => void;
};

export function CheckboxRow({ label, checked, onChange }: Props) {
  const t = useScaledTheme();
  return (
    <Pressable
      accessibilityRole="checkbox"
      accessibilityState={{ checked }}
      onPress={() => onChange(!checked)}
      style={[styles.row, { minHeight: t.hit }]}>
      <Ionicons
        color={checked ? colors.brand[600] : colors.cream[300]}
        name={checked ? 'checkbox' : 'square-outline'}
        size={t.icon.md}
      />
      <Text style={[styles.label, { fontSize: t.ms(14), lineHeight: t.ms(20) }]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
    minHeight: 44,
    paddingVertical: 2,
  },
  label: {
    flex: 1,
    flexShrink: 1,
    minWidth: 0,
    fontFamily: fonts.sans,
    fontSize: 14,
    lineHeight: 20,
    color: colors.cream[900],
  },
});
