# Member — Payment Management (IMPLEMENTATION LOCK)

- **Expo:** `/(member)/profile/payments`
- **Web:** üye paneli `/plans` (`MemberPlansPage` + Stripe Checkout `flow=change`)
- **Priority:** P1

## MOBILE DIFF (required) — 2026-08-15

1. Show current membership + expiry from Supabase (real)
2. List active packages from `members` (if any)
3. **No** in-app purchase, restore, Customer Center, or RevenueCat UI
4. Primary CTA: **Web’den satın al / yönet** → logged-in web `/plans` via session handoff (not public `/membership`)

## Web handoff

`src/services/webCheckoutHandoff.ts` — **never throws**.

Happy path:

`${apiBase}/auth/callback?next=/plans&src=mobile#access_token=…&refresh_token=…`

- Tokens **hash only** (never query).
- Same GoTrue session as the app (no magic link).
- Web AuthCallback allowlist `next=/plans` (optional `?plan=` id) then `MemberPlanCheckout`.
- Stripe success stays on web (`/profile?payment=success`). No auto-return to the app.

## Errors / fallback (do not wipe app session)

| Failure | UX | App auth |
|---------|----|----------|
| UI_ONLY / no supabase | toast demo kapalı | unchanged |
| No access+refresh token | `Oturum bulunamadı. Lütfen tekrar giriş yapın.` | unchanged |
| `refreshSession` timeout/fail | use existing `getSession` if tokens present | unchanged |
| Handoff URL longer than ~1800 | open `${apiBase}/plans` (no tokens) + `Tarayıcıda giriş yapmanız gerekebilir.` | unchanged |
| `openURL` throw | `Web sayfası açılamadı.` | unchanged |
| `canOpenURL === false` | still try `openURL` | unchanged |
| Web `setSession` fail | web error card → Giriş Yap `state.from=/plans` | unchanged |
| Foreground member refresh fail | keep stale plan card | unchanged |

Web `src=mobile` must skip `registerActiveSession` / `refreshSession` (token rotation would sign the app out).

Foreground: `members` row `select` + `applyRemoteMember` only. **Do not** call `refreshAuth()` / `hydrateAuth()` on this path.

## Strings

- Title: `Ödemeler & Üyelik`
- CTA: `Web’den satın al / yönet`
- Note: satın alma ve yönetim web üzerinden; web üyeliği uygulamada geçerlidir
- Session missing: `Oturum bulunamadı. Lütfen tekrar giriş yapın.`
- Browser fail: `Web sayfası açılamadı.`
- Tokenless fallback: `Tarayıcıda giriş yapmanız gerekebilir.`
- Demo: `Satın alma demo modda kapalı. Giriş ekranından demo hesapla devam edin.`

## Acceptance

- [ ] No fake payment history presented as real
- [ ] Entitlement from Supabase
- [ ] CTA opens web `/auth/callback?next=/plans&src=mobile` with hash session (or `/plans` tokenless fallback)
- [ ] CTA failure does not log the user out of the app
- [ ] Returning to the app refreshes `members` without wiping auth on error
- [ ] No `react-native-purchases` / RevenueCat imports
