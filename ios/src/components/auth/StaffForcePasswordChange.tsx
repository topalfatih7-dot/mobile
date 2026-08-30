import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { BrandLogo } from '@/components/ui/BrandLogo';
import { FormKeyboardScroll } from '@/components/ui/FormKeyboardScroll';
import { PasswordRules } from '@/components/ui/PasswordRules';
import { TextField } from '@/components/ui/TextField';
import { BRAND } from '@/config/brand';
import { useToast } from '@/context/ToastContext';
import { supabase } from '@/services/supabase';
import { colors, fonts, radius, spacing } from '@/theme';
import { isPasswordValid } from '@/utils/password';

type Props = {
  staffName?: string | null;
  onDone: () => void | Promise<void>;
};

/**
 * Web parity: Adsız `StaffForcePasswordChange.jsx`
 * İlk giriş (geçici şifre) — yeni şifre + tekrar; shell kilitli.
 */
export function StaffForcePasswordChange({ staffName, onDone }: Props) {
  const { toast } = useToast();
  const insets = useSafeAreaInsets();
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);

  const firstName = String(staffName || '')
    .trim()
    .split(/\s+/)[0];
  const mismatch = Boolean(confirm) && confirm !== password;
  const canSubmit = isPasswordValid(password) && password === confirm && !loading;

  const handleSubmit = async () => {
    if (!isPasswordValid(password)) {
      toast('Şifreniz tüm gereksinimleri karşılamalıdır.', 'error');
      return;
    }
    if (password !== confirm) {
      toast('Şifreler eşleşmiyor.', 'error');
      return;
    }
    if (!supabase) {
      toast('Oturum gerekli.', 'error');
      return;
    }
    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      toast('Şifreniz başarıyla güncellendi!', 'success');
      await onDone();
    } catch (err) {
      toast(
        (err as Error)?.message || 'Şifre güncellenemedi, lütfen tekrar deneyin.',
        'error',
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={[styles.root, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
      <LinearGradient
        colors={[
          'rgba(26,69,92,0.95)',
          'rgba(26,35,50,0.92)',
          'rgba(45,98,66,0.9)',
        ]}
        end={{ x: 1, y: 1 }}
        start={{ x: 0, y: 0 }}
        style={StyleSheet.absoluteFill}
      />
      <FormKeyboardScroll
        contentContainerStyle={styles.scroll}
        keyboardDismissMode="on-drag">
          <View style={styles.logoWrap}>
            <BrandLogo showWordmark={false} size="md" variant="mark" />
          </View>

          <View style={styles.card}>
            <LinearGradient
              colors={[colors.brand[500], colors.sage[500]]}
              end={{ x: 1, y: 0 }}
              start={{ x: 0, y: 0 }}
              style={styles.cardAccent}
            />

            <View style={styles.cardBody}>
              <View style={styles.hero}>
                <LinearGradient
                  colors={[colors.brand[400], colors.sage[500]]}
                  style={styles.heroIcon}>
                  <Ionicons color={colors.white} name="shield-checkmark" size={32} />
                </LinearGradient>
                <Text style={styles.title}>Şifrenizi Güncelleyin</Text>
                <Text style={styles.sub}>
                  Merhaba{firstName ? ` ${firstName}` : ''}, ilk girişiniz olduğu için güvenli
                  bir şifre belirlemeniz gerekmektedir.
                </Text>
              </View>

              <View style={styles.rulesBox}>
                <Text style={styles.rulesLabel}>Şifre gereksinimleri</Text>
                <PasswordRules password={password} />
              </View>

              <View style={styles.form}>
                <TextField
                  accent="brand"
                  autoComplete="new-password"
                  icon="lock-closed-outline"
                  label="Yeni Şifre"
                  onChangeText={setPassword}
                  placeholder="Yeni şifrenizi girin"
                  secureTextEntry
                  value={password}
                />
                <TextField
                  accent={mismatch ? 'warm' : 'sage'}
                  autoComplete="new-password"
                  error={mismatch ? 'Şifreler eşleşmiyor.' : undefined}
                  icon="lock-closed-outline"
                  label="Şifre Tekrarı"
                  onChangeText={setConfirm}
                  placeholder="Şifrenizi tekrar girin"
                  secureTextEntry
                  value={confirm}
                />

                <Pressable
                  accessibilityRole="button"
                  disabled={!canSubmit}
                  onPress={() => void handleSubmit()}
                  style={({ pressed }) => [
                    styles.submit,
                    !canSubmit && styles.submitDisabled,
                    pressed && canSubmit && { opacity: 0.92 },
                  ]}>
                  <LinearGradient
                    colors={[colors.brand[500], colors.sage[500]]}
                    end={{ x: 1, y: 0 }}
                    start={{ x: 0, y: 0 }}
                    style={styles.submitGrad}>
                    {loading ? (
                      <ActivityIndicator color={colors.white} />
                    ) : (
                      <Text style={styles.submitLabel}>Şifremi Kaydet ve Devam Et</Text>
                    )}
                  </LinearGradient>
                </Pressable>
              </View>
            </View>
          </View>

          <Text style={styles.footer}>
            © {new Date().getFullYear()} {BRAND.name}
          </Text>
        </FormKeyboardScroll>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 100,
    elevation: 100,
  },
  flex: { flex: 1 },
  scroll: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.xl,
  },
  logoWrap: {
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  card: {
    overflow: 'hidden',
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    backgroundColor: colors.white,
  },
  cardAccent: { height: 6 },
  cardBody: { padding: spacing.xl },
  hero: { alignItems: 'center', marginBottom: spacing.lg },
  heroIcon: {
    width: 64,
    height: 64,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    marginTop: spacing.md,
    fontFamily: fonts.displayBold,
    fontSize: 22,
    color: colors.cream[900],
    textAlign: 'center',
  },
  sub: {
    marginTop: spacing.sm,
    fontFamily: fonts.sans,
    fontSize: 14,
    lineHeight: 21,
    color: 'rgba(58,69,80,0.65)',
    textAlign: 'center',
  },
  rulesBox: {
    marginBottom: spacing.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 2,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.cream[100],
    backgroundColor: 'rgba(243,246,248,0.6)',
  },
  rulesLabel: {
    marginBottom: spacing.xs,
    fontFamily: fonts.sansSemi,
    fontSize: 11,
    letterSpacing: 0.6,
    textTransform: 'uppercase',
    color: 'rgba(58,69,80,0.6)',
  },
  form: { gap: spacing.md },
  submit: {
    marginTop: spacing.xs,
    borderRadius: 20,
    overflow: 'hidden',
  },
  submitDisabled: { opacity: 0.55 },
  submitGrad: {
    minHeight: 52,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
  },
  submitLabel: {
    fontFamily: fonts.sansBold,
    fontSize: 14,
    color: colors.white,
  },
  footer: {
    marginTop: spacing.xl,
    textAlign: 'center',
    fontFamily: fonts.sans,
    fontSize: 12,
    color: 'rgba(255,255,255,0.4)',
  },
});
