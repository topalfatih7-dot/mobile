import { env } from '@/config/env';

/**
 * Production Supabase CAPTCHA açık — Turnstile zorunlu.
 * Site key: EXPO_PUBLIC_TURNSTILE_SITE_KEY (public).
 */
export const TURNSTILE_WIRED = true;

/** Widget + client gate — wired ve site key varken açık. */
export function isTurnstileEnabled(): boolean {
  return TURNSTILE_WIRED && Boolean(env.turnstileSiteKey);
}

export function turnstileSiteKey(): string {
  return env.turnstileSiteKey;
}
