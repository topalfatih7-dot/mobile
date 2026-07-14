import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams, type Href } from 'expo-router';
import { useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';

import { AuthScaffold } from '@/components/auth/AuthScaffold';
import { SocialAuthButtons } from '@/components/auth/SocialAuthButtons';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useApp } from '@/context/AppContext';
import { isPaidMembership } from '@/data/membershipPlans';
import { colors, fonts, spacing } from '@/constants/theme';
import { isValidEmailAddress, sanitizeEmailInput } from '@/utils/emailAddress';

export default function RegisterScreen() {
  const { plan: planParam } = useLocalSearchParams<{ plan?: string }>();
  const planId = typeof planParam === 'string' && planParam ? planParam : 'free';
  const { register, routeForRole } = useApp();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [agree, setAgree] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{ name?: string; email?: string; password?: string; terms?: string }>({});

  const onRegister = async () => {
    const cleanEmail = sanitizeEmailInput(email);
    if (cleanEmail !== email) setEmail(cleanEmail);

    const nextErrors: typeof errors = {};
    if (!name.trim()) nextErrors.name = 'Ad soyad gerekli';
    if (!isValidEmailAddress(cleanEmail)) nextErrors.email = 'Geçerli bir e-posta girin';
    if (password.length < 8) nextErrors.password = 'En az 8 karakter';
    if (!agree) nextErrors.terms = 'Devam etmek için koşulları kabul etmelisiniz';
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) return;

    setLoading(true);
    try {
      const result = await register({
        name: name.trim(),
        email: cleanEmail,
        password,
      });

      if (!result.success) {
        Alert.alert('Kayıt başarısız', result.error || 'Kayıt tamamlanamadı.');
        return;
      }

      if (isPaidMembership(planId)) {
        router.replace(`/(auth)/onboarding?plan=${encodeURIComponent(planId)}` as Href);
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
        <Pressable hitSlop={8} onPress={() => router.replace('/(auth)/login')}>
          <Text style={styles.switch}>
            Zaten hesabın var mı? <Text style={styles.switchLink}>Giriş Yap</Text>
          </Text>
        </Pressable>
      }
      subtitle="Birkaç adımda Yeni Form ailesine katıl ve dönüşümüne başla."
      title="Hesabını oluştur">
      <Input
        autoCapitalize="words"
        autoComplete="name"
        error={errors.name}
        icon="person-outline"
        label="Ad Soyad"
        onChangeText={setName}
        placeholder="Adın ve soyadın"
        value={name}
      />

      <View style={styles.gap} />

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
        placeholder="En az 8 karakter"
        value={password}
      />

      <Pressable
        accessibilityRole="checkbox"
        accessibilityState={{ checked: agree }}
        onPress={() => setAgree((v) => !v)}
        style={styles.terms}>
        <View style={[styles.checkbox, agree && styles.checkboxOn]}>
          {agree ? <Ionicons color={colors.white} name="checkmark" size={15} /> : null}
        </View>
        <Text style={styles.termsText}>
          <Text style={styles.termsLink}>Kullanım Koşulları</Text> ve{' '}
          <Text style={styles.termsLink}>Gizlilik Politikası</Text>&apos;nı okudum, kabul ediyorum.
        </Text>
      </Pressable>
      {errors.terms ? <Text style={styles.termsError}>{errors.terms}</Text> : null}

      <Button
        disabled={!agree}
        label="Hesap Oluştur"
        loading={loading}
        onPress={onRegister}
        rightIcon="arrow-forward"
      />

      <SocialAuthButtons flow="signup" position="bottom" />
    </AuthScaffold>
  );
}

const styles = StyleSheet.create({
  gap: {
    height: spacing.md,
  },
  terms: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 7,
    borderWidth: 1.5,
    borderColor: colors.borderStrong,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.sm,
  },
  checkboxOn: {
    backgroundColor: colors.brand[600],
    borderColor: colors.brand[600],
  },
  termsText: {
    flex: 1,
    fontFamily: fonts.regular,
    fontSize: 13,
    lineHeight: 19,
    color: colors.text.secondary,
  },
  termsLink: {
    fontFamily: fonts.semibold,
    color: colors.brand[600],
  },
  termsError: {
    fontFamily: fonts.medium,
    fontSize: 12.5,
    color: colors.danger,
    marginBottom: spacing.md,
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
