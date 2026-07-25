import { router } from 'expo-router';
import { useState } from 'react';
import { Alert, StyleSheet, View } from 'react-native';

import { AuthScreenShell } from '@/components/auth/AuthScreenShell';
import { Button } from '@/components/ui/Button';
import { PasswordRules } from '@/components/ui/PasswordRules';
import { TextField } from '@/components/ui/TextField';
import { useToast } from '@/context/ToastContext';
import { updatePassword } from '@/services/authPassword';
import { spacing } from '@/theme';

/** LOCK: docs/mobile/screens/public/reset-password.md */
export default function ResetPasswordScreen() {
  const { toast } = useToast();
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);

  const onSubmit = async () => {
    setLoading(true);
    try {
      const r = await updatePassword(password, confirm);
      if (!r.success) {
        Alert.alert('Şifre', r.error);
        return;
      }
      toast('Şifren güncellendi. Giriş yapabilirsin.', 'success');
      router.replace('/(auth)/login');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthScreenShell
      subtitle="Yeni şifren güvenlik kurallarını karşılamalı."
      title="Yeni şifre">
      <View style={styles.form}>
        <TextField
          accent="sage"
          icon="lock-closed-outline"
          label="Yeni şifre"
          onChangeText={setPassword}
          placeholder="••••••••"
          secureTextEntry
          value={password}
        />
        <PasswordRules password={password} />
        <TextField
          accent="brand"
          icon="shield-checkmark-outline"
          label="Şifre tekrar"
          onChangeText={setConfirm}
          placeholder="••••••••"
          secureTextEntry
          value={confirm}
        />
        <Button label="Şifreyi güncelle" loading={loading} onPress={onSubmit} />
      </View>
    </AuthScreenShell>
  );
}

const styles = StyleSheet.create({
  form: { gap: spacing.md },
});
