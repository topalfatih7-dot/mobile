# Yeni Form — Mobile

Expo SDK **56** (`expo-router`). Ürün kilidi: `docs/mobile/IMPLEMENTATION-LOCK.md`.

## Play Store (Android AAB)

Sideload APK Play’e gitmez. Yayın adımları (senin işin): [`docs/mobile/store/android-play-store.md`](docs/mobile/store/android-play-store.md)

```bash
npm run build:play:android
```

Onaysız `eas build` / Submit yok.

## Telefonda test (Metro / `expo start` YOK)

İndirdiğiniz APK kendi başına açılır. Development client (QR + Metro) bu yol değildir.

1. Telefonda eski **Yeni Form** uygulamasını silin (imza/paket çakışması).
2. Bilinmeyen kaynaklardan kurulum izni verin.
3. EAS **preview** APK indirin (`.apk` — Play `.aab` değil):

```bash
npm install
npm run build:preview:android
```

4. expo.dev’deki **Install** linkinden APK’yı telefona indirip kurun.
5. **Yeni Form** ikonunu açın — `expo start` çalıştırmayın.

Gerekli ortam (EAS **preview** environment, binary’ye gömülür):

- `EXPO_PUBLIC_SUPABASE_URL`
- `EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY` (veya `ANON_KEY`)
- `EXPO_PUBLIC_API_BASE_URL` = `https://www.yeniform.com`
- `EXPO_PUBLIC_YENIFORM_MOBILE_API_SECRET` = Vercel `YENIFORM_MOBILE_API_SECRET`
- isteğe bağlı: `EXPO_PUBLIC_DAILY_DOMAIN`

Push için kökte `google-services.json` (`com.yeniform.app`). Yoksa APK yine kurulur; bildirim token’ı çalışmaz.

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
