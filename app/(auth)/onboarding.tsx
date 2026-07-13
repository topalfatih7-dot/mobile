import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';

import { AuthScaffold } from '@/components/auth/AuthScaffold';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useApp } from '@/context/AppContext';
import { colors, fonts, spacing } from '@/constants/theme';
import { completeMemberProfile } from '@/services/supabaseAuth';
import { displayNameFromAuthUser, hasRegisteredMember } from '@/utils/memberProfile';

/**
 * ProfileCompletionGate hedefi — eksik profil tamamlanır.
 * Tam onboarding sihirbazı 08 dokümanı yazılınca genişletilecek;
 * burada gate'in gerektirdiği alanlar (name + phone + joinedAt) kaydedilir.
 */
export default function OnboardingScreen() {
  const { plan, oauth } = useLocalSearchParams<{ plan?: string; oauth?: string }>();
  const { user, authUser, member, isAuthenticated, isAdmin, isStaff, updateProfile, refresh, routeForRole } =
    useApp();
  const [name, setName] = useState(
    user?.name || displayNameFromAuthUser(authUser) || '',
  );
  const [phone, setPhone] = useState((member?.phone as string) || '');
  const [loading, setLoading] = useState(false);

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
    if (hasRegisteredMember(member || user)) {
      router.replace(routeForRole('member'));
    }
  }, [isAuthenticated, isAdmin, isStaff, member, user, routeForRole]);

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
      if (member) {
        const joinedAt =
          (member.joinedAt as string) || new Date().toISOString().split('T')[0];
        const result = await updateProfile({
          name: cleanName,
          phone: cleanPhone,
          joinedAt,
          profileComplete: true,
          membership: (typeof plan === 'string' && plan) || member.membership || 'free',
        });
        if (!result.success) {
          Alert.alert('Kayıt tamamlanamadı', result.error || 'Bir hata oluştu.');
          return;
        }
      } else {
        const result = await completeMemberProfile({
          name: cleanName,
          phone: cleanPhone,
          membership: (typeof plan === 'string' && plan) || 'free',
        });
        if (!result.success) {
          Alert.alert('Kayıt tamamlanamadı', result.error || 'Bir hata oluştu.');
          return;
        }
      }
      await refresh();
      router.replace(routeForRole('member'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthScaffold
      subtitle="Devam etmek için profil bilgilerinizi tamamlayın."
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
      <Button label="Devam Et" loading={loading} onPress={onSubmit} rightIcon="arrow-forward" />
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
    fontFamily: fonts.medium,
    fontSize: 13,
    color: colors.text.muted,
  },
});
