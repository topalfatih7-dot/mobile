import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';

import { useApp } from '@/context/AppContext';
import { colors, fonts, spacing } from '@/constants/theme';
import {
  confirmEmailVerificationByEvt,
  markEmailVerified,
  markPhoneVerified,
} from '@/services/authVerification';
import {
  establishAuthSessionFromUrl,
  readAuthCallbackParams,
} from '@/services/authSessionFromUrl';
import { hydrateAuthState, routeForRole } from '@/services/supabaseAuth';
import { supabase } from '@/services/supabaseClient';
import { hasRegisteredMember, isSocialAuthUser } from '@/utils/memberProfile';

/**
 * Supabase auth redirect hedefi — web AuthCallbackPage transport eşdeğeri
 * (docs/rn-migration/05, 07). E-posta doğrulama: evt / verify=email / verify=phone.
 */
export default function AuthCallbackScreen() {
  const params = useLocalSearchParams<{
    url?: string;
    next?: string;
    verify?: string;
    evt?: string;
    plan?: string;
    error?: string;
    error_description?: string;
    error_code?: string;
  }>();
  const { refresh } = useApp();
  const [message, setMessage] = useState('Oturum doğrulanıyor…');
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let active = true;

    void (async () => {
      if (params.error || params.error_description || params.error_code === 'otp_expired') {
        if (!active) return;
        setFailed(true);
        setMessage(String(params.error_description || params.error || 'Doğrulama başarısız.'));
        return;
      }

      const sourceUrl =
        typeof params.url === 'string' && params.url
          ? decodeURIComponent(params.url)
          : [
              params.next ? `next=${params.next}` : '',
              params.verify ? `verify=${params.verify}` : '',
              params.evt ? `evt=${params.evt}` : '',
              params.plan ? `plan=${params.plan}` : '',
            ]
              .filter(Boolean)
              .join('&');

      const urlForExchange =
        typeof params.url === 'string' && params.url
          ? decodeURIComponent(params.url)
          : sourceUrl
            ? `yeniform://auth/callback?${sourceUrl}`
            : 'yeniform://auth/callback';

      const callbackParams = readAuthCallbackParams(urlForExchange);
      const evt = callbackParams.evt || (typeof params.evt === 'string' ? params.evt : '');
      const verify =
        callbackParams.verify || (typeof params.verify === 'string' ? params.verify : '');

      if (evt) {
        setMessage('E-posta doğrulanıyor…');
        const evtResult = await confirmEmailVerificationByEvt(evt);
        if (!active) return;
        if (evtResult.success) {
          await refresh();
          setMessage('E-posta doğrulandı.');
          router.replace(routeForRole('member'));
          return;
        }
        setFailed(true);
        setMessage(evtResult.error || 'Doğrulama tamamlanamadı.');
        return;
      }

      const session = await establishAuthSessionFromUrl(supabase, urlForExchange);
      if (!active) return;

      if (!session?.user) {
        setFailed(true);
        setMessage('Oturum kurulamadı. Bağlantı süresi dolmuş olabilir.');
        return;
      }

      if (verify === 'email') {
        setMessage('E-posta doğrulanıyor…');
        await markEmailVerified({ id: session.user.id, email: session.user.email || undefined });
        await refresh();
        if (!active) return;
        router.replace(routeForRole('member'));
        return;
      }

      if (verify === 'phone') {
        setMessage('Telefon doğrulanıyor…');
        const state = await hydrateAuthState();
        const pending = state.member?.pendingPhoneVerify as { phone?: string } | null | undefined;
        await markPhoneVerified(state.member, pending?.phone || (state.member?.phone as string));
        await refresh();
        if (!active) return;
        router.replace(routeForRole('member'));
        return;
      }

      await refresh();
      const state = await hydrateAuthState();
      if (!active) return;

      if (callbackParams.next === 'reset-password' || params.next === 'reset-password') {
        router.replace('/(auth)/reset-password');
        return;
      }

      const role = state.session?.type || 'member';
      if (role === 'admin' || role === 'staff') {
        router.replace(routeForRole(role));
        return;
      }

      if (!hasRegisteredMember(state.member)) {
        const plan = callbackParams.plan || (typeof params.plan === 'string' ? params.plan : 'free');
        const oauth = isSocialAuthUser(state.authUser) ? '1' : '0';
        router.replace(`/(auth)/onboarding?plan=${encodeURIComponent(plan)}&oauth=${oauth}`);
        return;
      }

      router.replace(routeForRole('member'));
    })();

    return () => {
      active = false;
    };
    // Deep-link param'ları mount'ta bir kez işlenir
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <View style={styles.wrap}>
      {!failed ? <ActivityIndicator color={colors.brand[600]} size="large" /> : null}
      <Text style={[styles.text, failed && styles.error]}>{message}</Text>
      {failed ? (
        <Text style={styles.link} onPress={() => router.replace('/(auth)/login')}>
          Giriş sayfasına dön
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background,
    padding: spacing.xl,
    gap: spacing.md,
  },
  text: {
    fontFamily: fonts.medium,
    fontSize: 15,
    color: colors.text.secondary,
    textAlign: 'center',
  },
  error: {
    color: colors.danger,
  },
  link: {
    marginTop: spacing.sm,
    fontFamily: fonts.semibold,
    fontSize: 14,
    color: colors.brand[600],
  },
});
