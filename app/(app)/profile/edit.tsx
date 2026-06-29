import { StatusBar } from 'expo-status-bar';
import { useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ResponsiveCenter } from '@/components/layout/ResponsiveCenter';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { StackHeader } from '@/components/ui/StackHeader';
import { useApp } from '@/context/AppContext';
import { useResponsive } from '@/hooks/useResponsive';
import { colors, fonts, spacing } from '@/constants/theme';

export default function ProfileEditScreen() {
  const insets = useSafeAreaInsets();
  const { member, user, updateProfile } = useApp();
  const { horizontalPadding } = useResponsive();

  const [name, setName] = useState(member?.name || user.name || '');
  const [phone, setPhone] = useState((member?.phone as string) || '');
  const [city, setCity] = useState((member?.city as string) || '');
  const [age, setAge] = useState(member?.age != null ? String(member.age) : '');
  const [weight, setWeight] = useState(member?.weight != null ? String(member.weight) : '');
  const [height, setHeight] = useState(member?.height != null ? String(member.height) : '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [saved, setSaved] = useState(false);

  const onSave = async () => {
    setSaving(true);
    setError('');
    setSaved(false);
    try {
      const result = await updateProfile({
        name: name.trim(),
        phone: phone.trim(),
        city: city.trim(),
        age: age.trim(),
        weight: weight.trim(),
        height: height.trim(),
      });
      if (!result.success) {
        setError(result.error || 'Kaydedilemedi.');
        return;
      }
      setSaved(true);
    } finally {
      setSaving(false);
    }
  };

  return (
    <View style={styles.root}>
      <StatusBar style="dark" />
      <StackHeader subtitle="Temel bilgilerinizi güncelleyin" title="Profili Düzenle" />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.flex}>
        <ScrollView
          contentContainerStyle={[
            styles.content,
            { paddingBottom: insets.bottom + spacing.xl },
          ]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}>
          <ResponsiveCenter innerStyle={{ paddingHorizontal: horizontalPadding }}>
            <Input label="Ad Soyad" onChangeText={setName} value={name} />
            <Input editable={false} label="E-posta" value={user.email} />
            <Input
              keyboardType="phone-pad"
              label="Telefon"
              onChangeText={setPhone}
              placeholder="05xx xxx xx xx"
              value={phone}
            />
            <Input label="Şehir" onChangeText={setCity} placeholder="İstanbul" value={city} />
            <Input keyboardType="number-pad" label="Yaş" onChangeText={setAge} value={age} />
            <Input keyboardType="decimal-pad" label="Kilo (kg)" onChangeText={setWeight} value={weight} />
            <Input keyboardType="number-pad" label="Boy (cm)" onChangeText={setHeight} value={height} />

            {error ? <Text style={styles.error}>{error}</Text> : null}
            {saved ? <Text style={styles.success}>Profil güncellendi.</Text> : null}

            <Button
              label={saving ? 'Kaydediliyor…' : 'Kaydet'}
              onPress={() => void onSave()}
              size="lg"
              style={styles.save}
            />
            {saving ? <ActivityIndicator color={colors.brand[600]} style={styles.spinner} /> : null}
          </ResponsiveCenter>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.background,
  },
  flex: {
    flex: 1,
  },
  content: {
    paddingTop: spacing.lg,
    gap: spacing.md,
  },
  save: {
    marginTop: spacing.sm,
  },
  spinner: {
    marginTop: spacing.sm,
  },
  error: {
    fontFamily: fonts.medium,
    fontSize: 13,
    color: colors.danger,
  },
  success: {
    fontFamily: fonts.medium,
    fontSize: 13,
    color: colors.teal[600],
  },
});
