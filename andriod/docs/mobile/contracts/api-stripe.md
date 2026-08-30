# Contract — Stripe

## POST /api/stripe-checkout

Headers: Bearer

### Checkout (satın alma)

```json
{ "planId": "vip", "flow": "change", "durationMonths": 3 }
```

Success: `{ "url": "https://checkout.stripe.com/..." }`

Stripe abonelik **eklenir** (mevcut paketleri silmez). Aynı `stripeSubscriptionId` tekrar gelirse o paket satırı güncellenir.

### Portal

```json
{
  "action": "create-portal-session",
  "intent": "manage"
}
```

```json
{
  "action": "create-portal-session",
  "intent": "cancel",
  "mode": "at_period_end",
  "subscriptionId": "sub_xxx"
}
```

`mode`: `at_period_end` | `immediately`. `subscriptionId` bu müşteriye ait değilse 403.

Success: `{ "ok": true, "url": "https://billing.stripe.com/..." }`

### Resume (dönem sonu iptalini geri al)

```json
{ "action": "resume-subscription", "subscriptionId": "sub_xxx" }
```

Success: `{ "ok": true, "resumed": true }`

## POST /api/stripe-webhook

Stripe signature. Events:

- `checkout.session.completed` — pakete `stripeSubscriptionId` yaz, stacking
- `invoice.paid` — eşleşen aboneliğin `expiresAt` uzar
- `customer.subscription.updated` — `cancelAtPeriodEnd` + `currentPeriodEnd` o pakete
- `customer.subscription.deleted` — **yalnız o** `stripeSubscriptionId` expire; diğer paketler durur

Mobile: Portal URL `Linking.openURL`; entitlement `members` satırı (ön plana gelişte yenile).
