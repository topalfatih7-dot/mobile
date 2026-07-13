import { router } from 'expo-router';
import { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Linking,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { useApp } from '@/context/AppContext';
import { useToast } from '@/context/ToastContext';
import { colors, fonts, radius, spacing } from '@/constants/theme';
import {
  getOAuthRedirectTo,
  getSupabaseAuthProvidersUrl,
  getSupabaseRedirectUrlsDashboard,
  type SignInWithSocialOpts,
} from '@/services/oauthAuth';

type Props = {
  flow?: 'login' | 'signup';
  plan?: string;
  remember?: boolean;
  position?: 'top' | 'bottom';
};

/**
 * Web `SocialAuthButtons.jsx` — yalnızca Google (docs/rn-migration/07).
 */
export function SocialAuthButtons({
  flow = 'login',
  plan,
  remember = true,
  position = 'bottom',
}: Props) {
  const { toast } = useToast();
  const { loginWithGoogle, routeForRole } = useApp();
  const [loading, setLoading] = useState(false);
  const isBottom = position === 'bottom';

  const onGoogle = async () => {
    if (loading) return;
    setLoading(true);
    const timeout = setTimeout(() => {
      setLoading(false);
      toast('Bağlantı zaman aşımına uğradı. Lütfen tekrar deneyin.', 'error', 5000);
    }, 120_000);

    try {
      const opts: SignInWithSocialOpts = { flow, plan, remember };
      const result = await loginWithGoogle(opts);
      if (!result.success) {
        if (result.cancelled) return;
        const msg = result.error || 'Giriş başlatılamadı';
        toast(msg, 'error', 7000);

        if (result.redirectMisconfigured) {
          const expected = result.expectedRedirect || getOAuthRedirectTo({ flow });
          Alert.alert(
            'Mobil Google yönlendirmesi eksik',
            `${msg}\n\nBu cihazda beklenen URL:\n${expected}`,
            [
              { text: 'Tamam', style: 'cancel' },
              {
                text: 'Redirect URLs aç',
                onPress: () => void Linking.openURL(getSupabaseRedirectUrlsDashboard()),
              },
            ],
          );
          return;
        }

        if (result.providerNotConfigured) {
          Alert.alert('Sosyal giriş henüz kurulmamış', msg, [
            { text: 'Tamam', style: 'cancel' },
            {
              text: 'Supabase Providers',
              onPress: () => void Linking.openURL(getSupabaseAuthProvidersUrl()),
            },
          ]);
        }
        return;
      }

      if (result.redirecting) {
        return;
      }

      if (result.needsOnboarding) {
        const planId = plan || 'free';
        router.replace(`/(auth)/onboarding?plan=${encodeURIComponent(planId)}&oauth=1`);
        return;
      }

      router.replace(routeForRole(result.role));
    } finally {
      clearTimeout(timeout);
      setLoading(false);
    }
  };

  return (
    <View style={styles.wrap}>
      <View style={styles.dividerRow}>
        <View style={styles.line} />
        <Text style={styles.dividerText}>
          {isBottom ? 'veya sosyal hesap ile' : 'veya e-posta ile'}
        </Text>
        <View style={styles.line} />
      </View>

      <Pressable disabled={loading} onPress={onGoogle} style={styles.googleBtn}>
        {loading ? (
          <ActivityIndicator color={colors.brand[700]} />
        ) : (
          <>
            <Ionicons color={colors.brand[600]} name="logo-google" size={22} />
            <Text style={styles.googleLabel}>Google ile devam et</Text>
          </>
        )}
      </Pressable>

      {isBottom ? (
        <Text style={styles.hint}>Google hesabınızla şifresiz devam edin.</Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    marginTop: spacing.md,
    gap: spacing.sm,
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  line: {
    flex: 1,
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.borderStrong,
  },
  dividerText: {
    fontFamily: fonts.medium,
    fontSize: 13,
    color: colors.text.muted,
  },
  googleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    minHeight: 52,
    borderRadius: radius.md,
    borderWidth: 2,
    borderColor: colors.borderStrong,
    backgroundColor: colors.white,
    paddingHorizontal: spacing.md,
  },
  googleLabel: {
    fontFamily: fonts.semibold,
    fontSize: 16,
    color: colors.text.primary,
  },
  hint: {
    textAlign: 'center',
    fontFamily: fonts.regular,
    fontSize: 12,
    color: colors.text.muted,
    marginTop: 4,
  },
});
