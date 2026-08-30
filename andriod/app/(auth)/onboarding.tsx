import { Link, router, type Href } from 'expo-router';
import { useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AuthBackButton } from '@/components/auth/AuthBackButton';
import { AuthSceneBackground } from '@/components/auth/AuthSceneBackground';
import { LegalConsentCheckbox } from '@/components/auth/LegalConsentCheckbox';
import { Button } from '@/components/ui/Button';
import { FormErrorModal } from '@/components/ui/FormErrorModal';
import { FormKeyboardScroll } from '@/components/ui/FormKeyboardScroll';
import { GenderSelect } from '@/components/ui/GenderSelect';
import { LoadingScreen } from '@/components/ui/LoadingScreen';
import { PasswordRules } from '@/components/ui/PasswordRules';
import { PhoneField } from '@/components/ui/PhoneField';
import { TextField } from '@/components/ui/TextField';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import {
  DEFAULT_COUNTRY_ISO,
  isValidNationalNumber,
  toE164,
} from '@/data/countryCodes';
import { MEMBERSHIP_CANCEL_COPY } from '@/data/membershipCancelCopy';
import { registerFreeMember } from '@/services/authRegister';
import { canOfferWebPurchase } from '@/services/webCheckoutHandoff';
import { isValidEmailAddress, sanitizeEmailInput } from '@/utils/email';
import { isPasswordValid } from '@/utils/password';
import { colors, fonts, radius, spacing } from '@/theme';

/**
 * MOBILE DIFF: kayıt yalnızca ücretsiz üyelik (tek adım).
 * Ücretli paketler Android’de panel içinden web Stripe `/plans`. iOS’ta satın alma CTA yok.
 */
