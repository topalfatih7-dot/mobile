import { Ionicons } from '@expo/vector-icons';
import { router, type Href } from 'expo-router';
import { Pressable, StyleSheet, Text } from 'react-native';

import { colors, fonts, spacing } from '@/theme';

type Props = {
  /** Varsayılan: welcome index `/` */
  href?: Href;
  label?: string;
  /** `end` — scroll sonu (klavye açıkken kaybolabilir). */
  placement?: 'start' | 'end';
  /** Krem form zemininde koyu etiket; welcome/hero’da beyaz cam. */
  tone?: 'onDark' | 'onLight';
};

/** Login / kayıt / forgot — ana karşılama ekranına dönüş. */
export function AuthBackButton({
  href = '/',
  label = 'Geri',
  placement = 'start',
  tone = 'onLight',
}: Props) {
  const onDark = tone === 'onDark';
  return (
    <Pressable
      accessibilityRole="button"
      hitSlop={10}
      onPress={() => router.replace(href)}
      style={({ pressed }) => [
        styles.btn,
        onDark ? styles.btnOnDark : styles.btnOnLight,
        placement === 'end' ? styles.end : styles.start,
        pressed && styles.pressed,
      ]}>
      <Ionicons color={onDark ? colors.white : colors.brand[700]} name="chevron-back" size={20} />
      <Text style={[styles.label, onDark ? styles.labelOnDark : styles.labelOnLight]}>{label}</Text>
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
    borderWidth: 1,
  },
  btnOnDark: {
    backgroundColor: 'rgba(255,255,255,0.18)',
    borderColor: 'rgba(255,255,255,0.28)',
  },
  btnOnLight: {
    backgroundColor: colors.white,
    borderColor: colors.cream[200],
  },
  start: { marginBottom: spacing.md },
  end: { marginTop: spacing.lg },
  pressed: { opacity: 0.88 },
  label: {
    fontFamily: fonts.sansSemi,
    fontSize: 14,
  },
  labelOnDark: { color: colors.white },
  labelOnLight: { color: colors.brand[700] },
});
