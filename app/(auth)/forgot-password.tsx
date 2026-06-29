import { router } from 'expo-router';
import { useState } from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';

import { AuthScaffold } from '@/components/auth/AuthScaffold';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { requestPasswordReset } from '@/services/supabaseAuth';
import { colors, fonts, spacing } from '@/constants/theme';
import { isValidEmailAddress, sanitizeEmailInput } from '@/utils/emailAddress';

export default function ForgotPasswordScreen() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [sent, setSent] = useState(false);

  const onSubmit = async () => {
    const cleanEmail = sanitizeEmailInput(email);
    if (cleanEmail !== email) setEmail(cleanEmail);
    if (!isValidEmailAddress(cleanEmail)) {
      setError('Geçerli bir e-posta girin');
      return;
    }

    setLoading(true);
    setError('');
    try {
      const result = await requestPasswordReset(cleanEmail);
      if (!result.success) {
        setError(result.error || 'İşlem başarısız.');
        return;
      }
      setSent(true);
      Alert.alert(
        'E-posta gönderildi',
        'Şifre sıfırlama bağlantısı e-posta adresinize gönderildi. Gelen kutunuzu kontrol edin.',
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthScaffold
      footer={
        <Text onPress={() => router.back()} style={styles.back}>
          Giriş ekranına dön
        </Text>
      }
      subtitle="Kayıtlı e-posta adresinize sıfırlama bağlantısı göndeririz."
      title="Şifremi unuttum">
      <Input
        autoCapitalize="none"
        autoComplete="email"
        error={error}
        icon="mail-outline"
        keyboardType="email-address"
        label="E-posta"
        onChangeText={setEmail}
        placeholder="ornek@eposta.com"
        value={email}
      />

      {sent ? <Text style={styles.success}>Bağlantı gönderildi. E-postanızı kontrol edin.</Text> : null}

      <View style={styles.gap} />
      <Button label="Sıfırlama Bağlantısı Gönder" loading={loading} onPress={onSubmit} />
    </AuthScaffold>
  );
}

const styles = StyleSheet.create({
  gap: { height: spacing.lg },
  back: {
    fontFamily: fonts.semibold,
    fontSize: 14.5,
    color: colors.brand[600],
    textAlign: 'center',
  },
  success: {
    marginTop: spacing.md,
    fontFamily: fonts.medium,
    fontSize: 13.5,
    color: colors.success,
    lineHeight: 20,
  },
});
