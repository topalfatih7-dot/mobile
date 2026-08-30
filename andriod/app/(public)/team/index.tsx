import { PublicWebScreen } from '@/components/public/PublicWebScreen';
import { env } from '@/config/env';

/** LOCK: team-list.md — WebView */
export default function TeamListScreen() {
  return <PublicWebScreen title="Ekibimiz" url={`${env.apiBaseUrl}/ekibimiz`} />;
}
