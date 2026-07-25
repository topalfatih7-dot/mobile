import { PublicWebScreen } from '@/components/public/PublicWebScreen';
import { env } from '@/config/env';

/** LOCK: about.md — WebView /hakkimizda */
export default function AboutScreen() {
  return <PublicWebScreen title="Hakkımızda" url={`${env.apiBaseUrl}/hakkimizda`} />;
}
