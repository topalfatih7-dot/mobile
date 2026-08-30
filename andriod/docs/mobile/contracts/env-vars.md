# Contract — Environment Variables (names only)

## Mobile (EXPO_PUBLIC_*)

| Name | Purpose |
|------|---------|
| EXPO_PUBLIC_SUPABASE_URL | Supabase URL |
| EXPO_PUBLIC_SUPABASE_ANON_KEY | Publishable/anon key |
| EXPO_PUBLIC_API_BASE_URL | https://www.yeniform.com or Vercel URL (membership CTA) |
| EXPO_PUBLIC_DAILY_DOMAIN | Daily domain |
| EXPO_PUBLIC_TURNSTILE_SITE_KEY | if using Turnstile webview |
| EXPO_PUBLIC_YENIFORM_MOBILE_API_SECRET | `/api/auth` Turnstile bypass; header `x-yeniform-mobile-key` — Vercel `YENIFORM_MOBILE_API_SECRET` ile aynı |
| EXPO_PUBLIC_GA4_ID | optional analytics |
| EXPO_PUBLIC_PHONE_VERIFY_ENABLED | `true` to show phone verify UI (web `VITE_PHONE_VERIFY_ENABLED`; default off) |
| EXPO_PUBLIC_PHONE_VERIFY_VIA_EMAIL | `true` for email-link fallback (web `VITE_PHONE_VERIFY_VIA_EMAIL`) |
| EXPO_PUBLIC_AI_CHAT_ENABLED | Kalori metin AI — varsayılan açık; `false` ile kapat (web `VITE_AI_CHAT_ENABLED`) |
| EXPO_PUBLIC_AI_VISION_ENABLED | Kalori foto AI — varsayılan açık; `false` ile kapat (web `VITE_AI_VISION_ENABLED`) |

## Server (Vercel — already used by web)

SUPABASE_SERVICE_ROLE_KEY, STRIPE_*, DAILY_API_KEY, GEMINI/OPENAI keys, TURNSTILE_SECRET_KEY, YENIFORM_MOBILE_API_SECRET, UPSTASH_*, CRON_SECRET, TELEGRAM_*

İsteğe bağlı Portal config (yoksa API metadata ile bulur/oluşturur):

`STRIPE_PORTAL_CONFIG_MANAGE`, `STRIPE_PORTAL_CONFIG_PERIOD_END`, `STRIPE_PORTAL_CONFIG_IMMEDIATE`

~(Kaldırıldı: EXPO_PUBLIC_REVENUECAT_*, REVENUECAT_WEBHOOK_SECRET — mobil IAP iptal 2026-08-08)~

Never put service role or Stripe secret in the mobile binary.
