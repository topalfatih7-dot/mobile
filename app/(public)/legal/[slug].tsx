import { useLocalSearchParams } from 'expo-router';

import { PublicWebScreen } from '@/components/public/PublicWebScreen';
import { legalUrl, resolveLegalSlug, LEGAL_DOCUMENTS } from '@/data/legalSlugs';

/** LOCK: docs/mobile/screens/public/legal.md */
export default function LegalScreen() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const resolved = resolveLegalSlug(slug) || 'gizlilik-politikasi';
  const label = LEGAL_DOCUMENTS[resolved]?.label || 'Yasal metin';
  return <PublicWebScreen title={label} url={legalUrl(resolved)} />;
}
