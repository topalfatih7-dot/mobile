import { PublicWebScreen } from '@/components/public/PublicWebScreen';
import { env } from '@/config/env';

/** LOCK: blog-list.md — WebView */
export default function BlogListScreen() {
  return <PublicWebScreen title="Blog" url={`${env.apiBaseUrl}/blog`} />;
}
