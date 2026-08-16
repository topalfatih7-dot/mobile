/**
 * MOBILE DIFF (P1): native app’te Turnstile widget yok.
 * Web production’da Turnstile zorunlu kalır.
 * Mobil `/api/auth`: body `client: 'yeniform-mobile'` + header
 * `x-yeniform-mobile-key` (= Vercel `YENIFORM_MOBILE_API_SECRET`) ile bypass.
 * Secret yok/yanlış → sunucu “Bot doğrulaması gerekli” döner.
 */

/** API body’ye eklenir — sunucu bot guard bypass anahtarı. */
export const AUTH_CLIENT_MOBILE = 'yeniform-mobile' as const;
