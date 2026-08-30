# F14 — Membership Expiry Downgrade

1. On login/hydrate, sync expiry (`premiumExpiresAt` vs now)  
2. If no active packages remain → membership `free` (sibling Stripe packages stay if still in period)  
3. UI: locked features + upgrade CTA  
4. IAP/Stripe renew extends **the matching** `stripeSubscriptionId` package (does not expire sibling packages)
5. Member cancel at period end keeps access until `currentPeriodEnd`; immediate cancel expires that package only  
