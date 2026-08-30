import { Redirect, router, type Href } from 'expo-router';
import { Linking, StyleSheet, Text, View } from 'react-native';

import { AuthScreenShell } from '@/components/auth/AuthScreenShell';
import { Button } from '@/components/ui/Button';
import { LoadingScreen } from '@/components/ui/LoadingScreen';
import { env } from '@/config/env';
import { useAuth } from '@/context/AuthContext';
import { colors, fonts, spacing } from '@/theme';

/**
 * MOBILE DIFF: admin paneli uygulamada yok — yönetim yalnız web.
 */
export default function AdminWebOnlyScreen() {
  const { loading, isAuthenticated, role, logout, routeForRole } = useAuth();

  if (loading) return <LoadingScreen label="Oturum kontrol ediliyor…" />;

  if (!isAuthenticated) {
    return <Redirect href={'/(auth)/login' as Href} />;
  }

  if (role !== 'admin') {
    return <Redirect href={(routeForRole() || '/(member)/dashboard') as Href} />;
  }

  const openAdmin = () => {
    void Linking.openURL(`${env.apiBaseUrl}/admin`);
  };

  const onLogout = async () => {
    await logout();
    router.replace('/(auth)/login' as Href);
  };

  return (
    <AuthScreenShell
      subtitle="Yönetim paneli bu uygulamada yok. Üye atama, paket, başvuru ve içerik işlemleri web sitesinden yapılır."
      title="Yönetim web’de">
      <View style={styles.body}>
        <Text style={styles.note}>
          Girişiniz admin. Devam etmek için yeniform.com yönetim panelini açın.
        </Text>
        <Button label="Yönetim panelini aç" onPress={openAdmin} />
        <View style={styles.gap} />
        <Button label="Çıkış yap" onPress={() => void onLogout()} variant="secondary" />
      </View>
    </AuthScreenShell>
  );
}

const styles = StyleSheet.create({
  body: { gap: spacing.sm },
  note: {
    fontFamily: fonts.sans,
    fontSize: 14,
    lineHeight: 21,
    color: colors.cream[800],
    marginBottom: spacing.sm,
  },
  gap: { height: spacing.xs },
});
