import { useEffect } from 'react';
import { Linking } from 'react-native';
import { router } from 'expo-router';

import { LoadingScreen } from '@/components/ui/LoadingScreen';
import { env } from '@/config/env';

/**
 * MOBILE DIFF: intro “keşfet” kaldırıldı; paket karşılaştırma web’de.
 * Eski deep link / nav → tarayıcıda membership.
 */
export default function MembershipScreen() {
  useEffect(() => {
    const url = `${env.apiBaseUrl}/membership`;
    void Linking.openURL(url).finally(() => {
      if (router.canGoBack()) router.back();
      else router.replace('/');
    });
  }, []);

  return <LoadingScreen label="Paketler açılıyor…" />;
}
