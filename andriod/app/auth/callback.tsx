import { Ionicons } from '@expo/vector-icons';
import * as Linking from 'expo-linking';
import { router, useLocalSearchParams, type Href } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button } from '@/components/ui/Button';
import { MeshBackground } from '@/components/ui/MeshBackground';
import { useAuth } from '@/context/AuthContext';
import {
  establishAuthSessionFromUrl,
  isRecoveryCallback,
} from '@/services/authSessionFromUrl';
import { routeForHydrated } from '@/services/authHydrate';
import { requireSupabase, supabase } from '@/services/supabase';
import { colors, fonts, radius, spacing } from '@/theme';

/**
 * LOCK: docs/mobile/screens/public/auth-callback.md
 * Deep link: yeniform://auth/callback
 */
export default function AuthCallbackScreen() {
  const insets = useSafeAreaInsets();
  const { refreshAuth } = useAuth();
  const params = useLocalSearchParams<{
    verify?: string;
    next?: string;
    code?: string;
    type?: string;
    token_hash?: string;
    access_token?: string;
    refresh_token?: string;
    error?: string;
    error_description?: string;
  }>();
  const [status, setStatus] = useState<'loading' | 'ok' | 'error'>('loading');
  const [message, setMessage] = useState('Oturum doğrulanıyor…');
  const [dest, setDest] = useState<string | null>(null);
  const ran = useRef(false);

  useEffect(() => {
    if (ran.current) return;
    ran.current = true;

    const err = params.error || params.error_description;
    if (err) {
      setStatus('error');
      setMessage(String(params.error_description || params.error || 'Bağlantı geçersiz.'));
      return;
    }


    let cancelled = false;

    (async () => {
      try {
        if (!supabase) {
          throw new Error('Supabase yapılandırması eksik.');
        }
        const url = (await Linking.getInitialURL()) || Linking.createURL('auth/callback');
        const session = await establishAuthSessionFromUrl(requireSupabase(), {
          searchParams: {
            code: typeof params.code === 'string' ? params.code : undefined,
            type: typeof params.type === 'string' ? params.type : undefined,
            token_hash: typeof params.token_hash === 'string' ? params.token_hash : undefined,
            access_token:
              typeof params.access_token === 'string' ? params.access_token : undefined,
            refresh_token:
              typeof params.refresh_token === 'string' ? params.refresh_token : undefined,
            next: typeof params.next === 'string' ? params.next : undefined,
            verify: typeof params.verify === 'string' ? params.verify : undefined,
          },
          url,
          waitMs: 4000,
        });

        if (cancelled) return;

        if (!session?.user) {
          setStatus('error');
          setMessage('Giriş doğrulanamadı. Lütfen bağlantıyı yeniden açın veya tekrar deneyin.');
          return;
        }

        if (isRecoveryCallback(params)) {
          setStatus('ok');
          setMessage('Şifre sıfırlama bağlantısı doğrulandı.');
          setDest('/(auth)/reset-password');
          return;
        }

        const hydrated = await refreshAuth();
        if (cancelled) return;

        setStatus('ok');
        setMessage('Giriş doğrulandı. Devam edebilirsiniz.');
        setDest(hydrated ? routeForHydrated(hydrated) : '/(member)/dashboard');
      } catch {
        if (!cancelled) {
          setStatus('error');
          setMessage('Giriş doğrulanamadı. Lütfen tekrar deneyin.');
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [params, refreshAuth]);

  const goNext = () => {
    if (status === 'ok' && dest) {
      router.replace(dest as Href);
      return;
    }
    if (isRecoveryCallback(params)) {
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
