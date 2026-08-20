# Setup Required — Native Credentials

These files are **not committed to git** (they are in `.gitignore`). You must obtain and place them manually before running a native build that needs push.

> **2026-08-20:** İstemci dosyaları kökte (`com.yeniform.app`). Git’e girmez. Expo FCM V1 bağlı. EAS SHA Firebase’de. Test binary = onaylı Play AAB. Gradle yok.

---

## 1. `google-services.json` (Android — FCM)

**What it does:** Enables Firebase Cloud Messaging (push notifications) on Android.

**Steps:**
1. Go to [Firebase Console](https://console.firebase.google.com/) → select your project (or create one).
2. Click the gear icon → **Project settings** → **General** tab.
3. Under **Your apps**, find the Android app with package name `com.yeniform.app`.
   - If it doesn't exist, click **Add app** → Android → enter `com.yeniform.app`.
4. Click **Download google-services.json**.
5. Place the file at the **project root**: `google-services.json` (same folder as `package.json`).
6. Firebase then shows **Add Firebase SDK** (Kotlin vs Java, Gradle Groovy vs Kotlin DSL). **Skip those steps.** This is an Expo managed app — do not paste Gradle/Kotlin snippets. EAS prebuild reads `android.googleServicesFile` from `app.json`.
7. File stays gitignored. `.easignore` allows EAS cloud upload so preview/production Android builds can compile FCM.

`app.json` points to it **only when the file exists** at the project root:

```json
"android": {
  "googleServicesFile": "./google-services.json"
}
```

Do not add `googleServicesFile` without the file — Expo config parse fails and EAS build can fail.

---

## 2. `GoogleService-Info.plist` (iOS — APNs via FCM)

**What it does:** Enables Firebase/APNs push notifications on iOS.

**Steps:**
1. In [Firebase Console](https://console.firebase.google.com/) → **Project settings** → **General**.
2. Under **Your apps**, find the iOS app with bundle ID `com.yeniform.app`.
   - If it doesn't exist, click **Add app** → Apple → enter `com.yeniform.app`.
3. Click **Download GoogleService-Info.plist**.
4. Place the file at the **project root**: `GoogleService-Info.plist` (same folder as `package.json`).

> **Optional but recommended:** Also upload your APNs Auth Key (`.p8`) to Firebase Console under **Project settings → Cloud Messaging → Apple app configuration**. Get the key from [Apple Developer → Certificates, IDs & Profiles → Keys](https://developer.apple.com/account/resources/authkeys/list).

---

## 3. Firebase SHA

Firebase `yeniform-aa5c1` → Android `com.yeniform.app` — **EAS fingerprint 2026-08-20 konsolda var** (üç SHA-1 / dört SHA-256 içinde):

| | |
|--|--|
| SHA-1 | `E0:CF:D4:B5:1F:86:1F:BA:D6:41:A5:53:42:7E:70:4F:A2:D7:AE:23` |
| SHA-256 | `2E:B6:44:C6:A2:B7:E8:21:B4:04:BD:DE:E2:A9:03:FB:53:F7:BC:13:C4:DA:86:DB:F0:DA:8B:2E:79:6F:B1:5E` |

Play Internal sonrası ayrıca Play Console → App integrity → **App signing key** SHA-1/256 (upload key değil) eklenir. SHA eklemek AAB’yi yenilemez.

---

## 4. Expo FCM V1 (gönderme anahtarı)

`google-services.json` yalnız **cihazın** FCM’e kaydı. Expo Push gönderimi: FCM V1 Expo’da **bağlı** (`yeniform-aa5c1` / `firebase-adminsdk-fbsvc@…`, 2026-08-20).

JSON git’e girmez. Yeni anahtar gerekirse aynı Firebase sayfasından üret; sohbette ver veya Expo Credentials’a yükle. Gradle yok.

---

## 5. Expo Push — binary

Dosyalar yereldeyken EAS `play-store` AAB FCM’i gömer (`app.config.js`). Sideload preview APK yok. Metro yetmez. Onaysız `eas build` yok.

```bash
npm run build:play:android
```

iOS: [`docs/mobile/store/ios-preview-build.md`](docs/mobile/store/ios-preview-build.md) + APNs `.p8` Firebase Cloud Messaging.

Play’den kur → üye login → bildirim izni **İzin Ver** → `device_push_tokens` (`ExponentPushToken[...]`).

---

## Summary Checklist

| | Platform | Durum |
|--|----------|--------|
| `google-services.json` | Android istemci | yerelde, git’e girmez |
| `GoogleService-Info.plist` | iOS istemci | yerelde, git’e girmez |
| EAS SHA Firebase’de | Android Play test | ✅ 2026-08-20 (EAS fingerprint listede) |
| Play App Signing SHA | Play AAB | Play’e yükledikten sonra |
| FCM V1 JSON → Expo | gönderim | ✅ 2026-08-20 `yeniforms-team` / `com.yeniform.app` |
| APNs `.p8` | iOS | Firebase’e; git’e girmez |
