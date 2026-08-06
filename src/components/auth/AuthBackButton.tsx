import { Ionicons } from '@expo/vector-icons';
import { router, type Href } from 'expo-router';
import { Pressable, StyleSheet, Text } from 'react-native';

import { colors, fonts, spacing } from '@/theme';

type Props = {
  /** Varsayılan: welcome index `/` */
  href?: Href;
  label?: string;
};

/** Login / kayıt / forgot — ana karşılama ekranına dönüş. */
export function AuthBackButton({ href = '/', label = 'Geri' }: Props) {
  return (
    <Pressable
      accessibilityRole="button"
      hitSlop={10}
      onPress={() => router.replace(href)}
      style={({ pressed }) => [styles.btn, pressed && styles.pressed]}>
      <Ionicons color={colors.white} name="chevron-back" size={20} />
      <Text style={styles.label}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  btn: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.18)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.28)',
    marginBottom: spacing.md,
  },
  pressed: { opacity: 0.88 },
  label: {
    fontFamily: fonts.sansSemi,
    fontSize: 14,
    color: colors.white,
  },
});
