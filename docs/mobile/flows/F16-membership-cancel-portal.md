# F16 — Üyelik iptali (Stripe Portal)

Satın alma değişmez: web Checkout. İptal onayı Stripe Müşteri Portalı’ndadır; seçim ve uyarılar bizim ekranlarımızda.

## Actors

Üye (web `/profile/payments` veya mobil `/(member)/profile/payments`). Admin dondur/iptal **yok**.

## Steps

1. Üye paket kartında **Otomatik yenilemeyi kapat** veya **Hemen kapat** (Doktor: yok; `mailto:info@yeniform.com`).
2. Native/web uyarı: dönem sonu vs hemen (hemen = onay kutusu + iade yok).
3. `POST /api/stripe-checkout` `{ action: 'create-portal-session', intent: 'cancel', mode, subscriptionId }`
4. API: abonelik bu Stripe müşterisine ait mi; Portal config (`period_end` | `immediately`, `proration_behavior: none`).
5. Üye Portal’da onaylar.
6. Webhook:
   - `customer.subscription.updated` → o pakete `cancelAtPeriodEnd` / `currentPeriodEnd`
   - `customer.subscription.deleted` → **yalnız o** `stripeSubscriptionId` expire; diğer paketler durur
7. `syncMemberPackages` + `sanitizeStaffForPackage` — kalan pakete göre kota/randevu.

## Yenilemeyi açık tut

`POST /api/stripe-checkout` `{ action: 'resume-subscription', subscriptionId }` → Stripe `cancel_at_period_end: false` + üye satırı. Portal yok.

## Kart / fatura

`intent: 'manage'` — Portal’da iptal **kapalı** (uyarıyı atlamasın).

## Satın alma yığını

Yeni Checkout mevcut abonelikleri kapatmaz. Üye iki paket unutursa ikisi de çekilir.

## Failure

| Durum | Sonuç |
|-------|--------|
| 401 | Oturum toast; app session silinmez |
| 403 subscription | Bu abonelik hesabınıza ait değil |
| Portal URL fail | `Portal açılamadı.` |
| Webhook gecikmesi | Ön plana gelişte `members` yenilenir |

## Acceptance

- [ ] İki Stripe aboneliği: birini kapat → diğeri çekilir
- [ ] Hemen kapat: onay’sız Portal yok; iade yok; o paketin gelecek randevuları kesilir
- [ ] Dönem sonu: erişim bitişe kadar açık; resume çalışır
- [ ] Doktor self-servis iptal yok
- [ ] Admin Dondur/İptal UI yok
