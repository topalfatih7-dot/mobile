# Appendix G — Decisions & Status

## Resolved decisions

| Topic | Decision |
|-------|----------|
| Scope | Member + Staff native; **Admin web-only** (2026-08-17) |
| Framework | Expo |
| Payments | Web Stripe only — mobil IAP/RevenueCat yok |
| Spec location | `docs/mobile/` |
| Skills | `.cursor/skills/yeniform-*` auto-invoke |
| Landing | Native summary + CTA; full marketing optional WebView |
| Legal | Bundle or WebView — wording must not be altered |
| Public team | No email/phone/social |
| Public SKIP | stories / corporate / team-apply — uygulamada rota yok |
| Auth | Password only (Google/Apple kapalı) |
| Onboarding | Tek adım ücretsiz üyelik; paket web `/plans` |

## IMPLEMENTATION LOCK — complete

All planned screens and contracts marked LOCK, WebView, or explicit MOBILE DIFF. See `COMPLETE.md`.

Remaining as **ops / store** (not product invention): FCM credential files, iOS preview, store listing.

## Gap protocol

Still active during coding: if runtime API differs from contract, stop and update contract — do not invent.
