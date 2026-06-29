import { router } from 'expo-router';
import { useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';

import { AuthScaffold } from '@/components/auth/AuthScaffold';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useApp } from '@/context/AppContext';
import { colors, fonts, spacing } from '@/constants/theme';
import { isValidEmailAddress, sanitizeEmailInput } from '@/utils/emailAddress';

export default function LoginScreen() {
  const { login, routeForRole } = useApp();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});

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
      const result = await login(cleanEmail, password, true);
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

      <Pressable hitSlop={8} onPress={() => router.push('/(auth)/forgot-password')} style={styles.forgot}>
        <Text style={styles.forgotText}>Şifremi unuttum?</Text>
      </Pressable>

      <Button label="Giriş Yap" loading={loading} onPress={onLogin} rightIcon="arrow-forward" />
    </AuthScaffold>
  );
}

const styles = StyleSheet.create({
  gap: {
    height: spacing.md,
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
