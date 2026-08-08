/**
 * Env — docs/mobile/contracts/env-vars.md
 * Alias: EXPO_PUBLIC_SITE_URL → API_BASE; PUBLISHABLE_KEY → ANON.
 *
 * UI_ONLY_MODE açıkken Supabase “yapılandırılmamış” sayılır — client oluşturulmaz.
 */
import { isUiOnly } from '@/config/runtime';

function read(key: string): string {
  const v = process.env[key];
  return typeof v === 'string' ? v.trim() : '';
}

const apiBase =
  (read('EXPO_PUBLIC_API_BASE_URL') || read('EXPO_PUBLIC_SITE_URL') || 'https://www.yeniform.com').replace(
    /\/$/,
    '',
  );

export const env = {
  supabaseUrl: read('EXPO_PUBLIC_SUPABASE_URL'),
  supabaseAnonKey:
    read('EXPO_PUBLIC_SUPABASE_ANON_KEY') || read('EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY'),
  apiBaseUrl: apiBase,
  adminEmail: (read('EXPO_PUBLIC_ADMIN_EMAIL') || 'admin@yeniform.com').toLowerCase(),
  turnstileSiteKey: read('EXPO_PUBLIC_TURNSTILE_SITE_KEY'),
  dailyDomain: read('EXPO_PUBLIC_DAILY_DOMAIN'),
  dailyRoomPrefix: read('EXPO_PUBLIC_DAILY_ROOM_PREFIX') || 'donusum',
  /** Web VITE_PHONE_VERIFY_ENABLED parity — varsayılan kapalı (Twilio yok). */
  phoneVerifyEnabled: read('EXPO_PUBLIC_PHONE_VERIFY_ENABLED') === 'true',
  /** Web VITE_PHONE_VERIFY_VIA_EMAIL parity. */
  phoneVerifyViaEmail: read('EXPO_PUBLIC_PHONE_VERIFY_VIA_EMAIL') === 'true',
} as const;

/** UI-only iken false — createClient çağrılmaz, ağ yok. */
export const isSupabaseConfigured =
  !isUiOnly() && Boolean(env.supabaseUrl && env.supabaseAnonKey);

export function apiUrl(path: string): string {
  const p = path.startsWith('/') ? path : `/${path}`;
  return `${env.apiBaseUrl}${p}`;
}
