import * as Linking from 'expo-linking';
import { router } from 'expo-router';
import { useEffect, useRef } from 'react';

/**
 * Supabase e-posta / OAuth deep-link'lerini auth callback rotasına taşır.
 * Web AuthRedirectHandler eşdeğeri (docs/rn-migration/07 §6).
 */
export function AuthDeepLinkHandler() {
  const handling = useRef(false);

  useEffect(() => {
    const routeIfAuthUrl = (url: string | null) => {
      if (!url || handling.current) return;
      const lower = url.toLowerCase();
      const looksAuth =
        lower.includes('code=') ||
        lower.includes('token_hash=') ||
        lower.includes('access_token=') ||
        lower.includes('/auth/callback') ||
        lower.includes('/(auth)/callback') ||
        lower.includes('type=recovery') ||
        lower.includes('type=signup') ||
        lower.includes('next=reset-password');

      if (!looksAuth) return;
      if (lower.includes('/(auth)/callback') || lower.includes('/auth/callback')) {
        // Zaten callback rotasındayız — parametreleri koru
        return;
      }

      handling.current = true;
      const encoded = encodeURIComponent(url);
      router.replace(`/(auth)/callback?url=${encoded}`);
      setTimeout(() => {
        handling.current = false;
      }, 1500);
    };

    void Linking.getInitialURL().then(routeIfAuthUrl);
    const sub = Linking.addEventListener('url', ({ url }) => routeIfAuthUrl(url));
    return () => sub.remove();
  }, []);

  return null;
}
