import { Ionicons } from '@expo/vector-icons';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';

import { useToast } from '@/context/ToastContext';
import { colors, fonts, radius, spacing } from '@/theme';

/**
 * LOCK layout slot — Google; iOS + Apple.
 * OAuth henüz bağlı değil → toast (uydurma akış yok).
 */
export function SocialAuthButtons() {
  const { toast } = useToast();
  const soon = () => toast('Sosyal giriş yakında bağlanacak.', 'info');

  return (
    <View style={styles.wrap}>
      <View style={styles.dividerRow}>
        <View style={styles.line} />
        <Text style={styles.or}>veya</Text>
        <View style={styles.line} />
      </View>
      <Pressable onPress={soon} style={({ pressed }) => [styles.btn, pressed && styles.pressed]}>
        <Ionicons color={colors.brand[700]} name="logo-google" size={18} />
        <Text style={styles.btnLabel}>Google ile devam et</Text>
      </Pressable>
      {Platform.OS === 'ios' ? (
        <Pressable
          onPress={soon}
          style={({ pressed }) => [styles.btn, styles.apple, pressed && styles.pressed]}>
          <Ionicons color={colors.white} name="logo-apple" size={20} />
          <Text style={[styles.btnLabel, styles.appleLabel]}>Apple ile devam et</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: spacing.sm, marginTop: spacing.md },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: 4,
  },
  line: { flex: 1, height: 1, backgroundColor: colors.cream[200] },
  or: {
    fontFamily: fonts.sans,
    fontSize: 12,
    color: colors.cream[800],
  },
  btn: {
    minHeight: 50,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.cream[200],
    backgroundColor: colors.white,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  apple: {
    backgroundColor: colors.cream[900],
    borderColor: colors.cream[900],
  },
  btnLabel: {
    fontFamily: fonts.sansSemi,
    fontSize: 15,
    color: colors.cream[900],
  },
  appleLabel: { color: colors.white },
  pressed: { opacity: 0.9, transform: [{ scale: 0.985 }] },
});
