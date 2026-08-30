import { useEffect } from 'react';
import { Linking } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';

import { LoadingScreen } from '@/components/ui/LoadingScreen';
import { legalUrl, resolveLegalSlug } from '@/data/legalSlugs';

/**
 * MOBILE DIFF: gömülü WebView yok — sistem tarayıcısında yeniform.com legal sayfası.
 */
export default function LegalScreen() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const resolved = resolveLegalSlug(slug) || 'gizlilik-politikasi';

  useEffect(() => {
    const url = legalUrl(resolved);
    void Linking.openURL(url).finally(() => {
      if (router.canGoBack()) router.back();
      else router.replace('/');
    });
  }, [resolved]);

  return <LoadingScreen label="Yasal metin açılıyor…" />;
}
