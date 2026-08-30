# Expo App — Reference

## Native modules expected

| Concern | Library direction |
|---------|-------------------|
| Auth session | `@supabase/supabase-js` + `expo-secure-store` |
| Payments | Web CTA → login’li `/plans` (Android only; iOS no purchase CTA; no IAP SDK) |
| Push | `expo-notifications` |
| Video call | `@daily-co/react-native-daily-js` (+ peer deps) |
| Exercise video | WebView + signed URLs (`expo-video` opsiyonel) |
| Images | `expo-image-picker` (calorie vision; iOS PHPicker) |

## Deep links

- Auth callback / password reset
- `call/:sessionType/:sessionId`
- Chat thread deep links
- Membership purchase (Android): open web `/auth/callback?next=/plans&src=mobile` (same session; no IAP restore). iOS: no purchase handoff.

## Backend

Reuse Vercel `api/*` and Supabase; do not fork business logic into a new BFF unless spec says so.
