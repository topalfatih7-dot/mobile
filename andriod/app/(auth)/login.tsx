import { Link, router, useLocalSearchParams, type Href } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AuthLegalNote } from '@/components/auth/AuthLegalNote';
import { AuthSceneBackground } from '@/components/auth/AuthSceneBackground';
import { BrandLogo } from '@/components/ui/BrandLogo';
import { Button } from '@/components/ui/Button';
import { CheckboxRow } from '@/components/ui/CheckboxRow';
import { FormErrorModal } from '@/components/ui/FormErrorModal';
import { FormKeyboardScroll } from '@/components/ui/FormKeyboardScroll';
import { LoadingScreen } from '@/components/ui/LoadingScreen';
import { TextField } from '@/components/ui/TextField';
import { env } from '@/config/env';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import { getRememberMe } from '@/services/authStorage';
import { validateLoginForm } from '@/services/authLogin';
import { resolvePostAuthHref } from '@/utils/panelRouteRemap';
import { colors, fonts, radius, spacing } from '@/theme';

/**
 * LOCK: docs/mobile/screens/public/login.md
 * Not: Form FadeIn/transform içinde olmamalı — web’de focus kaybı + scroll jump.
 */
export default function LoginScreen() {
  const insets = useSafeAreaInsets();
  const { login, isAuthenticated, role, routeForRole } = useAuth();
  const { toast } = useToast();
  const { from: fromParam } = useLocalSearchParams<{ from?: string | string[] }>();
  const from = Array.isArray(fromParam) ? fromParam[0] : fromParam;

  const passwordRef = useRef<TextInput>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [remember, setRemember] = useState(true);
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});
  const [loading, setLoading] = useState(false);
  const [errorModal, setErrorModal] = useState<string | null>(null);

  useEffect(() => {
    void getRememberMe().then(setRemember);
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      router.replace(
        resolvePostAuthHref(from, role, routeForRole() || '/(member)/dashboard') as Href,
      );
    }
  }, [from, isAuthenticated, role, routeForRole]);

  const onSubmit = async () => {
    const v = validateLoginForm(email, password);
    setErrors(v.fieldErrors);
    if (!v.ok) {
      setErrorModal(v.formError || 'Lütfen formu kontrol edin.');
      return;
    }

    setLoading(true);
    try {
      const result = await login({ email, password, remember });
      if (!result.success) {
        setErrorModal(result.error || 'E-posta veya şifre hatalı.');
        return;
      }
      toast('Hoş geldiniz!', 'success');
      router.replace(
        resolvePostAuthHref(
          from,
          result.role || role,
          result.route || '/(member)/dashboard',
        ) as Href,
      );
    } catch {
      setErrorModal('Oturum açılamadı. Lütfen tekrar deneyin.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.root}>
      <AuthSceneBackground />
      <FormKeyboardScroll
        bottomOffset={72}
        extraKeyboardSpace={48}
        contentContainerStyle={[
          styles.content,
          {
            flexGrow: 1,
            justifyContent: 'center',
            paddingTop: insets.top + spacing.md,
            paddingBottom: insets.bottom + spacing.xxl,
          },
        ]}>
        <View style={styles.logoWrap}>
          <BrandLogo size="lg" variant="logo" />
        </View>
        <View style={styles.sheet}>
          <Text style={styles.title}>Giriş Yap</Text>
          <Text style={styles.sub}>Hesabınla devam et — yolculuğun seni bekliyor.</Text>
          {!env.mobileApiSecret ? (
            <Text style={styles.configHint}>
              Bu kurulumda giriş anahtarı yok. Preview build ortam değişkenlerini kontrol edin.
            </Text>
          ) : null}

          <View style={styles.form}>
            <TextField
              accent="brand"
              autoComplete="email"
              error={errors.email}
              icon="mail-outline"
              keyboardType="email-address"
              label="E-posta"
              onChangeText={setEmail}
              onSubmitEditing={() => passwordRef.current?.focus()}
              placeholder="ornek@yeniform.com"
              returnKeyType="next"
              textContentType="emailAddress"
              value={email}
            />
            <TextField
              accent="sage"
              autoComplete="password"
              error={errors.password}
              icon="lock-closed-outline"
              label="Şifre"
              onChangeText={setPassword}
              onSubmitEditing={() => void onSubmit()}
              placeholder="••••••••"
              ref={passwordRef}
              returnKeyType="go"
              secureTextEntry
              textContentType="password"
              value={password}
            />
            <CheckboxRow checked={remember} label="Beni hatırla" onChange={setRemember} />
            <Button label="Giriş Yap" loading={loading} onPress={onSubmit} />
            <Button
              label="Kayıt ol"
              onPress={() => router.push('/(auth)/onboarding')}
              rightIcon="person-add-outline"
              style={styles.registerBtn}
            />
          </View>

          <View style={styles.links}>
            <Link asChild href="/(auth)/forgot-password">
              <Pressable hitSlop={8}>
                <Text style={styles.link}>Şifremi unuttum</Text>
              </Pressable>
            </Link>
          </View>
          <AuthLegalNote variant="onLight" />
        </View>
      </FormKeyboardScroll>
      {loading ? <LoadingScreen label="Giriş yapılıyor…" overlay /> : null}
      <FormErrorModal
        message={errorModal || ''}
        onClose={() => setErrorModal(null)}
        visible={Boolean(errorModal)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.cream[50] },
  content: {
    paddingHorizontal: spacing.lg,
    alignItems: 'center',
  },
  logoWrap: {
    alignSelf: 'center',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.white,
    borderRadius: radius.xl,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderWidth: 1,
    borderColor: colors.cream[200],
    marginBottom: spacing.xxl + spacing.md,
    boxShadow: '0px 8px 18px rgba(26,69,92,0.10)',
    elevation: 4,
  },
  sheet: {
    backgroundColor: colors.white,
    borderRadius: 28,
    padding: spacing.lg,
    paddingTop: spacing.xl,
    borderWidth: 1,
    borderColor: colors.cream[200],
    boxShadow: '0px 12px 24px rgba(26,69,92,0.12)',
    elevation: 8,
  },
  title: {
    fontFamily: fonts.displayExtra,
    fontSize: 28,
    color: colors.cream[900],
    letterSpacing: -0.4,
    flexShrink: 1,
  },
  sub: {
    fontFamily: fonts.sans,
    fontSize: 14,
    lineHeight: 21,
    color: colors.cream[800],
    marginTop: 6,
    marginBottom: spacing.lg,
    flexShrink: 1,
  },
  configHint: {
    fontFamily: fonts.sans,
    fontSize: 13,
    lineHeight: 20,
    color: colors.danger[700],
    marginTop: -spacing.md,
    marginBottom: spacing.md,
    flexShrink: 1,
  },
  form: { gap: spacing.md },
  registerBtn: {
    marginTop: 2,
  },
  links: {
    marginTop: spacing.lg,
    alignItems: 'center',
  },
  link: {
    fontFamily: fonts.sansSemi,
    fontSize: 14,
    color: colors.brand[600],
    paddingVertical: 8,
  },
});
