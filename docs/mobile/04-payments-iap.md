# 04 — Payments & IAP

## Model

| Kanal | Mekanizma | Ne zaman |
|-------|-----------|----------|
| iOS/Android in-app | RevenueCat → Store IAP | Panel Ödemeler üzerinden yükseltme |
| Web | Stripe Checkout | yeniform.com membership |
| Entitlement | Supabase `members` | Her iki webhook sonrası |

Uygulama içinden yalnızca Stripe’a yönlendirmek App Store reddi riski taşır; dijital üyelik için IAP kullan.

**MOBILE DIFF:** Kayıt yalnızca **ücretsiz**; ücretli paket satışı onboarding’de yok.

## Plan ürünleri (web SELLABLE parity)

| Plan id | Tip | Süre SKU’ları |
|---------|-----|----------------|
| eko_diyet | auto-renewing sub | 1m, 3m, 6m |
| eko_spor | auto-renewing sub | 1m, 3m, 6m |
| diyet | auto-renewing sub | 1m, 3m, 6m |
| spor | auto-renewing sub | 1m, 3m, 6m |
| vip | auto-renewing sub | 1m, 3m, 6m |
| doktor | one-time | once |
| free | — | IAP yok |

Product id: `yf_{planId}_{months}m` / `yf_doktor_once`  
Örnek: `yf_eko_diyet_1m`, `yf_eko_spor_6m`, `yf_vip_3m`.

Eski tek `eko` / `yf_eko_*` **yeni satışta yok** (legacy üye okunabilir).

Fiyatlar (TRY, web `PLAN_PRICING` — store yerel para birimi ayrı):

| Plan | 1 ay | 3 ay | 6 ay |
|------|------|------|------|
| eko_diyet | 1299 | 2999 | 3999 |
| eko_spor | 1299 | 2999 | 3999 |
| diyet | 2499 | 6499 | 9999 |
| spor | 2499 | 6499 | 9999 |
| vip | 4999 | 12999 | 19999 |
| doktor | 1500 once | | |

## Akış (mobil satın alma)

1. Üye `/(member)/profile/payments` → plan seçer  
2. RevenueCat `purchasePackage`  
3. Store onay → RevenueCat webhook → backend  
4. Backend `members.membership`, packageConfig, `premiumExpiresAt` günceller  
5. Client poll / hydrate → feature unlock  

## Akış (web Stripe — mevcut)

1. `POST /api/stripe-checkout` `{ planId, flow, durationMonths }` + Bearer  
2. Redirect Checkout  
3. `stripe-webhook` → members  
4. Mobil: aynı kullanıcı login → entitlement (F15)

## API

`POST /api/revenuecat-webhook` — [contracts/api-revenuecat-webhook.md](contracts/api-revenuecat-webhook.md).

## Restore / grace

- Restore + Supabase membership oku  
- Süre bitince `free` (webhook EXPIRATION / Stripe parity)

## Kabul kriterleri

- [ ] Ücretli feature IAP veya geçerli Supabase membership olmadan açılmaz  
- [ ] Web’den alan kullanıcı mobilde login ile erişir  
- [ ] Doktor one-time ayrı ürün  
- [ ] Sandbox purchase → webhook → DB doğrulanır  
- [ ] Boş RC key → crash yok; anlaşılır TR mesaj  
