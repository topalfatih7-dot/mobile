import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { Link, router, type Href } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AuthBackButton } from '@/components/auth/AuthBackButton';
import { AuthSceneBackground } from '@/components/auth/AuthSceneBackground';
import { Button } from '@/components/ui/Button';
import { CheckboxRow } from '@/components/ui/CheckboxRow';
import { TextField } from '@/components/ui/TextField';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import { getRememberMe } from '@/services/authStorage';
import { validateLoginForm } from '@/services/authLogin';
import { colors, fonts, spacing } from '@/theme';

/**
 * LOCK: docs/mobile/screens/public/login.md
 * Not: Form FadeIn/transform içinde olmamalı — web’de focus kaybı + scroll jump.
 */
export default function LoginScreen() {
  const insets = useSafeAreaInsets();
  const { login, isAuthenticated, routeForRole } = useAuth();
  const { toast } = useToast();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [remember, setRemember] = useState(true);
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    void getRememberMe().then(setRemember);
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      router.replace((routeForRole() || '/(member)/profile') as Href);
    }
  }, [isAuthenticated, routeForRole]);

  const onSubmit = async () => {
    const v = validateLoginForm(email, password);
    setErrors(v.fieldErrors);
    if (!v.ok) {
      Alert.alert('Giriş', v.formError || 'Lütfen formu kontrol edin.');
      return;
    }

    setLoading(true);
    try {
      const result = await login({ email, password, remember });
      if (!result.success) {
        Alert.alert('Giriş', result.error || 'E-posta veya şifre hatalı.');
        return;
      }
      toast('Hoş geldiniz!', 'success');
      router.replace((result.route || '/(member)/profile') as Href);
    } finally {
      setLoading(false);
    }
  };

  const body = (
    <ScrollView
      contentContainerStyle={[
        styles.content,
        {
          paddingTop: insets.top + spacing.md,
          paddingBottom: insets.bottom + spacing.xxl,
        },
      ]}
      keyboardDismissMode="on-drag"
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}>
      <AuthBackButton label="Ana ekran" />
      <View style={styles.hero}>
        <LinearGradient
          colors={[colors.white, colors.brand[50], colors.sage[50]]}
          end={{ x: 1, y: 1 }}
          start={{ x: 0, y: 0 }}
          style={styles.logoRing}>
          <View style={styles.logoPlate}>
            <Image
              contentFit="contain"
              source={require('../../assets/brand/brand-mark.png')}
              style={styles.mark}
            />
          </View>
        </LinearGradient>
        <Text style={styles.wordmark}>Yeni Form</Text>
        <Text style={styles.heroTag}>Koçluk · Diyet · Sağlık</Text>
      </View>

      <View style={styles.sheet}>
        <Text style={styles.title}>Giriş Yap</Text>
        <Text style={styles.sub}>Hesabınla devam et — yolculuğun seni bekliyor.</Text>

        <View style={styles.form}>
          <TextField
            accent="brand"
            autoComplete="email"
            error={errors.email}
            icon="mail-outline"
            keyboardType="email-address"
            label="E-posta"
            onChangeText={setEmail}
            placeholder="ornek@yeniform.com"
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
            placeholder="••••••••"
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
      </View>
    </ScrollView>
  );

  return (
    <View style={styles.root}>
      <AuthSceneBackground />
      {Platform.OS === 'ios' ? (
        <KeyboardAvoidingView behavior="padding" style={styles.flex}>
          {body}
        </KeyboardAvoidingView>
      ) : (
        <View style={styles.flex}>{body}</View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.cream[50] },
  flex: { flex: 1 },
  content: {
    paddingHorizontal: spacing.lg,
  },
  hero: {
    alignItems: 'center',
    paddingVertical: spacing.xl,
    marginBottom: spacing.sm,
  },
  logoRing: {
    width: 96,
    height: 96,
    borderRadius: 30,
    padding: 3,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#06202e',
    shadowOpacity: 0.22,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 8 },
    elevation: 10,
  },
  logoPlate: {
    width: '100%',
    height: '100%',
    borderRadius: 27,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  mark: { width: 64, height: 64 },
  wordmark: {
    marginTop: spacing.md,
    fontFamily: fonts.displayExtra,
    fontSize: 32,
    color: colors.white,
    letterSpacing: -0.5,
    textShadowColor: 'rgba(0,0,0,0.25)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 8,
  },
  heroTag: {
    marginTop: 6,
    fontFamily: fonts.sansMedium,
    fontSize: 13,
    color: 'rgba(255,255,255,0.95)',
    letterSpacing: 0.4,
  },
  sheet: {
    backgroundColor: colors.white,
    borderRadius: 28,
    padding: spacing.lg,
    paddingTop: spacing.xl,
    borderWidth: 1,
    borderColor: colors.cream[200],
    shadowColor: colors.brand[900],
    shadowOpacity: 0.12,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 12 },
    elevation: 8,
  },
  title: {
    fontFamily: fonts.displayExtra,
    fontSize: 28,
    color: colors.cream[900],
    letterSpacing: -0.4,
  },
  sub: {
    fontFamily: fonts.sans,
    fontSize: 14,
    lineHeight: 21,
    color: colors.cream[800],
    marginTop: 6,
    marginBottom: spacing.lg,
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
