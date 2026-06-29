import { router } from 'expo-router';
import { useState } from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';

import { AuthScaffold } from '@/components/auth/AuthScaffold';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { supabase } from '@/services/supabaseClient';
import { colors, fonts, spacing } from '@/constants/theme';

export default function ResetPasswordScreen() {
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const onSave = async () => {
    if (password.length < 8) {
      setError('Şifre en az 8 karakter olmalı');
      return;
    }
    if (password !== confirm) {
      setError('Şifreler eşleşmiyor');
      return;
    }
    if (!supabase) {
      setError('Supabase yapılandırılmadı.');
      return;
    }

    setLoading(true);
    setError('');
    try {
      const { error: updateError } = await supabase.auth.updateUser({ password });
      if (updateError) {
        setError(updateError.message);
        return;
      }
      Alert.alert('Şifre güncellendi', 'Yeni şifrenizle giriş yapabilirsiniz.');
      router.replace('/(auth)/login');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthScaffold subtitle="Yeni şifrenizi belirleyin." title="Yeni şifre">
      <Input
        error={error}
        icon="lock-closed-outline"
        isPassword
        label="Yeni şifre"
        onChangeText={setPassword}
        placeholder="En az 8 karakter"
        value={password}
      />
      <View style={styles.gap} />
      <Input
        icon="lock-closed-outline"
        isPassword
        label="Şifre tekrar"
        onChangeText={setConfirm}
        placeholder="••••••••"
        value={confirm}
      />
      <View style={styles.gap} />
      <Button label="Şifreyi Kaydet" loading={loading} onPress={onSave} />
    </AuthScaffold>
  );
}

const styles = StyleSheet.create({
  gap: { height: spacing.md },
});
