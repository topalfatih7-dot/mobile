import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

import { colors, fonts, radius, spacing } from '@/theme';

type Tone = 'brand' | 'sage' | 'cream' | 'gold';

const TONES: Record<Tone, { grad: [string, string]; iconBg: string; border: string }> = {
  brand: {
    grad: [colors.brand[50], colors.white],
    iconBg: colors.brand[500],
    border: colors.brand[200],
  },
  sage: {
    grad: [colors.sage[50], colors.white],
    iconBg: colors.sage[500],
    border: colors.sage[200],
  },
  cream: {
    grad: [colors.cream[100], colors.white],
    iconBg: colors.cream[800],
    border: colors.cream[200],
  },
  gold: {
    grad: ['#fbf6ea', colors.white],
    iconBg: colors.gold[500],
    border: '#e6d3a0',
  },
};

export function QuickLinkTile({
  title,
  sub,
  icon,
  tone = 'brand',
  onPress,
}: {
  title: string;
  sub: string;
  icon: keyof typeof Ionicons.glyphMap;
  tone?: Tone;
  onPress: () => void;
}) {
  const t = TONES[tone];
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.wrap, pressed && styles.pressed]}>
      <LinearGradient colors={t.grad} end={{ x: 1, y: 1 }} start={{ x: 0, y: 0 }} style={[styles.card, { borderColor: t.border }]}>
        <View style={[styles.icon, { backgroundColor: t.iconBg }]}>
          <Ionicons color={colors.white} name={icon} size={22} />
        </View>
        <View style={styles.text}>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.sub}>{sub}</Text>
        </View>
      </LinearGradient>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  wrap: { width: '100%' },
  pressed: { opacity: 0.92, transform: [{ scale: 0.98 }] },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    borderRadius: radius.xl,
    borderWidth: 1,
    padding: spacing.md,
  },
  icon: {
    width: 48,
    height: 48,
    borderRadius: radius.xl,
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: { flex: 1, gap: 2 },
  title: {
    fontFamily: fonts.sansSemi,
    fontSize: 15,
    color: colors.cream[900],
  },
  sub: {
    fontFamily: fonts.sans,
    fontSize: 12,
    color: colors.cream[800],
    opacity: 0.6,
  },
});
