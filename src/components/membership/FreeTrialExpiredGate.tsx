import { router } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { Button } from '@/components/ui/Button';
import { FadeIn } from '@/components/ui/FadeIn';
import { MeshBackground } from '@/components/ui/MeshBackground';
import { MEMBERSHIP_CANCEL_COPY } from '@/data/membershipCancelCopy';
import { canOfferWebPurchase } from '@/services/webCheckoutHandoff';
import { colors, fonts, radius, spacing } from '@/theme';

export function FreeTrialExpiredGate() {
  const offerWebPurchase = canOfferWebPurchase();
  return (
    <MeshBackground style={styles.root}>
      <FadeIn style={styles.card}>
        <View style={styles.iconWrap}>
          <Ionicons color={colors.gold[500]} name="diamond" size={32} />
        </View>
        <Text style={styles.title}>48 Saatlik Deneme Süreniz Doldu</Text>
        <Text style={styles.body}>
          {offerWebPurchase
            ? 'Ücretsiz deneme süreniz sona erdi. Devam etmek için bir üyelik planı seçerek tüm özelliklere erişin.'
            : MEMBERSHIP_CANCEL_COPY.iosTrialBody}
        </Text>
        {offerWebPurchase ? (
          <Button
            label="Plan Seç & Devam Et"
            onPress={() => router.push('/(public)/membership')}
          />
        ) : null}
        <Text style={styles.foot}>
          Soru ve sorunlar için{' '}
          <Text style={styles.link} onPress={() => router.push('/(member)/support')}>
            destek merkezi
          </Text>
        </Text>
      </FadeIn>
    </MeshBackground>
  );
}

export function FreeTrialExpiredProfileAlert() {
  const offerWebPurchase = canOfferWebPurchase();
  return (
    <View style={styles.alert}>
      <View style={styles.alertIcon}>
        <Ionicons color={colors.white} name="warning" size={20} />
      </View>
      <View style={styles.alertText}>
        <Text style={styles.alertKicker}>Dikkat — deneme süreniz doldu</Text>
        <Text style={styles.alertBody}>
          {offerWebPurchase
            ? '48 saatlik Basic denemeniz sona erdi. Panel özelliklerine devam etmek için hemen bir plan seçin.'
            : MEMBERSHIP_CANCEL_COPY.iosTrialBody}
        </Text>
      </View>
      {offerWebPurchase ? (
        <Button
          label="Plan Seç"
          onPress={() => router.push('/(public)/membership')}
          style={styles.alertBtn}
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, justifyContent: 'center', padding: spacing.lg },
  card: {
    backgroundColor: colors.white,
    borderRadius: radius.xl,
    padding: spacing.xl,
    borderWidth: 1,
    borderColor: colors.warm[200],
    gap: spacing.md,
    alignItems: 'center',
  },
  iconWrap: {
    width: 64,
    height: 64,
    borderRadius: radius.xl,
    backgroundColor: colors.warm[100],
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontFamily: fonts.displayBold,
    fontSize: 20,
    color: colors.cream[900],
    textAlign: 'center',
  },
  body: {
    fontFamily: fonts.sans,
    fontSize: 14,
    lineHeight: 21,
    color: colors.cream[800],
    textAlign: 'center',
  },
  foot: {
    fontFamily: fonts.sans,
    fontSize: 12,
    color: colors.cream[800],
    opacity: 0.55,
    textAlign: 'center',
  },
  link: { textDecorationLine: 'underline', color: colors.brand[600] },
  alert: {
    borderWidth: 2,
    borderColor: colors.danger[500],
    backgroundColor: colors.danger[50],
    borderRadius: radius.xl,
    padding: spacing.md,
    gap: spacing.sm,
  },
  alertIcon: {
    width: 40,
    height: 40,
    borderRadius: radius.lg,
    backgroundColor: colors.danger[500],
    alignItems: 'center',
    justifyContent: 'center',
  },
  alertText: { gap: 4 },
  alertKicker: {
    fontFamily: fonts.sansBold,
    fontSize: 12,
    color: colors.danger[700],
    textTransform: 'uppercase',
  },
  alertBody: {
    fontFamily: fonts.sansSemi,
    fontSize: 13,
    color: colors.danger[800],
    lineHeight: 18,
  },
  alertBtn: { marginTop: 4 },
});
