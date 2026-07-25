import { useLocalSearchParams } from 'expo-router';

import { PublicWebScreen } from '@/components/public/PublicWebScreen';
import { env } from '@/config/env';

/** LOCK: blog-post.md — WebView */
export default function BlogPostScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return (
    <PublicWebScreen
      title="Blog yazısı"
      url={`${env.apiBaseUrl}/blog/${encodeURIComponent(String(id || ''))}`}
    />
  );
}
