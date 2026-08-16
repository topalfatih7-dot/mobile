/**
 * Env — docs/mobile/contracts/env-vars.md
 * Alias: EXPO_PUBLIC_SITE_URL → API_BASE; PUBLISHABLE_KEY → ANON.
 *
 * UI_ONLY_MODE açıkken Supabase “yapılandırılmamış” sayılır — client oluşturulmaz.
 *
 * Expo production bundle only inlines static `process.env.EXPO_PUBLIC_*` (dot notation).
 * `process.env[key]` stays empty in standalone APK — login then looks like “no key”.
 */
import { isUiOnly } from '@/config/runtime';

function trimEnv(value: string | undefined): string {
  return typeof value === 'string' ? value.trim() : '';
}

const apiBase = (
  trimEnv(process.env.EXPO_PUBLIC_API_BASE_URL) ||
  trimEnv(process.env.EXPO_PUBLIC_SITE_URL) ||
  'https://www.yeniform.com'
).replace(/\/$/, '');

export const env = {
  supabaseUrl: trimEnv(process.env.EXPO_PUBLIC_SUPABASE_URL),
  supabaseAnonKey:
    trimEnv(process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY) ||
    trimEnv(process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY),
  apiBaseUrl: apiBase,
  adminEmail: (trimEnv(process.env.EXPO_PUBLIC_ADMIN_EMAIL) || 'admin@yeniform.com').toLowerCase(),
  turnstileSiteKey: trimEnv(process.env.EXPO_PUBLIC_TURNSTILE_SITE_KEY),
  /**
   * Sunucu `YENIFORM_MOBILE_API_SECRET` ile birebir — `x-yeniform-mobile-key`.
   * Yoksa `/api/auth` Turnstile ister (native’de widget yok → “Bot doğrulaması gerekli”).
   */
  mobileApiSecret: trimEnv(process.env.EXPO_PUBLIC_YENIFORM_MOBILE_API_SECRET),
  dailyDomain: trimEnv(process.env.EXPO_PUBLIC_DAILY_DOMAIN),
  dailyRoomPrefix: trimEnv(process.env.EXPO_PUBLIC_DAILY_ROOM_PREFIX) || 'donusum',
  /** Web VITE_PHONE_VERIFY_ENABLED parity — varsayılan kapalı (Twilio yok). */
  phoneVerifyEnabled: trimEnv(process.env.EXPO_PUBLIC_PHONE_VERIFY_ENABLED) === 'true',
  /** Web VITE_PHONE_VERIFY_VIA_EMAIL parity. */
  phoneVerifyViaEmail: trimEnv(process.env.EXPO_PUBLIC_PHONE_VERIFY_VIA_EMAIL) === 'true',
} as const;

/** UI-only iken false — createClient çağrılmaz, ağ yok. */
export const isSupabaseConfigured =
  !isUiOnly() && Boolean(env.supabaseUrl && env.supabaseAnonKey);

export function apiUrl(path: string): string {
  const p = path.startsWith('/') ? path : `/${path}`;
  return `${env.apiBaseUrl}${p}`;
}
