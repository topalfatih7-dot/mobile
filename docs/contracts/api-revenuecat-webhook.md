# Contract — POST /api/revenuecat-webhook

Base: `{API_BASE}/api/revenuecat-webhook`  
Method: POST  
Header: `Authorization: Bearer <REVENUECAT_WEBHOOK_SECRET>`  
Content-Type: `application/json`

## Purpose

Map RevenueCat subscription events → Supabase `members` (parity with Stripe webhook).

## Security

- Shared secret via `Authorization: Bearer …` (env `REVENUECAT_WEBHOOK_SECRET`)
- Idempotent by `event.id` → `payments.data.revenueCatEventId`

## Product mapping

| Product id | planId | durationMonths |
|------------|--------|----------------|
| `yf_eko_diyet_{1\|3\|6}m` | eko_diyet | 1 / 3 / 6 |
| `yf_eko_spor_{1\|3\|6}m` | eko_spor | 1 / 3 / 6 |
| `yf_diyet_{1\|3\|6}m` | diyet | 1 / 3 / 6 |
| `yf_spor_{1\|3\|6}m` | spor | 1 / 3 / 6 |
| `yf_vip_{1\|3\|6}m` | vip | 1 / 3 / 6 |
| `yf_doktor_once` | doktor | 0 (one-time) |

App User ID = Supabase `auth.users.id` = `members.id`.

## Events (minimum)

| type | Action |
|------|--------|
| INITIAL_PURCHASE, NON_RENEWING_PURCHASE, PRODUCT_CHANGE | Activate / change plan |
| RENEWAL | Extend expiry |
| EXPIRATION, SUBSCRIPTION_PAUSED | Downgrade `free` |
| CANCELLATION | No immediate downgrade |

## Success

```json
{ "ok": true }
```

## Failure

| status | meaning |
|--------|---------|
| 401 | secret missing/invalid |
| 400 | unparseable product / missing app_user_id |
| 500 | DB error |
