import { useLocalSearchParams } from 'expo-router';

import { PublicWebScreen } from '@/components/public/PublicWebScreen';
import { env } from '@/config/env';

/** LOCK: team-profile.md — WebView */
export default function TeamProfileScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return (
    <PublicWebScreen
      title="Uzman profili"
      url={`${env.apiBaseUrl}/ekibimiz/${encodeURIComponent(String(id || ''))}`}
    />
  );
}
