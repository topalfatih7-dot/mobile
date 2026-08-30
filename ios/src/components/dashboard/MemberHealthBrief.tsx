/**
 * Web parity: Adsız `MemberHealthBrief.jsx`
 * Üyeye dönük AI değerlendirmesi — güçlü yönler, geliştirilecek alanlar
 * ve plan önerisi. iOS: satın alma CTA yok (3.1.3(f)).
 */
import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';

import { IosOutOfAppPurchaseNotice } from '@/components/membership/IosOutOfAppPurchaseNotice';
import type { MemberBrief } from '@/services/healthScoreAnalysis';
import { colors, fonts, radius, spacing } from '@/theme';

type Props = {
  brief: MemberBrief | null | undefined;
  /** Ücretsiz üye: paket önerisi + uygulama dışı satın alma bilgisi */
  showPitch?: boolean;
};

export function MemberHealthBrief({ brief, showPitch = true }: Props) {
  if (!brief) return null;
  const hasAny = Boolean(brief.strengths || brief.focus || (showPitch && brief.planPitch));
  if (!hasAny) return null;

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
          <IosOutOfAppPurchaseNotice style={styles.notice} />
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
  notice: {
    marginTop: 4,
    opacity: 0.9,
    fontSize: 12,
    lineHeight: 18,
  },
});
