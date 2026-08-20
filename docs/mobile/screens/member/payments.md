# Member — Payment Management (IMPLEMENTATION LOCK)

- **Expo:** `/(member)/profile/payments`
- **Web:** üye paneli `/profile/payments` (paket kartları + Stripe Portal) ve `/plans` (satın alma)
- **Priority:** P1

## MOBILE DIFF (required) — 2026-08-20 üyelik iptali

1. Mevcut üyelik + `activePackages` Supabase’ten (gerçek)
2. Paketler **bağımsız faturalanır**; birini kapatmak diğerini durdurmaz
3. İptal: native uyarı (dönem sonu / hemen kapat) → `POST /api/stripe-checkout` `{ action: 'create-portal-session', intent: 'cancel', mode, subscriptionId }` → Stripe Portal URL
4. Yenilemeyi açık tut: `{ action: 'resume-subscription', subscriptionId }` (Portal yok)
5. Kart/fatura: `{ action: 'create-portal-session', intent: 'manage' }`
6. Paket ekle: mevcut JWT handoff → web `/plans`
7. Doktor: self-servis iptal yok; `mailto:info@yeniform.com`
8. **No** IAP / RevenueCat

Hemen kapat: onay kutusu zorunlu; iade yok; erişim ve o pakete bağlı gelecek randevular kesilir.

## Web handoff (satın alma)

`src/services/webCheckoutHandoff.ts` — **never throws**.

`${apiBase}/auth/callback?next=/plans&src=mobile#access_token=…&refresh_token=…`

Portal iptal/kart **handoff değil**; native API + tarayıcıda Stripe URL.

## Errors / fallback (do not wipe app session)

| Failure | UX | App auth |
|---------|----|----------|
| UI_ONLY / no supabase | toast demo kapalı | unchanged |
| No access+refresh token | `Oturum bulunamadı. Lütfen tekrar giriş yapın.` | unchanged |
| Handoff URL longer than ~1800 | open `${apiBase}/plans` (no tokens) + `Tarayıcıda giriş yapmanız gerekebilir.` | unchanged |
| Portal / resume fail | toast API `error` | unchanged |
| Foreground member refresh fail | keep stale plan card | unchanged |

Foreground: `members` row `select` + `applyRemoteMember` only.

## Strings

Kilit: `src/data/membershipCancelCopy.ts` (web `membershipCancelCopy.js` ile aynı).

- Title: `Ödemeler & Üyelik`
- Satın alma CTA: `Web’den paket ekle`
- Kart: `Kart ve fatura`
- Dönem sonu: `Otomatik yenilemeyi kapat`
- Hemen: `Hemen kapat`
- Geri al: `Yenilemeyi açık tut`
- Doktor: tek seferlik; `info@yeniform.com`

## Acceptance

- [ ] İki Stripe aboneliği: birini dönem sonunda kapat → diğeri çekilir
- [ ] Hemen kapat: onay’sız Portal yok; iade yok copy görünür
- [ ] Yenilemeyi açık tut satırı günceller (`cancelAtPeriodEnd` kalkar)
- [ ] Doktor’da iptal CTA yok
- [ ] Satın alma CTA `/plans` handoff; oturum silinmez
- [ ] No RevenueCat
