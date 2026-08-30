/**
 * Web parity: Adsız UnpaidMemberGate.jsx
 * MOBILE DIFF: Android CTA → /(member)/profile/payments (web /plans).
 * iOS 3.1.3(f): satın alma butonu yok; destek e-posta / web.
 */
import { Ionicons } from '@expo/vector-icons';
import { router, type Href } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

import { IosOutOfAppPurchaseNotice } from '@/components/membership/IosOutOfAppPurchaseNotice';
import { Button } from '@/components/ui/Button';
import { MEMBERSHIP_CANCEL_COPY } from '@/data/membershipCancelCopy';
import { canOfferWebPurchase } from '@/services/webCheckoutHandoff';
import { colors, fonts, radius, spacing } from '@/theme';

const DEFAULT_DESC =
  'Sayfayı gezebilirsiniz; mesaj, randevu, program ve benzeri ücretli işlemler için bir plan seçin.';

export function UnpaidMemberGate({
  title = 'Bu özellik paket gerektirir',
  description,
}: {
  title?: string;
  description?: string;
}) {
  const offerWebPurchase = canOfferWebPurchase();
  const desc = offerWebPurchase
    ? description || DEFAULT_DESC
    : description || MEMBERSHIP_CANCEL_COPY.iosUnpaidDesc;

  return (
    <View style={styles.wrap}>
      <View style={styles.card}>
        <View style={styles.icon}>
          <Ionicons color={colors.gold[500]} name="diamond" size={28} />
        </View>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.desc}>{desc}</Text>
        {offerWebPurchase ? (
          <Button
            label="Plan Seç"
            onPress={() => router.push('/(member)/profile/payments' as Href)}
            rightIcon="diamond"
            style={{ alignSelf: 'stretch' }}
          />
        ) : (
          <IosOutOfAppPurchaseNotice align="center" />
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    paddingVertical: spacing.xl,
    paddingHorizontal: spacing.sm,
  },
  card: {
    backgroundColor: colors.white,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.warm[200],
    padding: spacing.xl,
    alignItems: 'center',
    gap: spacing.sm,
  },
  icon: {
    width: 56,
    height: 56,
    borderRadius: radius.xl,
    backgroundColor: colors.warm[100],
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  title: {
    fontFamily: fonts.displayBold,
    fontSize: 20,
    color: colors.cream[900],
    textAlign: 'center',
  },
  desc: {
    fontFamily: fonts.sans,
    fontSize: 14,
    lineHeight: 21,
    color: colors.cream[800],
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
});
