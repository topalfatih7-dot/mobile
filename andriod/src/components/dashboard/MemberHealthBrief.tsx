/**
 * Web parity: Adsız `MemberHealthBrief.jsx`
 * Üyeye dönük AI değerlendirmesi — güçlü yönler, geliştirilecek alanlar
 * ve plan önerisi. Android: Play’de web Stripe “Plan seç” CTA’sı açık.
 */
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

import { Button } from '@/components/ui/Button';
import type { MemberBrief } from '@/services/healthScoreAnalysis';
import { canOfferWebPurchase } from '@/services/webCheckoutHandoff';
import { colors, fonts, radius, spacing } from '@/theme';

type Props = {
  brief: MemberBrief | null | undefined;
  /** Ücretsiz üye: paket önerisi + Plan seç */
  showPitch?: boolean;
};

export function MemberHealthBrief({ brief, showPitch = true }: Props) {
  if (!brief) return null;
  const hasAny = Boolean(brief.strengths || brief.focus || (showPitch && brief.planPitch));
  if (!hasAny) return null;

  const offerWebPurchase = canOfferWebPurchase();

  return (
    <View style={styles.wrap}>
      {brief.strengths ? (
        <View style={[styles.card, styles.strengths]}>
          <View style={styles.kickerRow}>
            <Ionicons color={colors.sage[600]} name="sparkles" size={16} />
            <Text style={[styles.kicker, { color: colors.sage[700] }]}>
              Bunları iyi yapıyorsun
            </Text>
          </View>
          <Text style={[styles.body, { color: colors.sage[700] }]}>
            {brief.strengths}
          </Text>
        </View>
      ) : null}

      {brief.focus ? (
        <View style={[styles.card, styles.focus]}>
          <View style={styles.kickerRow}>
            <Ionicons color={colors.warm[500]} name="flag-outline" size={16} />
            <Text style={[styles.kicker, { color: colors.warm[500] }]}>
              Birlikte düzeltelim
            </Text>
          </View>
          <Text style={[styles.body, { color: colors.cream[900] }]}>
            {brief.focus}
          </Text>
        </View>
      ) : null}

      {showPitch && brief.planPitch ? (
        <View style={[styles.card, styles.pitch]}>
          <View style={styles.kickerRow}>
            <Ionicons color={colors.brand[700]} name="diamond-outline" size={16} />
            <Text style={[styles.kicker, { color: colors.brand[700] }]}>
              Sana özel öneri
            </Text>
          </View>
          <Text style={[styles.body, { color: colors.cream[900] }]}>
            {brief.planPitch}
          </Text>
          {offerWebPurchase ? (
            <Button
              label="Plan seç"
              onPress={() => router.push('/(member)/profile/payments')}
              size="md"
              style={styles.cta}
            />
          ) : null}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: spacing.sm },
  card: {
    borderRadius: radius.xl,
    borderWidth: 1,
    padding: spacing.md,
    gap: 8,
  },
  strengths: {
    backgroundColor: colors.sage[50],
    borderColor: colors.sage[200],
  },
  focus: {
    backgroundColor: colors.warm[50],
    borderColor: colors.warm[200],
  },
  pitch: {
    backgroundColor: colors.brand[50],
    borderColor: colors.brand[200],
  },
  kickerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  kicker: {
    fontFamily: fonts.sansBold,
    fontSize: 11,
    letterSpacing: 0.6,
    textTransform: 'uppercase',
  },
  body: {
    fontFamily: fonts.sans,
    fontSize: 14,
    lineHeight: 21,
  },
  cta: {
    alignSelf: 'stretch',
    marginTop: 4,
  },
});
