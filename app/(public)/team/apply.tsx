import { useState } from 'react';
import { Alert, StyleSheet, View } from 'react-native';

import { AppHeader } from '@/components/ui/AppHeader';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Screen } from '@/components/ui/Screen';
import { submitStaffApplication } from '@/services/db/applications';
import { spacing } from '@/constants/theme';

export default function PublicTeamApplyScreen() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [role, setRole] = useState('coach');
  const [note, setNote] = useState('');
  const [loading, setLoading] = useState(false);

  const onSubmit = async () => {
    if (!name.trim() || !email.trim()) {
      Alert.alert('Eksik bilgi', 'Ad ve e-posta zorunludur.');
      return;
    }
    setLoading(true);
    try {
      const result = await submitStaffApplication({
        name: name.trim(),
        email: email.trim(),
        phone: phone.trim(),
        role: role.trim() || 'coach',
        note: note.trim(),
      });
      if (!result.success) {
        Alert.alert('Başvuru gönderilemedi', result.error);
        return;
      }
      Alert.alert(
        'Başvuru alındı',
        'Başvurunuz kaydedildi. Ekibimiz en kısa sürede sizinle iletişime geçecek.',
      );
      setName('');
      setEmail('');
      setPhone('');
      setRole('coach');
      setNote('');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Screen scroll contentStyle={styles.content} edges={{ top: true, bottom: true }}>
      <AppHeader showBack subtitle="Personel başvurusu" title="Ekibe Katıl" />
      <View style={styles.body}>
        <Input label="Ad Soyad" onChangeText={setName} value={name} />
        <Input
          autoCapitalize="none"
          keyboardType="email-address"
          label="E-posta"
          onChangeText={setEmail}
          value={email}
        />
        <Input
          keyboardType="phone-pad"
          label="Telefon"
          onChangeText={setPhone}
          value={phone}
        />
        <Input
          autoCapitalize="none"
          label="Rol (coach / dietitian / doctor)"
          onChangeText={setRole}
          value={role}
        />
        <Input
          label="Kısa not"
          multiline
          onChangeText={setNote}
          style={styles.note}
          value={note}
        />
        <Button label="Başvuruyu gönder" loading={loading} onPress={() => void onSubmit()} />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { paddingHorizontal: 0 },
  body: { paddingHorizontal: spacing.lg, paddingBottom: spacing.xl, gap: spacing.md },
  note: { minHeight: 100, textAlignVertical: 'top' },
});
