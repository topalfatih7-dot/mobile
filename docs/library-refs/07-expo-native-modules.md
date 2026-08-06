# 07 — Expo Native Modules

Hepsi **SDK 56** pin: https://docs.expo.dev/versions/v56.0.0/

## expo-notifications (~56.0.21)

**Docs:** https://docs.expo.dev/versions/v56.0.0/sdk/notifications/  
- Permission prompt + Expo push token → `device_push_tokens`
- Android: `google-services.json` + `android.googleServicesFile` (`SETUP_REQUIRED.md`)
- iOS: `GoogleService-Info.plist` + APNs key (Firebase)
- Foreground banner / local notification smoke
- **Not:** credential yoksa production remote push fail — kod yolu yine test edilebilir (permission + token log)

## expo-camera (~56.0.8)

**Docs:** https://docs.expo.dev/versions/v56.0.0/sdk/camera/  
- Video call + calorie vision gate
- Permission denied UX

## expo-image-picker (~56.0.21)

**Docs:** https://docs.expo.dev/versions/v56.0.0/sdk/imagepicker/  
- Kalori foto (vision), profil/avatar, admin library upload (varsa)
- Photo library + camera permission strings `app.json`

## expo-secure-store (~56.0.4)

**Docs:** https://docs.expo.dev/versions/v56.0.0/sdk/securestore/  
- Auth session / secrets
- iOS Keychain: uninstall sonrası kalabilir (aynı bundle) — tasarımda dikkate al
- Android: uninstall’ta silinir
- Büyük payload (~2KB iOS historical) native reject → hata handle
- `requireAuthentication` Expo Go’da FaceID key eksik olabilir → **dev client**

## expo-av (^16.0.8)

Library video playback. SDK 56 index birincil olarak `expo-video` gösterir; mevcut kod `expo-av`.  
Signed URL + `video_pending` → skill `yeniform-media-exercises`.

## expo-linking / expo-web-browser

- Deep links + OAuth browser session
- `WebBrowser.openAuthSessionAsync` / redirect

## expo-device / expo-constants

- Push token device id, app config (`extra`, EAS `projectId`)

## expo-dev-client (~56.0.24)

**Zorunlu QA yolu.** `npm start` → `expo start --dev-client`.  
Native module değişince yeni EAS development build.

## expo-splash-screen / expo-status-bar

Cold start splash hide timing; status bar stil token’lara uyumlu.
