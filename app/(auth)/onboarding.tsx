import { router, useLocalSearchParams, type Href } from 'expo-router';
import { useMemo, useState } from 'react';
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AuthSceneBackground } from '@/components/auth/AuthSceneBackground';
import { TurnstileWidget } from '@/components/security/TurnstileWidget';
import { Button } from '@/components/ui/Button';
import { CheckboxRow } from '@/components/ui/CheckboxRow';
import { GenderSelect } from '@/components/ui/GenderSelect';
import { PasswordRules } from '@/components/ui/PasswordRules';
import { Stepper } from '@/components/ui/Stepper';
import { TextField } from '@/components/ui/TextField';
import { isTurnstileEnabled } from '@/config/turnstile';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import {
  ALL_PLANS,
  DURATION_OPTIONS,
  formatTry,
  getTierPrice,
  isOneTimeBillingPlan,
  isPaidMembership,
  RECOMMENDED_PLAN,
  resolvePlanFromQuery,
  sortPlansForDisplay,
} from '@/data/membershipPlans';
import { registerFreeMember, savePendingRegistrationMetadata } from '@/services/authRegister';
import { isValidEmailAddress, sanitizeEmailInput } from '@/utils/email';
import { isPasswordValid } from '@/utils/password';
import { colors, fonts, radius, spacing } from '@/theme';

const STEPS = ['Hesap', 'Üyelik'] as const;

/**
 * LOCK: docs/mobile/screens/public/onboarding.md
 * STEPS yalnızca Hesap → Üyelik. Paid = IAP yolu (SDK sonraki dilim — toast).
 */
