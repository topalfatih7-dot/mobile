# Setup Required — Native Credentials

These files are **not committed to git** (they are in `.gitignore`). You must obtain and place them manually before running a native build.

---

## 1. `google-services.json` (Android — FCM)

**What it does:** Enables Firebase Cloud Messaging (push notifications) on Android.

**Steps:**
1. Go to [Firebase Console](https://console.firebase.google.com/) → select your project (or create one).
2. Click the gear icon → **Project settings** → **General** tab.
3. Under **Your apps**, find the Android app with package name `com.yeniform.app`.
   - If it doesn't exist, click **Add app** → Android → enter `com.yeniform.app`.
4. Click **Download google-services.json**.
5. Place the file at the **project root**: `/Users/mac/Desktop/mobile/google-services.json`

`app.json` already points to it:
```json
"android": {
  "googleServicesFile": "./google-services.json"
}
```

---

## 2. `GoogleService-Info.plist` (iOS — APNs via FCM)

**What it does:** Enables Firebase/APNs push notifications on iOS.

**Steps:**
1. In [Firebase Console](https://console.firebase.google.com/) → **Project settings** → **General**.
2. Under **Your apps**, find the iOS app with bundle ID `com.yeniform.app`.
   - If it doesn't exist, click **Add app** → Apple → enter `com.yeniform.app`.
3. Click **Download GoogleService-Info.plist**.
4. Place the file at the **project root**: `/Users/mac/Desktop/mobile/GoogleService-Info.plist`

> **Optional but recommended:** Also upload your APNs Auth Key (`.p8`) to Firebase Console under **Project settings → Cloud Messaging → Apple app configuration**. Get the key from [Apple Developer → Certificates, IDs & Profiles → Keys](https://developer.apple.com/account/resources/authkeys/list).

---

## 3. Expo Push Notification Setup

After placing both files above:

1. Run a new EAS build so the native project picks up the credentials:
   ```bash
   eas build --platform android --profile development
   eas build --platform ios --profile development
   ```
2. To test push notifications with Expo Go / dev client, you need an Expo push token. The app already calls `Notifications.getExpoPushTokenAsync()` — check the console output on first launch.

---

## Summary Checklist

| File | Platform | Location |
|------|----------|----------|
| `google-services.json` | Android | project root |
| `GoogleService-Info.plist` | iOS | project root |
| APNs `.p8` key (optional) | iOS | Upload to Firebase Console only — do NOT commit |

All three are already in `.gitignore` and will never be accidentally committed.
