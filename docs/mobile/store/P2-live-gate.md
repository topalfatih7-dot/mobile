# P2 canlı kapısı — keys geldikten sonra

Kod iskeleti hazır. Aşağıdakiler **P0 handoff** sonrası birlikte işaretlenir.

## Önkoşul

- [ ] `docs/mobile/store/P0-handoff-checklist.md` tamam
- [ ] Mobil `.env` / EAS: `EXPO_PUBLIC_REVENUECAT_API_KEY_IOS` + `_ANDROID`
- [ ] Vercel: `REVENUECAT_WEBHOOK_SECRET`
- [ ] Web deploy: `api/revenuecat-webhook.js` production’da
- [ ] RC dashboard webhook: `https://www.yeniform.com/api/revenuecat-webhook` + Bearer secret

## Smoke

- [ ] Native build (dev-client / TestFlight) — Expo Go IAP yok
- [ ] `Purchases.logIn(supabaseUserId)` sonrası offerings dolu (`yf_eko_diyet_*` …)
- [ ] Sandbox purchase → webhook 200 → `members.membership` beklenen plan
- [ ] Restore çalışır
- [ ] Web Stripe üye → mobilde login → ücretli özellik açık (IAP zorunlu değil)
- [ ] EXPIRATION (veya süre bitişi) → free (ileride)

## Kod kapısı (şimdi — key’siz)

- [x] `parseStoreProductId` / `iap.ts` yeni SKU
- [x] `api/revenuecat-webhook.js`
- [x] Payments boş-key UX
- [x] Spec + `.env.example`