export default function OnboardingScreen() {
  const insets = useSafeAreaInsets();
  const { toast } = useToast();
  const { refreshAuth, registeredMember } = useAuth();
  const params = useLocalSearchParams<{ plan?: string; months?: string; oauth?: string }>();
  const oauth = params.oauth === '1';

  const initialPlan = resolvePlanFromQuery(typeof params.plan === 'string' ? params.plan : 'free');
  const initialMonths = [1, 3, 6].includes(Number(params.months))
    ? Number(params.months)
    : initialPlan === RECOMMENDED_PLAN
      ? 6
      : 1;

  const [step, setStep] = useState(0);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [gender, setGender] = useState<'' | 'female' | 'male'>('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [membership, setMembership] = useState(initialPlan);
  const [durationMonths, setDurationMonths] = useState(initialMonths);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [turnstileToken, setTurnstileToken] = useState('');
  const [turnstileKey, setTurnstileKey] = useState(0);

  const plans = useMemo(() => sortPlansForDisplay(ALL_PLANS), []);

  if (registeredMember && !oauth) {
    return (
      <View style={[styles.root, { paddingTop: insets.top + spacing.xl }]}>
        <AuthSceneBackground />
        <View style={styles.planChangeCard}>
          <Text style={styles.planChangeTitle}>Üyelik Planını Değiştir</Text>
          <Text style={styles.planChangeSub}>
            Mevcut hesabınızın planını güncelleyin — yeni hesap oluşturulmaz.
          </Text>
          <Button label="Planları gör" onPress={() => router.push('/(public)/membership')} />
          <Button
            label="Vazgeç"
            onPress={() => router.replace('/(member)/profile')}
            style={{ marginTop: spacing.sm }}
            variant="secondary"
          />
        </View>
      </View>
    );
  }

  const goMembership = () => {
    const errors: Record<string, string> = {};
    if (!name.trim()) errors.name = 'Ad soyad alanını doldurun.';
    if (!oauth) {
      const clean = sanitizeEmailInput(email);
      if (!isValidEmailAddress(clean)) {
        errors.email = 'Geçerli bir e-posta adresi girin (ör. ad@site.com).';
      }
    }
    const digits = phone.replace(/\D/g, '');
    if (digits.length < 10) errors.phone = 'Geçerli bir cep telefonu numarası girin.';
    if (gender !== 'female' && gender !== 'male') {
      errors.gender = 'Cinsiyet seçimi zorunludur — Kadın veya Erkek seçin.';
    }
    if (!oauth) {
      if (!isPasswordValid(password)) {
        errors.password =
          'Şifre en az 8 karakter olmalı; büyük harf, küçük harf, rakam ve özel karakter içermelidir.';
      } else if (password !== confirmPassword) {
        errors.confirm = 'Şifreler eşleşmiyor — iki alanı da aynı yazın.';
      }
    }
    if (!termsAccepted) {
      errors.terms =
        'Devam etmek için kullanım koşullarını ve gizlilik politikasını kabul etmelisiniz.';
    }
    setFieldErrors(errors);
    if (Object.keys(errors).length) {
      Alert.alert(
        'Kayıt',
        oauth
          ? 'Lütfen ad soyad ve telefon numaranızı kontrol edin; koşulları kabul ettiğinizden emin olun.'
          : Object.values(errors)[0],
      );
      return;
    }
    setStep(1);
  };

  const resetTurnstile = () => {
    setTurnstileToken('');
    setTurnstileKey((k) => k + 1);
  };

  const onFinish = async () => {
    if (!membership) {
      Alert.alert('Kayıt', 'Kayıt için bir üyelik planı seçin.');
      return;
    }
    if (!oauth && isTurnstileEnabled() && !turnstileToken) {
      Alert.alert('Kayıt', 'Bot doğrulamasını tamamlayın.');
      return;
    }

    const profile = {
      name: name.trim(),
      email: sanitizeEmailInput(email),
      phone: phone.replace(/\D/g, ''),
      phoneCountry: 'TR',
      gender: gender as 'female' | 'male',
      password,
      membership,
      durationMonths: isOneTimeBillingPlan(membership) ? 1 : durationMonths,
    };

    setLoading(true);
    try {
      if (!isPaidMembership(membership)) {
        const r = await registerFreeMember(profile, turnstileToken);
        if (!r.success) {
          resetTurnstile();
          Alert.alert('Kayıt', r.error || 'Kayıt tamamlanamadı.');
          return;
        }
        await refreshAuth();
        toast('Hoş geldiniz! Kaydın tamamlandı.', 'success');
        router.replace('/(member)/dashboard' as Href);
        return;
      }

      // MOBILE DIFF: IAP — SDK bağlanana kadar pending + bilgilendirme
      const pending = await savePendingRegistrationMetadata(
        profile,
        membership,
        profile.durationMonths,
      );
      if (!pending.success) {
        // Oturum yoksa önce free auth gerekir — bilgilendir
        Alert.alert(
          'Ödeme',
          pending.error ||
            'Ücretli paket için önce hesabını oluşturup giriş yapman gerekir. Ücretsiz planla devam edebilirsin.',
        );
        return;
      }
      toast(
        'Ödeme (IAP) yakında bağlanacak. Ücretsiz üye olarak devam edebilir veya tekrar deneyebilirsiniz.',
        'info',
        5000,
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.root}>
      <AuthSceneBackground />
      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingTop: insets.top + spacing.md, paddingBottom: insets.bottom + spacing.xxl },
        ]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}>
        <View>
          <Text style={styles.heroBrand}>Yeni Form</Text>
          <Text style={styles.heroTitle}>Kayıt ol</Text>
          <Stepper activeIndex={step} steps={[...STEPS]} />
        </View>

        <View style={styles.sheet}>
          {step === 0 ? (
            <View style={styles.form}>
              <TextField
                accent="brand"
                icon="person-outline"
                label="Ad Soyad"
                onChangeText={setName}
                placeholder="Adınız Soyadınız"
                value={name}
                error={fieldErrors.name}
              />
              {!oauth ? (
                <TextField
                  accent="brand"
                  autoComplete="email"
                  error={fieldErrors.email}
                  icon="mail-outline"
                  keyboardType="email-address"
                  label="E-posta"
                  onChangeText={setEmail}
                  placeholder="ornek@yeniform.com"
                  value={email}
                />
              ) : null}
              <TextField
                accent="sage"
                error={fieldErrors.phone}
                icon="call-outline"
                keyboardType="phone-pad"
                label="Telefon"
                onChangeText={setPhone}
                placeholder="05xxxxxxxxx"
                value={phone}
              />
              <GenderSelect
                error={fieldErrors.gender}
                onChange={setGender}
                value={gender}
              />
              {!oauth ? (
                <>
                  <TextField
                    accent="warm"
                    error={fieldErrors.password}
                    icon="lock-closed-outline"
                    label="Şifre"
                    onChangeText={setPassword}
                    secureTextEntry
                    value={password}
                  />
                  <PasswordRules password={password} />
                  <TextField
                    accent="warm"
                    error={fieldErrors.confirm}
                    icon="shield-checkmark-outline"
                    label="Şifre tekrar"
                    onChangeText={setConfirmPassword}
                    secureTextEntry
                    value={confirmPassword}
                  />
                </>
              ) : null}
              <CheckboxRow
                checked={termsAccepted}
                label="Kullanım koşulları ve gizlilik politikasını kabul ediyorum"
                onChange={setTermsAccepted}
              />
              <View style={styles.legalLinks}>
                <Pressable
                  onPress={() =>
                    router.push('/(public)/legal/uyelik-ve-abonelik-sozlesmesi' as `/`)
                  }>
                  <Text style={styles.legalLink}>Üyelik sözleşmesi</Text>
                </Pressable>
                <Text style={styles.legalDot}>·</Text>
                <Pressable
                  onPress={() => router.push('/(public)/legal/gizlilik-politikasi' as `/`)}>
                  <Text style={styles.legalLink}>Gizlilik</Text>
                </Pressable>
                <Text style={styles.legalDot}>·</Text>
                <Pressable onPress={() => router.push('/(public)/legal/kvkk' as `/`)}>
                  <Text style={styles.legalLink}>KVKK</Text>
                </Pressable>
              </View>
              {fieldErrors.terms ? <Text style={styles.err}>{fieldErrors.terms}</Text> : null}
              <Button label="Devam — Üyelik" onPress={goMembership} rightIcon="arrow-forward" />
              <Pressable onPress={() => router.push('/(auth)/login')} style={styles.linkBtn}>
                <Text style={styles.link}>Zaten hesabım var</Text>
              </Pressable>
            </View>
          ) : (
            <View style={styles.form}>
              <Text style={styles.sectionTitle}>Planını seç</Text>
              {plans.map((plan) => {
                const selected = membership === plan.id;
                const price = getTierPrice(
                  plan.id,
                  isOneTimeBillingPlan(plan.id) ? 1 : durationMonths,
                );
                const recommended = plan.id === RECOMMENDED_PLAN;
                return (
                  <Pressable
                    key={plan.id}
                    onPress={() => {
                      setMembership(plan.id);
                      if (isOneTimeBillingPlan(plan.id)) setDurationMonths(1);
                    }}
                    style={[styles.planCard, selected && styles.planCardOn]}>
                    <View style={styles.planTop}>
                      <Text style={styles.planName}>{plan.name}</Text>
                      {recommended ? (
                        <View style={styles.rec}>
                          <Text style={styles.recText}>Önerilen</Text>
                        </View>
                      ) : null}
                    </View>
                    <Text style={styles.planPrice}>
                      {plan.id === 'free' ? 'Ücretsiz' : formatTry(price || plan.price)}
                      {isOneTimeBillingPlan(plan.id) ? ' · tek seferlik' : ''}
                    </Text>
                    <Text style={styles.planBlurb}>{plan.blurb}</Text>
                  </Pressable>
                );
              })}

              {membership && !isOneTimeBillingPlan(membership) && isPaidMembership(membership) ? (
                <View style={styles.durationRow}>
                  {DURATION_OPTIONS.map((opt) => (
                    <Pressable
                      key={opt.months}
                      onPress={() => setDurationMonths(opt.months)}
                      style={[
                        styles.durationChip,
                        durationMonths === opt.months && styles.durationOn,
                      ]}>
                      <Text
                        style={[
                          styles.durationText,
                          durationMonths === opt.months && styles.durationTextOn,
                        ]}>
                        {opt.label}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              ) : null}

              {!oauth ? (
                <TurnstileWidget onToken={setTurnstileToken} remountKey={turnstileKey} />
              ) : null}

              <Button
                label={
                  isPaidMembership(membership)
                    ? 'Güvenli öde (IAP)'
                    : 'Ücretsiz kayıt ol'
                }
                loading={loading}
                onPress={onFinish}
              />
              <Button label="Geri" onPress={() => setStep(0)} variant="ghost" />
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.cream[50] },
  content: { paddingHorizontal: spacing.lg },
  heroBrand: {
    fontFamily: fonts.displayBold,
    fontSize: 15,
    color: 'rgba(255,255,255,0.9)',
  },
  heroTitle: {
    fontFamily: fonts.displayExtra,
    fontSize: 30,
    color: colors.white,
    marginBottom: spacing.md,
    marginTop: 4,
  },
  sheet: {
    backgroundColor: colors.white,
    borderRadius: 28,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.cream[200],
    shadowColor: colors.brand[900],
    shadowOpacity: 0.1,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 10 },
    elevation: 6,
  },
  form: { gap: spacing.md },
  err: { fontFamily: fonts.sans, fontSize: 12, color: '#c2410c' },
  legalLinks: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 6,
    marginTop: -4,
  },
  legalLink: { fontFamily: fonts.sansSemi, fontSize: 12, color: colors.brand[600] },
  legalDot: { fontFamily: fonts.sans, fontSize: 12, color: colors.cream[300] },
  linkBtn: { alignItems: 'center', paddingVertical: 8 },
  link: { fontFamily: fonts.sansSemi, fontSize: 14, color: colors.brand[600] },
  sectionTitle: {
    fontFamily: fonts.displayBold,
    fontSize: 18,
    color: colors.cream[900],
  },
  planCard: {
    borderRadius: radius.xl,
    borderWidth: 1.5,
    borderColor: colors.cream[200],
    padding: spacing.md,
    backgroundColor: colors.cream[50],
  },
  planCardOn: {
    borderColor: colors.brand[500],
    backgroundColor: colors.brand[50],
  },
  planTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  planName: { fontFamily: fonts.sansSemi, fontSize: 16, color: colors.cream[900] },
  planPrice: {
    marginTop: 4,
    fontFamily: fonts.displayBold,
    fontSize: 18,
    color: colors.brand[700],
  },
  planBlurb: {
    marginTop: 4,
    fontFamily: fonts.sans,
    fontSize: 13,
    color: colors.cream[800],
  },
  rec: {
    backgroundColor: colors.warm[100],
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radius.full,
  },
  recText: { fontFamily: fonts.sansSemi, fontSize: 11, color: colors.warm[500] },
  durationRow: { flexDirection: 'row', gap: spacing.sm },
  durationChip: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 10,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.cream[200],
    backgroundColor: colors.white,
  },
  durationOn: { borderColor: colors.sage[500], backgroundColor: colors.sage[50] },
  durationText: { fontFamily: fonts.sansMedium, fontSize: 13, color: colors.cream[800] },
  durationTextOn: { fontFamily: fonts.sansSemi, color: colors.sage[700] },
  planChangeCard: {
    margin: spacing.lg,
    padding: spacing.lg,
    borderRadius: 28,
    backgroundColor: colors.white,
    gap: spacing.md,
  },
  planChangeTitle: {
    fontFamily: fonts.displayExtra,
    fontSize: 24,
    color: colors.cream[900],
  },
  planChangeSub: {
    fontFamily: fonts.sans,
    fontSize: 14,
    color: colors.cream[800],
    lineHeight: 21,
  },
});
