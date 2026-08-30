import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { useScaledTheme } from '@/hooks/useScaledTheme';
import { colors, fonts, radius, spacing } from '@/theme';

export type ChoiceTone =
  | 'sky'
  | 'coral'
  | 'brand'
  | 'rose'
  | 'amber'
  | 'sage'
  | 'emerald';

const TONES: Record<
  ChoiceTone,
  { icon: string; selectedBox: string; selectedIcon: string }
> = {
  sky: { icon: colors.brand[600], selectedBox: colors.brand[500], selectedIcon: colors.white },
  coral: { icon: colors.warm[500], selectedBox: colors.warm[500], selectedIcon: colors.white },
  brand: { icon: colors.brand[600], selectedBox: colors.brand[500], selectedIcon: colors.white },
  rose: { icon: colors.warm[500], selectedBox: colors.warm[500], selectedIcon: colors.white },
  amber: { icon: colors.gold[500], selectedBox: colors.gold[500], selectedIcon: colors.white },
  sage: { icon: colors.sage[600], selectedBox: colors.sage[500], selectedIcon: colors.white },
  emerald: { icon: colors.sage[600], selectedBox: colors.sage[600], selectedIcon: colors.white },
};

type Props = {
  selected: boolean;
  tone?: ChoiceTone;
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  hint?: string;
  onPress: () => void;
};

/** Hedef / spor seviyesi / beslenme çoklu-seçim pili (web ChoiceChip parity). */
export function ChoiceChip({
  selected,
  tone = 'brand',
  icon,
  label,
  hint,
  onPress,
}: Props) {
  const t = useScaledTheme();
  const stylesTone = TONES[tone] || TONES.brand;
  const box = t.ss(36);

  return (
    <Pressable
      onPress={onPress}
      style={[styles.chip, selected && styles.chipSelected, { minHeight: t.hit }]}>
      <View
        style={[
          styles.iconBox,
          {
            width: box,
            height: box,
            backgroundColor: selected ? stylesTone.selectedBox : colors.cream[100],
          },
        ]}>
        <Ionicons
          color={selected ? stylesTone.selectedIcon : stylesTone.icon}
          name={icon}
          size={t.ms(16)}
        />
      </View>
      <View style={styles.textCol}>
        <Text style={[styles.label, { fontSize: t.ms(12) }]}>{label}</Text>
        {hint ? <Text style={[styles.hint, { fontSize: t.ms(10) }]}>{hint}</Text> : null}
      </View>
      {selected ? (
        <View style={styles.check}>
          <Ionicons color={colors.white} name="checkmark" size={12} />
        </View>
      ) : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.cream[200],
    backgroundColor: colors.white,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  chipSelected: {
    borderColor: 'rgba(26,35,50,0.2)',
    boxShadow: '0px 2px 6px rgba(26,35,50,0.06)',
    elevation: 1,
  },
  iconBox: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textCol: { flex: 1, minWidth: 0 },
  label: { fontFamily: fonts.sansSemi, fontSize: 12, color: colors.cream[900] },
  hint: {
    fontFamily: fonts.sans,
    fontSize: 10,
    color: colors.cream[800],
    opacity: 0.5,
    marginTop: 2,
  },
  check: {
    width: 20,
    height: 20,
    borderRadius: radius.full,
    backgroundColor: colors.cream[900],
    alignItems: 'center',
    justifyContent: 'center',
  },
});
