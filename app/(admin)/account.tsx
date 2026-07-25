import { router } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

import { PanelScaffold } from '@/components/panel/PanelScaffold';
import { Button } from '@/components/ui/Button';
import { FadeIn } from '@/components/ui/FadeIn';
import { useAuth } from '@/context/AuthContext';
import { colors, fonts, radius, spacing } from '@/theme';

/** LOCK: docs/mobile/screens/admin/account.md */
export default function AdminAccount() {
  const { email, logout } = useAuth();
  return (
    <PanelScaffold showBack subtitle="Yönetici hesabı" title="Hesap">
      <FadeIn>
        <View style={styles.card}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{(email || 'A').charAt(0).toUpperCase()}</Text>
          </View>
          <Text style={styles.label}>E-posta</Text>
          <Text style={styles.val}>{email}</Text>
          <Text style={styles.label}>Rol</Text>
          <Text style={styles.val}>Yönetici</Text>
        </View>
      </FadeIn>
      <View style={styles.divider} />
      <Button
        label="Çıkış Yap"
        onPress={async () => {
          await logout();
          router.replace('/(auth)/login');
        }}
      />
    </PanelScaffold>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.white,
    borderRadius: radius.xl,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.cream[200],
    gap: 4,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: radius.full,
    backgroundColor: colors.brand[600],
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  avatarText: { fontFamily: fonts.sansSemi, fontSize: 22, color: colors.white },
  label: { fontFamily: fonts.sansSemi, fontSize: 12, color: colors.brand[600], marginTop: 6 },
  val: { fontFamily: fonts.sans, fontSize: 15, color: colors.cream[900] },
  divider: { height: 1, backgroundColor: colors.cream[200], marginVertical: spacing.sm },
});
