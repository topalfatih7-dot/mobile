# P0 — Hesap kurulumu (mağaza)

Mobil IAP / RevenueCat **yok** (2026-08-08). Play’de abonelik ürünü oluşturma. Satın alma: web Stripe. iOS’ta web checkout CTA yok (3.1.3(f)); TestFlight: [`ios-app-store.md`](ios-app-store.md).

## Bundle

- iOS/Android: `com.yeniform.app`
- Scheme: `yeniform://`

## Adımlar

1. **Apple Developer** (organizasyon — sağlık 5.1.1(ix); bireysel riskli)
   - [developer.apple.com/programs](https://developer.apple.com/programs/) — ücretli hesap
   - Identifiers → App ID `com.yeniform.app` → **Push Notifications**
   - **In-App Purchase capability ekleme**
   - Distribution cert + App Store profile + APNs `.p8`: ilk onaylı EAS iOS store build’de EAS üretir (git’e konmaz)
   - Runbook: [`ios-app-store.md`](ios-app-store.md)
2. **App Store Connect** — uygulama `com.yeniform.app`; listing [`ios-listing.tr.md`](ios-listing.tr.md); App Privacy / yaş / inceleme [`ios-asc-forms.md`](ios-asc-forms.md)
3. **Google Play** — uygulama `com.yeniform.app` — ürün kataloğu yok
4. **Supabase Auth** redirect: `yeniform://auth/callback`, `yeniform://auth/callback?next=reset-password`
5. **EAS** ✅ `projectId` = `460ad8b4-c94a-4933-885c-be703befe489` (owner `yeniforms-team`)
6. Android test: [`android-play-store.md`](android-play-store.md) — preview APK yok; Internal AAB.
7. iOS test: onaylı `npm run build:ios:store` → TestFlight Internal. Ad hoc: [`ios-preview-build.md`](ios-preview-build.md).

## Handoff

```
EAS_PROJECT_ID=460ad8b4-c94a-4933-885c-be703befe489
PLAY_APP_CREATED=evet/hayır
PLAY_CLOSED_TESTERS=
ASC_APP_CREATED=evet/hayır
ASC_APPLE_ID=
ACCOUNT_DELETION_URL=https://www.yeniform.com/hesap-silme
```
