---
name: yeniform-auth-onboarding
description: >-
  Handles Yeni Form auth, login, signup, Google OAuth, password reset,
  ProfileCompletionGate, and onboarding. Use when working on giriş, kayıt,
  onboarding, OAuth, şifre sıfırlama, Turnstile, auth gate, or session unlock.
---

# Yeni Form Auth & Onboarding

## Critical rules

1. Production clients should not call `signInWithPassword` / `signUp` raw against Supabase for password flows — use `POST /api/auth` actions (Turnstile / rate limit). See `api/auth.js` and `docs/SECURITY_OPS.md`.
2. Auth session may exist **before** `members` row (Stripe/IAP pending). UI must use `hasRegisteredMember` — no fake profile header.
3. `ProfileCompletionGate`: if member role and not registered → onboarding (ücretsiz tek adım).

## Onboarding (mobile)

**MOBILE DIFF:** tek adım ücretsiz üyelik. Web hâlâ Hesap → Üyelik stepper.

## Roles after login

- admin → `/(auth)/admin-web` (yönetim yalnız web `/admin`)
- staff → `/staff` (force password if `tempPasswordIssued`)
- member → dashboard/profile per registration state

## Checklist

- [ ] Deep link auth callback + reset password
- [ ] Password login only (**MOBILE DIFF:** Google/Apple kapalı)
- [ ] Disposable email + rate limits honored via API
- [ ] Specs: `docs/mobile/05-auth-onboarding.md`, `flows/F01–F03`

## Related

[reference.md](reference.md)
