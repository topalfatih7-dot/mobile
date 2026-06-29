import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, Text } from 'react-native';
import type { ComponentProps } from 'react';

import { PressableScale } from '@/components/ui/PressableScale';
import { colors, fonts, radius, spacing } from '@/constants/theme';

type IconName = ComponentProps<typeof Ionicons>['name'];

type ChipProps = {
  label: string;
  active?: boolean;
  icon?: IconName;
  onPress?: () => void;
};

/** Kategori / filtre pili. Aktifken markalı dolgu alır. */
export function Chip({ label, active = false, icon, onPress }: ChipProps) {
  return (
    <PressableScale
      accessibilityRole="button"
      onPress={onPress}
      scaleTo={0.94}
      style={[styles.chip, active ? styles.chipActive : styles.chipIdle]}>
      {icon ? (
        <Ionicons
          color={active ? colors.white : colors.text.secondary}
          name={icon}
          size={15}
          style={styles.icon}
        />
      ) : null}
      <Text style={[styles.label, active ? styles.labelActive : styles.labelIdle]}>{label}</Text>
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    height: 38,
    borderRadius: radius.full,
  },
  chipIdle: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  chipActive: {
    backgroundColor: colors.brand[600],
  },
  icon: {
    marginRight: 6,
  },
  label: {
    fontFamily: fonts.semibold,
    fontSize: 13.5,
  },
  labelIdle: {
    color: colors.text.secondary,
  },
  labelActive: {
    color: colors.white,
  },
});
