# Contract — Stripe

## POST /api/stripe-checkout

Headers: Bearer  
Body:

```json
{ "planId": "vip", "flow": "register", "durationMonths": 3, "email": "optional@x.com" }
```

Success:

```json
{ "url": "https://checkout.stripe.com/..." }
```

Mobile: no IAP. Payments CTA opens login’li web `/plans` via `/auth/callback?next=/plans&src=mobile` (same JWT). Stripe webhook updates `members`; app refreshes the row on resume.

## POST /api/stripe-webhook

Stripe signature header; server updates members/payments. Not called from app.
