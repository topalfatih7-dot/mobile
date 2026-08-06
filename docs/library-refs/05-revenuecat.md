# 05 — RevenueCat (Purchases + UI)

**Paketler:** `react-native-purchases` ^10.4.4 · `react-native-purchases-ui` ^10.4.4  
**Install docs:** https://www.revenuecat.com/docs/getting-started/installation/reactnative  
**Paywalls:** https://www.revenuecat.com/docs/tools/paywalls  
**Ürün skill:** `.agents/skills/integrate-revenuecat`, `revenuecat-paywall`, `yeniform-membership-payments`  
**Contract:** `docs/mobile/04-payments-iap.md`

## Product id sözleşmesi

- Abonelik: `yf_{planId}_{1|3|6}m` (planId: eko|diyet|spor|doktor|vip …)
- Doktor tek sefer: `yf_doktor_once`
- Entitlement: **`Yeniform Pro`**

## SDK kurulum kuralları (RC docs)

1. iOS deployment ≥ 13.4 (Expo SDK 56 → min 16.4 zaten üstte)
2. Android `BILLING` permission
3. iOS In-App Purchase capability
4. Android Activity `launchMode` = `standard` | `singleTop` (aksi halde banka app’e gidince purchase cancel)
5. Expo → **dev client / EAS build** (Expo Go’da IAP yok)
6. Configure: platform public SDK key (`EXPO_PUBLIC_REVENUECAT_API_KEY_IOS` / `_ANDROID`)
7. Identify: auth uid ile `Purchases.logIn` (skill: revenuecat-identify-user)

## UI bileşenleri (projede)

- `PaywallModal` — RevenueCatUI paywall
- `CustomerCenterButton` — abonelik yönetimi
- `checkEntitlement` / `src/services/iap.ts`

## Paywall SDK minimum

Tek sayfa paywall: RN purchases ≥ 8.11.3 (biz 10.4.4 ✅)  
Multipage: RN ≥ **10.6.0** — biz 10.4.4 → multipage dashboard paywall varsa SDK sadece son ekranı gösterebilir. Dashboard’da multipage kullanılıyorsa upgrade değerlendir.

## Entitlement kuralı (F15)

1. Satın alma / restore → RC CustomerInfo  
2. Webhook → Supabase `members`  
3. UI gate = **Supabase membership** (store tek başına yetmez)  
4. Stripe web satın alma → mobile login’de paid özellikler açık olmalı

## Test Store

Test API key (`test_…`) ile dialog Success/Fail/Cancel. Store ürünleri yoksa offerings boş — `SETUP_REQUIRED` / P2 gate.

## MCP

Üyelik/IAP işleri: önce RevenueCat MCP (`.cursor/rules/revenuecat-mcp.mdc`). Secret key chat’e yazma.
