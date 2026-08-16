import { Link, router, type Href } from 'expo-router';
import { useState } from 'react';
import {
  Alert,
  Linking,
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
import { GenderSelect } from '@/components/ui/GenderSelect';
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
import { legalUrl } from '@/data/legalSlugs';
import { registerFreeMember } from '@/services/authRegister';
import { isValidEmailAddress, sanitizeEmailInput } from '@/utils/email';
import { isPasswordValid } from '@/utils/password';
import { colors, fonts, radius, spacing } from '@/theme';

/**
 * MOBILE DIFF: kayıt yalnızca ücretsiz üyelik (tek adım).
 * Ücretli paketler panel içinden web Stripe `/plans` CTA.
 */
export default function OnboardingScreen() {
  const insets = useSafeAreaInsets();
  const { toast } = useToast();
  const { refreshAuth, registeredMember } = useAuth();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [phoneCountry, setPhoneCountry] = useState(DEFAULT_COUNTRY_ISO);
  const [gender, setGender] = useState<'' | 'female' | 'male'>('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  const openLegal = (slug: string) => {
    void Linking.openURL(legalUrl(slug));
  };

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
      Alert.alert('Kayıt', Object.values(errors)[0]);
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
        Alert.alert('Kayıt', r.error || 'Kayıt tamamlanamadı.');
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
      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingTop: insets.top + spacing.md, paddingBottom: insets.bottom + spacing.xxl },
        ]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}>
        <AuthBackButton label="Ana ekran" />
        <View>
          <Text style={styles.heroBrand}>Yeni Form</Text>
          <Text style={styles.heroTitle}>Ücretsiz kayıt ol</Text>
          <Text style={styles.heroSub}>
            Hesabını oluştur; ücretli paketleri panelden istediğin zaman yükseltebilirsin.
          </Text>
        </View>

        <View style={styles.sheet}>
          <View style={styles.form}>
            <TextField
              accent="brand"
              error={fieldErrors.name}
              icon="person-outline"
              label="Ad Soyad"
              onChangeText={setName}
              placeholder="Adınız Soyadınız"
              value={name}
            />
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
            <CheckboxRow
              checked={termsAccepted}
              label="Kullanım koşulları ve gizlilik politikasını kabul ediyorum"
              onChange={setTermsAccepted}
            />
            <View style={styles.legalLinks}>
              <Pressable onPress={() => openLegal('uyelik-ve-abonelik-sozlesmesi')}>
                <Text style={styles.legalLink}>Üyelik sözleşmesi</Text>
              </Pressable>
              <Text style={styles.legalDot}>·</Text>
              <Pressable onPress={() => openLegal('gizlilik-politikasi')}>
                <Text style={styles.legalLink}>Gizlilik</Text>
              </Pressable>
              <Text style={styles.legalDot}>·</Text>
              <Pressable onPress={() => openLegal('kvkk')}>
                <Text style={styles.legalLink}>KVKK</Text>
              </Pressable>
            </View>
            {fieldErrors.terms ? <Text style={styles.err}>{fieldErrors.terms}</Text> : null}
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
    marginTop: 4,
  },
  heroSub: {
    marginTop: 8,
    fontFamily: fonts.sans,
    fontSize: 14,
    lineHeight: 21,
    color: 'rgba(255,255,255,0.9)',
    marginBottom: spacing.md,
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
