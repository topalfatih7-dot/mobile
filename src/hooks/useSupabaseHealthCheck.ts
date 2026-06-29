import { useEffect } from 'react';

import { isSupabaseEnabled } from '@/services/supabaseClient';
import { testSupabaseConnection } from '@/services/supabaseHealth';

/** Adım 2 — uygulama açılışında Supabase bağlantısını doğrular (yalnızca geliştirme). */
export function useSupabaseHealthCheck(): void {
  useEffect(() => {
    if (!__DEV__ || !isSupabaseEnabled) return;

    let cancelled = false;

    void (async () => {
      const result = await testSupabaseConnection();
      if (cancelled) return;

      if (result.ok) {
        console.info(
          `[Supabase] Bağlantı OK — ${result.latencyMs}ms, plans: ${result.planCount}`,
        );
      } else {
        console.warn(`[Supabase] Bağlantı hatası (${result.code}): ${result.message}`);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);
}
