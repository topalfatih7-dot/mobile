import { useEffect } from 'react';
import { Linking, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button } from '@/components/ui/Button';
import { FadeIn } from '@/components/ui/FadeIn';
import { LoadingScreen } from '@/components/ui/LoadingScreen';
import { MeshBackground } from '@/components/ui/MeshBackground';
import { IosOutOfAppPurchaseNotice } from '@/components/membership/IosOutOfAppPurchaseNotice';
import { env } from '@/config/env';
import { canOfferWebPurchase } from '@/services/webCheckoutHandoff';
import { colors, fonts, spacing } from '@/theme';

/**
 * MOBILE DIFF: intro “keşfet” kaldırıldı; paket karşılaştırma web’de (Android).
 * iOS 3.1.3(f): tarayıcı checkout yok.
 */
export default function MembershipScreen() {
  const insets = useSafeAreaInsets();
  const offerWebPurchase = canOfferWebPurchase();

  useEffect(() => {
    if (!offerWebPurchase) return;
    const url = `${env.apiBaseUrl}/membership`;
    void Linking.openURL(url).finally(() => {
      if (router.canGoBack()) router.back();
      else router.replace('/');
    });
  }, [offerWebPurchase]);

  if (offerWebPurchase) {
    return <LoadingScreen label="Paketler açılıyor…" />;
  }

  return (
    <MeshBackground style={styles.root}>
      <View style={[styles.box, { paddingTop: insets.top + spacing.xxl }]}>
        <FadeIn>
          <Text style={styles.title}>Üyelik</Text>
          <Text style={styles.body}>Ücretsiz hesap için Kayıt Ol.</Text>
          <IosOutOfAppPurchaseNotice style={styles.notice} />
        </FadeIn>
        <View style={styles.gap} />
        <Button label="Giriş Yap" onPress={() => router.push('/(auth)/login')} />
        <View style={styles.gap} />
        <Button
          label="Kayıt Ol"
          onPress={() => router.push('/(auth)/onboarding')}
          variant="secondary"
        />
        <View style={styles.gap} />
        <Button
          label="Geri"
          onPress={() => {
            if (router.canGoBack()) router.back();
            else router.replace('/');
          }}
          variant="ghost"
        />
      </View>
    </MeshBackground>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  box: { paddingHorizontal: spacing.lg },
  title: {
    fontFamily: fonts.displayExtra,
    fontSize: 28,
    color: colors.cream[900],
  },
  body: {
    fontFamily: fonts.sans,
    fontSize: 16,
    lineHeight: 24,
    color: colors.cream[800],
    marginTop: spacing.md,
  },
  notice: {
    marginTop: spacing.md,
    fontSize: 14,
    lineHeight: 22,
  },
  gap: { height: spacing.sm },
});
