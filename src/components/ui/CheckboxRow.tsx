import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text } from 'react-native';

import { colors, fonts, spacing } from '@/theme';

type Props = {
  label: string;
  checked: boolean;
  onChange: (next: boolean) => void;
};

export function CheckboxRow({ label, checked, onChange }: Props) {
  return (
    <Pressable
      accessibilityRole="checkbox"
      accessibilityState={{ checked }}
      onPress={() => onChange(!checked)}
      style={styles.row}>
      <Ionicons
        color={checked ? colors.brand[600] : colors.cream[300]}
        name={checked ? 'checkbox' : 'square-outline'}
        size={22}
      />
      <Text style={styles.label}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    minHeight: 44,
  },
  label: {
    fontFamily: fonts.sans,
    fontSize: 14,
    color: colors.cream[900],
  },
});
