import { router } from 'expo-router';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { BrandLogo } from '@/components/ui/BrandLogo';
import { Button } from '@/components/ui/Button';
import { FadeIn } from '@/components/ui/FadeIn';
import { MeshBackground } from '@/components/ui/MeshBackground';
import { MEMBERSHIP_CANCEL_COPY } from '@/data/membershipCancelCopy';
import { canOfferWebPurchase } from '@/services/webCheckoutHandoff';
import { colors, fonts, radius, spacing } from '@/theme';

/** LOCK: docs/mobile/screens/public/landing.md — native summary + CTA */
export default function LandingScreen() {
  const insets = useSafeAreaInsets();
  const offerWebPurchase = canOfferWebPurchase();

  return (
    <MeshBackground style={styles.root}>
      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingTop: insets.top + spacing.xxl, paddingBottom: insets.bottom + spacing.xxl },
        ]}
        showsVerticalScrollIndicator={false}>
        <FadeIn>
          <BrandLogo size="lg" />
        </FadeIn>
        <FadeIn delay={100}>
          <Text style={styles.hero}>Sağlıklı forma{'\n'}birlikte</Text>
          <Text style={styles.lead}>
            {offerWebPurchase
              ? 'Koç, diyetisyen ve doktor desteği tek uygulamada. Ücretsiz başla veya paketini seç.'
              : MEMBERSHIP_CANCEL_COPY.iosLandingLead}
          </Text>
        </FadeIn>

        <FadeIn delay={180} style={styles.ctaBlock}>
          <Button label="Giriş Yap" onPress={() => router.push('/(auth)/login')} />
          <View style={styles.gap} />
          <Button
            label="Kayıt Ol"
            onPress={() => router.push('/(auth)/onboarding')}
            variant="secondary"
          />
          {offerWebPurchase ? (
            <>
              <View style={styles.gap} />
              <Button
                label="Planları İncele"
                onPress={() => router.push('/(public)/membership')}
                variant="ghost"
              />
            </>
          ) : null}
        </FadeIn>

        <FadeIn delay={260} style={styles.chips}>
          {[
            { t: 'Koçluk', c: colors.brand[100], fg: colors.brand[700] },
            { t: 'Diyet', c: colors.sage[100], fg: colors.sage[700] },
            { t: 'Doktor', c: colors.mint[50], fg: colors.sage[600] },
            { t: 'AI Kalori', c: colors.warm[100], fg: colors.warm[500] },
          ].map((chip) => (
            <View key={chip.t} style={[styles.chip, { backgroundColor: chip.c }]}>
              <Text style={[styles.chipText, { color: chip.fg }]}>{chip.t}</Text>
            </View>
          ))}
        </FadeIn>
      </ScrollView>
    </MeshBackground>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  content: { paddingHorizontal: spacing.lg },
  hero: {
    fontFamily: fonts.displayExtra,
    fontSize: 36,
    lineHeight: 42,
    color: colors.cream[900],
    marginTop: spacing.xl,
  },
  lead: {
    fontFamily: fonts.sans,
    fontSize: 16,
    lineHeight: 24,
    color: colors.cream[800],
    marginTop: spacing.md,
    maxWidth: 340,
  },
  ctaBlock: { marginTop: spacing.xxl },
  gap: { height: spacing.sm },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginTop: spacing.xxl,
  },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: radius.md,
  },
  chipText: {
    fontFamily: fonts.sansSemi,
    fontSize: 13,
  },
});
