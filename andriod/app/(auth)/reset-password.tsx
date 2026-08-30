import { router } from 'expo-router';
import { useRef, useState } from 'react';
import { StyleSheet, TextInput, View } from 'react-native';

import { AuthScreenShell } from '@/components/auth/AuthScreenShell';
import { Button } from '@/components/ui/Button';
import { FormErrorModal } from '@/components/ui/FormErrorModal';
import { PasswordRules } from '@/components/ui/PasswordRules';
import { TextField } from '@/components/ui/TextField';
import { useToast } from '@/context/ToastContext';
import { updatePassword } from '@/services/authPassword';
import { spacing } from '@/theme';

/** LOCK: docs/mobile/screens/public/reset-password.md */
export default function ResetPasswordScreen() {
  const { toast } = useToast();
  const confirmRef = useRef<TextInput>(null);
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorModal, setErrorModal] = useState<string | null>(null);

  const onSubmit = async () => {
    setLoading(true);
    try {
      const r = await updatePassword(password, confirm);
      if (!r.success) {
        setErrorModal(r.error);
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
          autoComplete="new-password"
          icon="lock-closed-outline"
          label="Yeni şifre"
          onChangeText={setPassword}
          onSubmitEditing={() => confirmRef.current?.focus()}
          placeholder="••••••••"
          returnKeyType="next"
          secureTextEntry
          submitBehavior="submit"
          textContentType="newPassword"
          value={password}
        />
        <PasswordRules password={password} />
        <TextField
          ref={confirmRef}
          accent="brand"
          autoComplete="new-password"
          icon="shield-checkmark-outline"
          label="Şifre tekrar"
          onChangeText={setConfirm}
          onSubmitEditing={() => void onSubmit()}
          placeholder="••••••••"
          returnKeyType="go"
          secureTextEntry
          textContentType="newPassword"
          value={confirm}
        />
        <Button label="Şifreyi güncelle" loading={loading} onPress={onSubmit} />
      </View>
      <FormErrorModal
        message={errorModal || ''}
        onClose={() => setErrorModal(null)}
        title="Şifre"
        visible={Boolean(errorModal)}
      />
    </AuthScreenShell>
  );
}

const styles = StyleSheet.create({
  form: { gap: spacing.md },
});