export default function OnboardingScreen() {
  const insets = useSafeAreaInsets();
  const { toast } = useToast();
  const { refreshAuth, registeredMember } = useAuth();
  const offerWebPurchase = canOfferWebPurchase();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [phoneCountry, setPhoneCountry] = useState(DEFAULT_COUNTRY_ISO);
  const [gender, setGender] = useState<'' | 'female' | 'male'>('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [errorModal, setErrorModal] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const emailRef = useRef<TextInput>(null);
  const passwordRef = useRef<TextInput>(null);
  const confirmRef = useRef<TextInput>(null);

  if (registeredMember) {
    return (
      <View style={[styles.root, { paddingTop: insets.top + spacing.xl }]}>
        <AuthSceneBackground />
        <View style={styles.planChangeCard}>
          <Text style={styles.planChangeTitle}>Zaten üyesin</Text>
          <Text style={styles.planChangeSub}>
            Hesabın hazır. Panele dönerek devam edebilirsin.
          </Text>
          <Button label="Panele git" onPress={() => router.replace('/(member)/dashboard' as Href)} />
          <Button
            label="Vazgeç"
            onPress={() => router.replace('/(member)/profile' as Href)}
            style={{ marginTop: spacing.sm }}
            variant="secondary"
          />
        </View>
      </View>
    );
  }

  const onSubmit = async () => {
    const errors: Record<string, string> = {};
    if (!name.trim()) errors.name = 'Ad soyad alanını doldurun.';
    const clean = sanitizeEmailInput(email);
    if (!isValidEmailAddress(clean)) {
      errors.email = 'Geçerli bir e-posta adresi girin (ör. ad@site.com).';
    }
    if (!phone.trim() || !isValidNationalNumber(phoneCountry, phone)) {
      errors.phone = 'Geçerli bir cep telefonu numarası girin.';
    }
    if (gender !== 'female' && gender !== 'male') {
      errors.gender = 'Cinsiyet seçimi zorunludur — Kadın veya Erkek seçin.';
    }
    if (!isPasswordValid(password)) {
      errors.password =
        'Şifre en az 8 karakter olmalı; büyük harf, küçük harf, rakam ve özel karakter içermelidir.';
    } else if (password !== confirmPassword) {
      errors.confirm = 'Şifreler eşleşmiyor — iki alanı da aynı yazın.';
    }
    if (!termsAccepted) {
      errors.terms =
        'Devam etmek için kullanım koşullarını ve gizlilik politikasını kabul etmelisiniz.';
    }
    setFieldErrors(errors);
    if (Object.keys(errors).length) {
      setErrorModal(Object.values(errors)[0]);
      return;
    }

    const profile = {
      name: name.trim(),
      email: clean,
      phone: toE164(phoneCountry, phone),
      phoneCountry,
      gender: gender as 'female' | 'male',
      password,
      membership: 'free',
      durationMonths: 1,
    };

    setLoading(true);
    try {
      const r = await registerFreeMember(profile);
      if (!r.success) {
        setErrorModal(r.error || 'Kayıt tamamlanamadı.');
        return;
      }
      await refreshAuth();
      toast('Hoş geldiniz! Kaydın tamamlandı.', 'success');
      router.replace('/(member)/dashboard' as Href);
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
          { paddingTop: insets.top + spacing.md, paddingBottom: insets.bottom + spacing.xxl },
        ]}>
        <View style={styles.sheet}>
          <Text style={styles.sheetTitle}>Ücretsiz kayıt ol</Text>
          <Text style={styles.sheetSub}>
            {offerWebPurchase
              ? 'Hesabını oluştur; ücretli paketleri panelden istediğin zaman yükseltebilirsin.'
              : MEMBERSHIP_CANCEL_COPY.iosOnboardingSub}
          </Text>
          <View style={styles.form}>
            <TextField
              accent="brand"
              autoCapitalize="words"
              autoComplete="name"
              error={fieldErrors.name}
              icon="person-outline"
              label="Ad Soyad"
              onChangeText={setName}
              onSubmitEditing={() => emailRef.current?.focus()}
              placeholder="Adınız Soyadınız"
              returnKeyType="next"
              submitBehavior="submit"
              textContentType="name"
              value={name}
            />
            <TextField
              ref={emailRef}
              accent="brand"
              autoComplete="email"
              error={fieldErrors.email}
              icon="mail-outline"
              keyboardType="email-address"
              label="E-posta"
              onChangeText={setEmail}
              placeholder="ornek@yeniform.com"
              returnKeyType="next"
              textContentType="emailAddress"
              value={email}
            />
            <PhoneField
              country={phoneCountry}
              error={fieldErrors.phone}
              label="Telefon"
              onCountryChange={(iso) => {
                setPhoneCountry(iso);
                setPhone('');
                if (fieldErrors.phone) {
                  setFieldErrors((prev) => {
                    const next = { ...prev };
                    delete next.phone;
                    return next;
                  });
                }
              }}
              onValueChange={(t) => {
                setPhone(t);
                if (fieldErrors.phone) {
                  setFieldErrors((prev) => {
                    const next = { ...prev };
                    if (!t.trim() || !isValidNationalNumber(phoneCountry, t)) {
                      next.phone = 'Geçerli bir cep telefonu numarası girin.';
                    } else {
                      delete next.phone;
                    }
                    return next;
                  });
                }
              }}
              value={phone}
            />
            <GenderSelect error={fieldErrors.gender} onChange={setGender} value={gender} />
            <TextField
              ref={passwordRef}
              accent="warm"
              autoComplete="new-password"
              error={fieldErrors.password}
              icon="lock-closed-outline"
              label="Şifre"
              onChangeText={setPassword}
              onSubmitEditing={() => confirmRef.current?.focus()}
              returnKeyType="next"
              secureTextEntry
              submitBehavior="submit"
              textContentType="newPassword"
              value={password}
            />
            <PasswordRules password={password} />
            <TextField
              ref={confirmRef}
              accent="warm"
              autoComplete="new-password"
              error={fieldErrors.confirm}
              icon="shield-checkmark-outline"
              label="Şifre tekrar"
              onChangeText={setConfirmPassword}
              onSubmitEditing={() => void onSubmit()}
              returnKeyType="go"
              secureTextEntry
              textContentType="newPassword"
              value={confirmPassword}
            />
            <LegalConsentCheckbox
              accepted={termsAccepted}
              error={fieldErrors.terms}
              onChange={setTermsAccepted}
            />
            <Button
              label="Ücretsiz kayıt ol"
              loading={loading}
              onPress={onSubmit}
              rightIcon="arrow-forward"
            />
            <Link asChild href="/(auth)/login">
              <Pressable style={styles.linkBtn}>
                <Text style={styles.link}>Zaten hesabım var</Text>
              </Pressable>
            </Link>
          </View>
        </View>
        <AuthBackButton label="Ana ekran" placement="end" />
      </FormKeyboardScroll>
      {loading ? <LoadingScreen label="Kayıt tamamlanıyor…" overlay /> : null}
      <FormErrorModal
        message={errorModal || ''}
        onClose={() => setErrorModal(null)}
        title="Kayıt"
        visible={Boolean(errorModal)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.cream[50] },
  content: { paddingHorizontal: spacing.lg },
  sheetTitle: {
    fontFamily: fonts.displayExtra,
    fontSize: 28,
    color: colors.cream[900],
    letterSpacing: -0.4,
  },
  sheetSub: {
    marginTop: 8,
    marginBottom: spacing.lg,
    fontFamily: fonts.sans,
    fontSize: 14,
    lineHeight: 21,
    color: colors.cream[800],
  },
  sheet: {
    backgroundColor: colors.white,
    borderRadius: 28,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.cream[200],
    boxShadow: '0px 10px 20px rgba(26,69,92,0.1)',
    elevation: 6,
  },
  form: { gap: spacing.md },
  linkBtn: { alignItems: 'center', paddingVertical: 8 },
  link: { fontFamily: fonts.sansSemi, fontSize: 14, color: colors.brand[600] },
  planChangeCard: {
    marginHorizontal: spacing.lg,
    backgroundColor: colors.white,
    borderRadius: radius.xl,
    padding: spacing.xl,
    borderWidth: 1,
    borderColor: colors.cream[200],
  },
  planChangeTitle: {
    fontFamily: fonts.displayBold,
    fontSize: 22,
    color: colors.cream[900],
    marginBottom: spacing.sm,
  },
  planChangeSub: {
    fontFamily: fonts.sans,
    fontSize: 14,
    color: colors.cream[800],
    marginBottom: spacing.lg,
    lineHeight: 21,
  },
});
