import { StyleSheet, Switch, Text, View } from 'react-native';

import { colors, fonts, radius, spacing } from '@/constants/theme';

type SettingsToggleRowProps = {
  label: string;
  description?: string;
  value: boolean;
  onValueChange: (value: boolean) => void;
  disabled?: boolean;
};

export function SettingsToggleRow({
  label,
  description,
  value,
  onValueChange,
  disabled,
}: SettingsToggleRowProps) {
  return (
    <View style={styles.row}>
      <View style={styles.text}>
        <Text style={styles.label}>{label}</Text>
        {description ? <Text style={styles.description}>{description}</Text> : null}
      </View>
      <Switch
        disabled={disabled}
        onValueChange={onValueChange}
        thumbColor={colors.white}
        trackColor={{ false: colors.ink[200], true: colors.brand[400] }}
        value={value}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  text: {
    flex: 1,
    paddingRight: spacing.md,
  },
  label: {
    fontFamily: fonts.semibold,
    fontSize: 15,
    color: colors.text.primary,
  },
  description: {
    fontFamily: fonts.regular,
    fontSize: 12.5,
    lineHeight: 18,
    color: colors.text.secondary,
    marginTop: 3,
  },
});
