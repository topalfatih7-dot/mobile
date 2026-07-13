import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';

import { AuthScaffold } from '@/components/auth/AuthScaffold';
import { SocialAuthButtons } from '@/components/auth/SocialAuthButtons';
import { SettingsToggleRow } from '@/components/profile/SettingsToggleRow';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useApp } from '@/context/AppContext';
import { colors, fonts, radius, spacing } from '@/constants/theme';
import { consumeSessionRevokedMessage } from '@/services/singleSession';
import { isValidEmailAddress, sanitizeEmailInput } from '@/utils/emailAddress';

export default function LoginScreen() {
  const { login, routeForRole } = useApp();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [remember, setRemember] = useState(true);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});
  const [banner, setBanner] = useState<string | null>(null);

  useEffect(() => {
    void consumeSessionRevokedMessage().then((msg) => {
      if (msg) setBanner(msg);
    });
  }, []);

  const onLogin = async () => {
    const cleanEmail = sanitizeEmailInput(email);
    if (cleanEmail !== email) setEmail(cleanEmail);

    const nextErrors: typeof errors = {};
    if (!isValidEmailAddress(cleanEmail)) nextErrors.email = 'Geçerli bir e-posta girin';
    if (password.length < 6) nextErrors.password = 'En az 6 karakter';
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) return;

    setLoading(true);
    try {
      const result = await login(cleanEmail, password, remember);
      if (!result.success) {
        Alert.alert('Giriş başarısız', result.error || 'E-posta veya şifre hatalı.');
        return;
      }
      router.replace(routeForRole(result.role || 'member'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthScaffold
      footer={
        <Pressable hitSlop={8} onPress={() => router.replace('/(auth)/register')}>
          <Text style={styles.switch}>
            Hesabın yok mu? <Text style={styles.switchLink}>Kayıt Ol</Text>
          </Text>
        </Pressable>
      }
      subtitle="Hesabına giriş yap, dönüşümüne kaldığın yerden devam et."
      title="Tekrar hoş geldin">
      {banner ? (
        <View style={styles.banner}>
          <Text style={styles.bannerText}>{banner}</Text>
        </View>
      ) : null}

      <Input
        autoCapitalize="none"
        autoComplete="email"
        error={errors.email}
        icon="mail-outline"
        keyboardType="email-address"
        label="E-posta"
        onChangeText={setEmail}
        placeholder="ornek@eposta.com"
        value={email}
      />

      <View style={styles.gap} />

      <Input
        error={errors.password}
        icon="lock-closed-outline"
        isPassword
        label="Şifre"
        onChangeText={setPassword}
        placeholder="••••••••"
        value={password}
      />

      <View style={styles.rememberBox}>
        <SettingsToggleRow
          description="Kapalıysa uygulama kapanınca oturum silinir."
          label="Beni hatırla"
          onValueChange={setRemember}
          value={remember}
        />
      </View>

      <Pressable hitSlop={8} onPress={() => router.push('/(auth)/forgot-password')} style={styles.forgot}>
        <Text style={styles.forgotText}>Şifremi unuttum?</Text>
      </Pressable>

      <Button label="Giriş Yap" loading={loading} onPress={onLogin} rightIcon="arrow-forward" />

      <SocialAuthButtons flow="login" position="bottom" remember={remember} />
    </AuthScaffold>
  );
}

const styles = StyleSheet.create({
  gap: {
    height: spacing.md,
  },
  rememberBox: {
    marginTop: spacing.md,
    borderRadius: radius.md,
    overflow: 'hidden',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  banner: {
    marginBottom: spacing.md,
    padding: spacing.md,
    borderRadius: radius.md,
    backgroundColor: '#fef2f2',
    borderWidth: 1,
    borderColor: '#fecaca',
  },
  bannerText: {
    fontFamily: fonts.medium,
    fontSize: 13.5,
    lineHeight: 19,
    color: colors.danger,
  },
  forgot: {
    alignSelf: 'flex-end',
    marginTop: spacing.sm,
    marginBottom: spacing.lg,
  },
  forgotText: {
    fontFamily: fonts.semibold,
    fontSize: 13.5,
    color: colors.brand[600],
  },
  switch: {
    fontFamily: fonts.medium,
    fontSize: 14.5,
    color: colors.text.secondary,
  },
  switchLink: {
    fontFamily: fonts.bold,
    color: colors.brand[600],
  },
});
