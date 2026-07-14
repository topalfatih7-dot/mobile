import { router } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

import { AdminPanelScreen } from '@/components/admin/AdminPanelScreen';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { useApp } from '@/context/AppContext';
import { colors, fonts, spacing } from '@/constants/theme';

export default function AdminAccountScreen() {
  const { user, logout } = useApp();

  const onLogout = async () => {
    await logout();
    router.replace('/');
  };

  return (
    <AdminPanelScreen subtitle="Admin hesap ayarları" title="Hesap">
      <Card padding={spacing.lg} style={styles.card}>
        <Text style={styles.label}>E-posta</Text>
        <Text style={styles.value}>{user.email}</Text>
        <Text style={styles.label}>Ad</Text>
        <Text style={styles.value}>{user.name}</Text>
      </Card>
      <Button label="Çıkış Yap" onPress={onLogout} variant="secondary" />
    </AdminPanelScreen>
  );
}

const styles = StyleSheet.create({
  card: { marginBottom: spacing.xl },
  label: {
    fontFamily: fonts.semibold,
    fontSize: 11,
    color: colors.text.muted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginTop: spacing.sm,
  },
  value: {
    fontFamily: fonts.medium,
    fontSize: 15,
    color: colors.text.primary,
    marginTop: 2,
  },
});
