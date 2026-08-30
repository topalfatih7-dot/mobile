import { Link, router } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { AuthBackButton } from '@/components/auth/AuthBackButton';
import { AuthScreenShell } from '@/components/auth/AuthScreenShell';
import { Button } from '@/components/ui/Button';
import { TextField } from '@/components/ui/TextField';
import { useToast } from '@/context/ToastContext';
import { sendPasswordReset } from '@/services/authPassword';
import { colors, fonts, radius, spacing } from '@/theme';

/** LOCK: docs/mobile/screens/public/forgot-password.md */
export default function ForgotPasswordScreen() {
  const { toast } = useToast();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const onSubmit = async () => {
    setLoading(true);
    try {
      const r = await sendPasswordReset(email);
      if (!r.success) {
        toast(r.error, 'error');
        return;
      }
      setSent(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthScreenShell
      subtitle="E-posta adresine sıfırlama bağlantısı gönderilir."
      title="Şifremi unuttum"
      topSlot={<AuthBackButton href="/(auth)/login" label="Girişe dön" placement="end" />}>
      {sent ? (
        <View style={styles.success}>
          <View style={styles.checkCircle}>
            <Ionicons color={colors.sage[600]} name="checkmark-circle" size={48} />
          </View>
          <Text style={styles.successTitle}>E-postanı kontrol et</Text>
          <Text style={styles.successBody}>
            Sıfırlama bağlantısı gönderildi. Gelen kutunu (ve spam’i) kontrol et; bağlantıdan yeni
            şifreni belirle.
          </Text>
          <Button label="Girişe dön" onPress={() => router.replace('/(auth)/login')} />
        </View>
      ) : (
        <View style={styles.form}>
          <TextField
            accent="brand"
            autoComplete="email"
            icon="mail-outline"
            keyboardType="email-address"
            label="E-posta"
            onChangeText={setEmail}
            onSubmitEditing={() => void onSubmit()}
            placeholder="ornek@yeniform.com"
            returnKeyType="send"
            textContentType="username"
            value={email}
          />
          <Button label="Bağlantı gönder" loading={loading} onPress={onSubmit} />
          <Link asChild href="/(auth)/login">
            <Pressable style={styles.back}>
              <Text style={styles.backText}>Girişe dön</Text>
            </Pressable>
          </Link>
        </View>
      )}
    </AuthScreenShell>
  );
}

const styles = StyleSheet.create({
  form: { gap: spacing.md },
  back: { alignItems: 'center', paddingVertical: 10 },
  backText: {
    fontFamily: fonts.sansSemi,
    fontSize: 14,
    color: colors.brand[600],
  },
  success: { alignItems: 'center', gap: spacing.md },
  checkCircle: {
    width: 72,
    height: 72,
    borderRadius: radius.full,
    backgroundColor: colors.sage[50],
    alignItems: 'center',
    justifyContent: 'center',
  },
  successTitle: {
    fontFamily: fonts.displayBold,
    fontSize: 22,
    color: colors.cream[900],
  },
  successBody: {
    fontFamily: fonts.sans,
    fontSize: 14,
    lineHeight: 21,
    color: colors.cream[800],
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
});
