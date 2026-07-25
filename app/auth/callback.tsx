import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams, type Href } from 'expo-router';
import { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button } from '@/components/ui/Button';
import { MeshBackground } from '@/components/ui/MeshBackground';
import { isUiOnly } from '@/config/runtime';
import { colors, fonts, radius, spacing } from '@/theme';

/**
 * LOCK: docs/mobile/screens/public/auth-callback.md
 * Deep link: yeniform://auth/callback
 */
export default function AuthCallbackScreen() {
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{
    verify?: string;
    next?: string;
    code?: string;
    error?: string;
    error_description?: string;
  }>();
  const [status, setStatus] = useState<'loading' | 'ok' | 'error'>('loading');
  const [message, setMessage] = useState('Oturum doğrulanıyor…');

  useEffect(() => {
    const err = params.error || params.error_description;
    if (err) {
      setStatus('error');
      setMessage(String(params.error_description || params.error || 'Bağlantı geçersiz.'));
      return;
    }

    if (isUiOnly()) {
      const t = setTimeout(() => {
        if (params.next === 'reset-password' || params.verify === 'recovery') {
          setStatus('ok');
          setMessage('Şifre sıfırlama bağlantısı doğrulandı.');
          return;
        }
        setStatus('ok');
        setMessage('Giriş doğrulandı. Devam edebilirsiniz.');
      }, 600);
      return () => clearTimeout(t);
    }

    // Bağlama sonrası: exchange code / establishSession
    setStatus('error');
    setMessage('Giriş doğrulanamadı. Lütfen tekrar deneyin.');
  }, [params]);

  const goNext = () => {
    if (params.next === 'reset-password' || params.verify === 'recovery') {
      router.replace('/(auth)/reset-password' as Href);
      return;
    }
    router.replace('/(auth)/login' as Href);
  };

  return (
    <MeshBackground style={styles.root}>
      <View style={[styles.card, { marginTop: insets.top + 48 }]}>
        <Ionicons
          color={
            status === 'loading'
              ? colors.brand[500]
              : status === 'ok'
                ? colors.sage[500]
                : colors.warm[500]
          }
          name={
            status === 'loading'
              ? 'hourglass'
              : status === 'ok'
                ? 'checkmark-circle'
                : 'alert-circle'
          }
          size={48}
        />
        <Text style={styles.title}>
          {status === 'loading' ? 'Doğrulanıyor' : status === 'ok' ? 'Tamam' : 'Hata'}
        </Text>
        <Text style={styles.body}>{message}</Text>
        {status !== 'loading' ? (
          <Button
            label={status === 'ok' ? 'Devam et' : 'Girişe dön'}
            onPress={goNext}
          />
        ) : null}
      </View>
    </MeshBackground>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, paddingHorizontal: spacing.lg },
  card: {
    backgroundColor: colors.white,
    borderRadius: radius.xl,
    padding: spacing.xl,
    borderWidth: 1,
    borderColor: colors.cream[200],
    alignItems: 'center',
    gap: spacing.md,
  },
  title: { fontFamily: fonts.displayExtra, fontSize: 24, color: colors.cream[900] },
  body: {
    fontFamily: fonts.sans,
    fontSize: 14,
    color: colors.cream[800],
    textAlign: 'center',
    lineHeight: 21,
  },
});
