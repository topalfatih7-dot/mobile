import { router, type Href } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

import { AppHeader } from '@/components/ui/AppHeader';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Screen } from '@/components/ui/Screen';
import { BRAND } from '@/config/brand';
import { colors, fonts, spacing } from '@/constants/theme';

export default function PublicCorporateScreen() {
  return (
    <Screen scroll contentStyle={styles.content} edges={{ top: true, bottom: true }}>
      <AppHeader showBack subtitle="Kurumsal wellness" title="Kurumsal" />
      <View style={styles.body}>
        <Card padding={spacing.lg} style={styles.card}>
          <Text style={styles.title}>{BRAND.name} Kurumsal</Text>
          <Text style={styles.bodyText}>
            Çalışanlarınız için çevrimiçi koçluk, beslenme danışmanlığı ve wellness programları.
            Şirketinize özel paketler için bizimle iletişime geçin.
          </Text>
        </Card>
        <Button
          label="Kurumsal başvuru"
          onPress={() => router.push('/(public)/corporate/apply' as Href)}
        />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { paddingHorizontal: 0 },
  body: { paddingHorizontal: spacing.lg, paddingBottom: spacing.xl, gap: spacing.lg },
  card: {},
  title: { fontFamily: fonts.display, fontSize: 20, color: colors.text.primary },
  bodyText: {
    fontFamily: fonts.regular,
    fontSize: 15,
    color: colors.text.secondary,
    marginTop: spacing.md,
    lineHeight: 23,
  },
});
