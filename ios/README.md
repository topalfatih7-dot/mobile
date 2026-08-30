# Yeni Form — Mobile

Expo SDK **56** (`expo-router`). Ürün kilidi: `docs/mobile/IMPLEMENTATION-LOCK.md`.

## Play Store test (Android AAB)

Sideload / preview APK **yok**. Test kurulumu Play Internal/Closed opt-in. Adımlar: [`docs/mobile/store/android-play-store.md`](docs/mobile/store/android-play-store.md)

```bash
npm run build:play:android
```

Onaysız `eas build` / Submit yok. Telefonda sideload **Yeni Form** varsa Play kurulumundan **önce sil** (imza farklı).

Gerekli ortam (EAS **preview** env, `play-store` profili bunu kullanır; binary’ye gömülür):

- `EXPO_PUBLIC_SUPABASE_URL`
- `EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY` (veya `ANON_KEY`)
- `EXPO_PUBLIC_API_BASE_URL` = `https://www.yeniform.com`
- `EXPO_PUBLIC_YENIFORM_MOBILE_API_SECRET` = Vercel `YENIFORM_MOBILE_API_SECRET`
- isteğe bağlı: `EXPO_PUBLIC_DAILY_DOMAIN`

Push: kökte `google-services.json` + Expo FCM V1 + Firebase SHA. `SETUP_REQUIRED.md`.

## iOS preview (ad hoc)

Android APK gibi herkese kurulmaz. Yalnızca **build’den önce** `eas device:create` ile kaydedilmiş iPhone’lar IPA’yı kurar. Mac gerekmez (EAS cloud). Komut ve sıra: [`docs/mobile/store/ios-preview-build.md`](docs/mobile/store/ios-preview-build.md). Kullanıcı onayından önce build alma.

## Geliştirici (opsiyonel — Metro)

Yalnızca `Yeni Form (Dev)` (`com.yeniform.app.dev`) kuruluysa:

```bash
npm start
```

Expo Go desteklenmez (Daily / native video / FCM).

## Spec

1. `docs/mobile/IMPLEMENTATION-LOCK.md`
2. `.cursor/skills/README.md`
3. `docs/AI_MOBILE_PROGRESS.md`
