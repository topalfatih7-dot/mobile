import { supabase, isSupabaseEnabled } from '@/services/supabaseClient';

export type SupabaseHealthResult =
  | { ok: true; latencyMs: number; planCount: number }
  | { ok: false; code: 'not_configured' | 'network' | 'query'; message: string };

/**
 * Bağlantı testi — `plans` tablosu herkese açık okuma (RLS: select true).
 * Web ile aynı Supabase projesine erişildiğini doğrular.
 */
export async function testSupabaseConnection(): Promise<SupabaseHealthResult> {
  if (!isSupabaseEnabled || !supabase) {
    return {
      ok: false,
      code: 'not_configured',
      message: 'Supabase ortam değişkenleri tanımlı değil.',
    };
  }

  const started = Date.now();

  try {
    const { count, error } = await supabase
      .from('plans')
      .select('id', { count: 'exact', head: true });

    if (error) {
      return {
        ok: false,
        code: 'query',
        message: error.message,
      };
    }

    return {
      ok: true,
      latencyMs: Date.now() - started,
      planCount: count ?? 0,
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Bilinmeyen ağ hatası';
    return { ok: false, code: 'network', message };
  }
}
