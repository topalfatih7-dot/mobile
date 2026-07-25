import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { colors, fonts, radius, spacing } from '@/theme';

type Accent = 'brand' | 'sage' | 'warm' | 'gold';

const ACCENT: Record<Accent, { bg: string; icon: string; border: string }> = {
  brand: { bg: colors.brand[50], icon: colors.brand[600], border: colors.brand[200] },
  sage: { bg: colors.sage[50], icon: colors.sage[600], border: colors.sage[200] },
  warm: { bg: colors.warm[50], icon: colors.warm[500], border: colors.warm[200] },
  gold: { bg: '#fbf6ea', icon: colors.gold[500], border: '#ead9a8' },
};

export function StatCard({
  label,
  value,
  sub,
  icon,
  accent = 'brand',
  onPress,
}: {
  label: string;
  value: string;
  sub: string;
  icon: keyof typeof Ionicons.glyphMap;
  accent?: Accent;
  onPress?: () => void;
}) {
  const a = ACCENT[accent];
  return (
    <Pressable
      disabled={!onPress}
      onPress={onPress}
      style={({ pressed }) => [
        styles.card,
        { backgroundColor: a.bg, borderColor: a.border },
        pressed && styles.pressed,
      ]}>
      <View style={[styles.icon, { backgroundColor: colors.white }]}>
        <Ionicons color={a.icon} name={icon} size={18} />
      </View>
      <Text style={styles.label}>{label}</Text>
      <Text style={styles.value}>{value}</Text>
      <Text style={styles.sub}>{sub}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    width: '48%',
    borderRadius: radius.xl,
    borderWidth: 1,
    padding: spacing.md,
    gap: 4,
  },
  pressed: { opacity: 0.92, transform: [{ scale: 0.98 }] },
  icon: {
    width: 36,
    height: 36,
    borderRadius: radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  label: {
    fontFamily: fonts.sansMedium,
    fontSize: 12,
    color: colors.cream[800],
    opacity: 0.7,
  },
  value: {
    fontFamily: fonts.displayBold,
    fontSize: 18,
    color: colors.cream[900],
  },
  sub: {
    fontFamily: fonts.sans,
    fontSize: 12,
    color: colors.cream[800],
    opacity: 0.65,
  },
});
