# Appendix G — Decisions & Status

## Resolved decisions

| Topic | Decision |
|-------|----------|
| Scope | Member + Staff native; **Admin web-only** (2026-08-17) |
| Framework | Expo |
| Payments | Web Stripe only — mobil IAP/RevenueCat yok. **iOS (2026-08-21):** satın alma CTA yok (3.1.3(f)); mevcut üyelik + Portal durur. Android web `/plans` CTA. |
| Daily Expo plugin | **Yok** (2026-08-21). `@daily-co/config-plugin-rn-daily-js` Expo 55 peer + `useLegacyPackaging` (Play 16 KB) + `SYSTEM_ALERT_WINDOW`. iOS Info.plist + `withDailyForegroundService`. Ekran paylaşımı yok. |
| Spec location | `docs/mobile/` |
| Skills | `.cursor/skills/yeniform-*` auto-invoke |
| Landing | Native summary + CTA; full marketing optional WebView |
| Legal | Bundle or WebView — wording must not be altered |
| Public team | No email/phone/social |
| Public SKIP | stories / corporate / team-apply — uygulamada rota yok |
| Auth | Password only (Google/Apple kapalı) |
| Onboarding | Tek adım ücretsiz üyelik; paket **Android** web `/plans`. iOS satın alma CTA yok. |
| Membership cancel | Uyarı ekranlarımız + Stripe Portal onay; üye dönem sonu veya hemen kapatır (hemen = iade yok). Paketler bağımsız faturalanır. Doktor self-servis iptal yok (`info@yeniform.com`). Admin Dondur/İptal kaldırıldı. Resume: API `cancel_at_period_end: false`. |
| Account deletion | Web `https://www.yeniform.com/hesap-silme`. Üye giriş + şifre + onay. Stripe hemen kapanır, iade yok. Mobil: profil handoff; silme sonrası dönüşte `members` yoksa yerel çıkış. Personel/admin mailto. |

## IMPLEMENTATION LOCK — complete

All planned screens and contracts marked LOCK, WebView, or explicit MOBILE DIFF. See `COMPLETE.md`.

Remaining as **ops / store** (not product invention): Play Internal **yeni** AAB (onaylı), Play listing/formlar, App signing SHA; iOS TestFlight (`ios-app-store.md`, onaylı `build:ios:store`), ASC listing/App Privacy, iPhone 6.7" screenshot.

## Gap protocol

Still active during coding: if runtime API differs from contract, stop and update contract — do not invent.
