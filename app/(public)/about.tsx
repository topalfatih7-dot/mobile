import { StyleSheet, Text, View } from 'react-native';

import { AppHeader } from '@/components/ui/AppHeader';
import { Card } from '@/components/ui/Card';
import { Screen } from '@/components/ui/Screen';
import { BRAND } from '@/config/brand';
import { useApp } from '@/context/AppContext';
import { colors, fonts, spacing } from '@/constants/theme';

export default function PublicAboutScreen() {
  const { faqs } = useApp();

  return (
    <Screen scroll contentStyle={styles.content} edges={{ top: true, bottom: true }}>
      <AppHeader showBack subtitle={BRAND.tagline} title="Hakkımızda" />
      <View style={styles.body}>
        <Card padding={spacing.lg} style={styles.card}>
          <Text style={styles.lead}>
            {BRAND.name}; çevrimiçi koçluk, diyetisyen ve wellness hizmetlerini tek çatı altında sunar.
            Amacımız herkes için erişilebilir, sürdürülebilir bir form yolculuğu.
          </Text>
        </Card>

        {faqs.slice(0, 5).map((faq, index) => (
          <Card key={String(faq.id || index)} padding={spacing.md} style={styles.faq}>
            <Text style={styles.q}>{String(faq.question || faq.title || 'Soru')}</Text>
            <Text style={styles.a}>{String(faq.answer || faq.body || '')}</Text>
          </Card>
        ))}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { paddingHorizontal: 0 },
  body: { paddingHorizontal: spacing.lg, paddingBottom: spacing.xl },
  card: { marginBottom: spacing.lg },
  lead: {
    fontFamily: fonts.regular,
    fontSize: 15.5,
    lineHeight: 24,
    color: colors.text.secondary,
  },
  faq: { marginBottom: spacing.sm },
  q: { fontFamily: fonts.semibold, fontSize: 14.5, color: colors.text.primary },
  a: {
    fontFamily: fonts.regular,
    fontSize: 13.5,
    color: colors.text.secondary,
    marginTop: 6,
    lineHeight: 20,
  },
});
