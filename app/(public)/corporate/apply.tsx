import { useState } from 'react';
import { Alert, StyleSheet, View } from 'react-native';

import { AppHeader } from '@/components/ui/AppHeader';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Screen } from '@/components/ui/Screen';
import { submitCorporateApplication } from '@/services/db/applications';
import { spacing } from '@/constants/theme';

export default function PublicCorporateApplyScreen() {
  const [company, setCompany] = useState('');
  const [contact, setContact] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [employees, setEmployees] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const onSubmit = async () => {
    if (!company.trim() || !email.trim() || !contact.trim()) {
      Alert.alert('Eksik bilgi', 'Şirket adı, yetkili ve e-posta zorunludur.');
      return;
    }
    setLoading(true);
    try {
      const result = await submitCorporateApplication({
        companyName: company.trim(),
        contactName: contact.trim(),
        email: email.trim(),
        phone: phone.trim(),
        employeeRange: employees.trim(),
        message: message.trim(),
      });
      if (!result.success) {
        Alert.alert('Başvuru gönderilemedi', result.error);
        return;
      }
      Alert.alert('Teşekkürler', 'Kurumsal başvurunuz alındı. Satış ekibimiz size dönüş yapacak.');
      setCompany('');
      setContact('');
      setEmail('');
      setPhone('');
      setEmployees('');
      setMessage('');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Screen scroll contentStyle={styles.content} edges={{ top: true, bottom: true }}>
      <AppHeader showBack subtitle="B2B başvuru formu" title="Kurumsal Başvuru" />
      <View style={styles.body}>
        <Input label="Şirket adı" onChangeText={setCompany} value={company} />
        <Input label="Yetkili kişi" onChangeText={setContact} value={contact} />
        <Input
          autoCapitalize="none"
          keyboardType="email-address"
          label="E-posta"
          onChangeText={setEmail}
          value={email}
        />
        <Input keyboardType="phone-pad" label="Telefon" onChangeText={setPhone} value={phone} />
        <Input
          label="Çalışan sayısı (yaklaşık)"
          onChangeText={setEmployees}
          value={employees}
        />
        <Input
          label="Mesaj"
          multiline
          onChangeText={setMessage}
          style={styles.note}
          value={message}
        />
        <Button label="Gönder" loading={loading} onPress={() => void onSubmit()} />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { paddingHorizontal: 0 },
  body: { paddingHorizontal: spacing.lg, paddingBottom: spacing.xl, gap: spacing.md },
  note: { minHeight: 88, textAlignVertical: 'top' },
});
