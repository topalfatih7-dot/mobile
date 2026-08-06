import { env } from '@/config/env';

/**
 * MOBILE DIFF (P1): native app’te Turnstile yok.
 * Web production’da Turnstile zorunlu kalır.
 * Mobil `/api/auth` çağrıları `client: 'yeniform-mobile'` gönderir;
 * sunucu rate limit ile korur, CAPTCHA service-role grant ile aşılır.
 *
 * Site key env’de kalsa bile widget gösterilmez.
 */
export const TURNSTILE_WIRED = false;

/** Widget + client gate — P1’de her zaman kapalı. */
export function isTurnstileEnabled(): boolean {
  return TURNSTILE_WIRED && Boolean(env.turnstileSiteKey);
}

export function turnstileSiteKey(): string {
  return env.turnstileSiteKey;
}

/** API body’ye eklenir — sunucu bot guard bypass anahtarı. */
export const AUTH_CLIENT_MOBILE = 'yeniform-mobile' as const;
