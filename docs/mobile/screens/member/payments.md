# Member — Payment Management (IMPLEMENTATION LOCK)

- **Expo:** `/(member)/profile/payments`
- **Web:** membership / Stripe Checkout (`/membership`)
- **Priority:** P1

## MOBILE DIFF (required) — 2026-08-08

1. Show current membership + expiry from Supabase (real)
2. List active packages from `members` (if any)
3. **No** in-app purchase, restore, Customer Center, or RevenueCat UI
4. Primary CTA: **Web’den satın al / yönet** → `Linking.openURL(\`${EXPO_PUBLIC_API_BASE_URL}/membership\`)`

## Strings

- Title: `Ödemeler & Üyelik`
- CTA: `Web’den satın al / yönet`
- Note: satın alma ve yönetim web üzerinden; web üyeliği uygulamada geçerlidir

## Acceptance

- [ ] No fake payment history presented as real
- [ ] Entitlement from Supabase
- [ ] CTA opens web `/membership` in browser
- [ ] No `react-native-purchases` / RevenueCat imports
