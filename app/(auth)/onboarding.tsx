import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';

import { AuthScaffold } from '@/components/auth/AuthScaffold';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useApp } from '@/context/AppContext';
import { colors, fonts, spacing } from '@/constants/theme';
import { isPaidMembership } from '@/data/membershipPlans';
import {
  completeMemberProfile,
  savePendingRegistrationMetadata,
} from '@/services/supabaseAuth';
import { displayNameFromAuthUser, hasRegisteredMember } from '@/utils/memberProfile';

/**
 * ProfileCompletionGate hedefi — eksik profil tamamlanır.
 * Ücretli plan query’si varsa üyelik ücretsiz kaydedilir; Stripe register checkout açılır
 * (webhook planı aktive eder — web OnboardingPage parity).
 */
export default function OnboardingScreen() {
  const { plan, oauth } = useLocalSearchParams<{ plan?: string; oauth?: string }>();
  const {
    user,
    authUser,
    member,
    isAuthenticated,
    isAdmin,
    isStaff,
    updateProfile,
    refresh,
    routeForRole,
    startStripeCheckout,
  } = useApp();
  const [name, setName] = useState(
    user?.name || displayNameFromAuthUser(authUser) || '',
  );
  const [phone, setPhone] = useState((member?.phone as string) || '');
  const [loading, setLoading] = useState(false);

  const requestedPlan =
    typeof plan === 'string' && plan.trim() ? plan.trim() : 'free';
  const wantsPaid = isPaidMembership(requestedPlan);

  useEffect(() => {
    if (!isAuthenticated) {
      router.replace('/(auth)/login');
      return;
    }
    if (isAdmin) {
      router.replace(routeForRole('admin'));
      return;
    }
    if (isStaff) {
      router.replace(routeForRole('staff'));
      return;
    }
    if (hasRegisteredMember(member || user) && !wantsPaid) {
      router.replace(routeForRole('member'));
    }
  }, [isAuthenticated, isAdmin, isStaff, member, user, routeForRole, wantsPaid]);

  const onSubmit = async () => {
    const cleanName = name.trim();
    const cleanPhone = phone.trim();
    if (!cleanName) {
      Alert.alert('Eksik bilgi', 'Ad soyad zorunludur.');
      return;
    }
    if (!cleanPhone) {
      Alert.alert('Eksik bilgi', 'Telefon numarası zorunludur.');
      return;
    }

    setLoading(true);
    try {
      // Ücretli planı üye satırına yazma — ödeme öncesi free; webhook yükseltir.
      const membershipToSave = wantsPaid ? 'free' : requestedPlan;

      if (member) {
        const joinedAt =
          (member.joinedAt as string) || new Date().toISOString().split('T')[0];
        const result = await updateProfile({
          name: cleanName,
          phone: cleanPhone,
          joinedAt,
          profileComplete: true,
          membership: membershipToSave,
        });
        if (!result.success) {
          Alert.alert('Kayıt tamamlanamadı', result.error || 'Bir hata oluştu.');
          return;
        }
      } else {
        const result = await completeMemberProfile({
          name: cleanName,
          phone: cleanPhone,
          membership: membershipToSave,
        });
        if (!result.success) {
          Alert.alert('Kayıt tamamlanamadı', result.error || 'Bir hata oluştu.');
          return;
        }
      }

      if (wantsPaid) {
        const pending = await savePendingRegistrationMetadata(
          { name: cleanName, phone: cleanPhone },
          requestedPlan,
          1,
        );
        if (!pending.success) {
          Alert.alert('Kayıt bilgisi', pending.error || 'Plan bilgisi kaydedilemedi.');
          return;
        }
        const checkout = await startStripeCheckout(requestedPlan, 'register', 1);
        if (!checkout.success) {
          Alert.alert(
            'Ödeme başlatılamadı',
            `${checkout.error || 'Bir hata oluştu.'}\nProfiliniz kaydedildi; Üyeliğim ekranından tekrar deneyebilirsiniz.`,
          );
        }
        await refresh();
        router.replace(routeForRole('member'));
        return;
      }

      await refresh();
      router.replace(routeForRole('member'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthScaffold
      subtitle={
        wantsPaid
          ? `${requestedPlan.toUpperCase()} paketi için profilinizi tamamlayın; ardından güvenli ödeme açılır.`
          : 'Devam etmek için profil bilgilerinizi tamamlayın.'
      }
      title="Profilini tamamla">
      <Input
        autoCapitalize="words"
        icon="person-outline"
        label="Ad Soyad"
        onChangeText={setName}
        placeholder="Adınız Soyadınız"
        value={name}
      />
      <View style={styles.gap} />
      <Input
        icon="call-outline"
        keyboardType="phone-pad"
        label="Telefon"
        onChangeText={setPhone}
        placeholder="05xxxxxxxxx"
        value={phone}
      />
      <View style={styles.gap} />
      <Button
        label={wantsPaid ? 'Kaydet ve öde' : 'Devam Et'}
        loading={loading}
        onPress={onSubmit}
        rightIcon="arrow-forward"
      />
      {oauth === '1' ? (
        <Text style={styles.hint}>Sosyal giriş ile devam ediyorsunuz.</Text>
      ) : null}
    </AuthScaffold>
  );
}

const styles = StyleSheet.create({
  gap: { height: spacing.md },
  hint: {
    marginTop: spacing.md,
    textAlign: 'center',
    fontFamily: fonts.regular,
    fontSize: 13,
    color: colors.text.secondary,
  },
});
