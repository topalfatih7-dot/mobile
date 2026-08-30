# iOS — App Store Connect **test** yayını (TestFlight)

Sideload / ad hoc IPA **TestFlight yerine geçmez**. Yayınlama testi = store-imzalı IPA → TestFlight Internal.

Paket: `com.yeniform.app`  
Profil: `eas.json` → `play-store` → `distribution: store`, env **preview** (Play Internal AAB ile aynı backend)  
Komut: `npm run build:ios:store`  
EAS: owner `yeniforms-team`, `extra.eas.projectId` = `460ad8b4-c94a-4933-885c-be703befe489`

Ödeme: uygulama içi IAP **yok**. iOS binary’de web `/plans` / `/membership` satın alma CTA **yok** (Guideline 3.1.3(f) companion). iOS’ta Ödeme Yönetimi / Stripe Portal UI yok (2026-08-22). Android’de web CTA + Portal durur.

FCM: kökte `GoogleService-Info.plist` (git’e girmez). Arka plan push: bu IPA + EAS **APNs** key. Gradle yok.

**Onaysız `eas build` / Submit yok.**

Ad hoc (UDID, mağaza değil): [`ios-preview-build.md`](ios-preview-build.md).

Doküman paketi (Android `android-play-store.md` + `android-play-forms.md` eşleri):

| Dosya | Kullanım |
|-------|----------|
| Bu dosya | TestFlight runbook |
| [`ios-listing.tr.md`](ios-listing.tr.md) | ASC listing kopyala-yapıştır |
| [`ios-asc-forms.md`](ios-asc-forms.md) | App Privacy, yaş, sağlık, UGC, inceleme notu |
| [`screenshot-checklist.md`](screenshot-checklist.md) | iPhone 6.7" 1290×2796 |
| [`P0-handoff-checklist.md`](P0-handoff-checklist.md) | Apple Developer + ASC hesap |
| [`P6-store-gate.md`](P6-store-gate.md) | Yayın kapısı |

---

## Teknik (Expo SDK 56)

Kaynak: [Expo SDK 56](https://docs.expo.dev/versions/v56.0.0/), [EAS Submit iOS](https://docs.expo.dev/submit/ios/), [App Store Review Guidelines](https://developer.apple.com/app-store/review/guidelines/).

| Madde | Durum |
|-------|--------|
| Bundle | `com.yeniform.app` (dev client: `com.yeniform.app.dev`) |
| Min iOS | SDK 56 varsayılan (15.1+) |
| Tablet | `supportsTablet: false` — iPad screenshot yok |
| Arka plan | `audio` + `voip` (Daily seans sesi) + `remote-notification` |
| Ekran paylaşımı | Yok (`withDailyForegroundService` MediaProjection siler). `@daily-co/config-plugin-rn-daily-js` **yok** — Expo 55 peer, `useLegacyPackaging` (16 KB), `SYSTEM_ALERT_WINDOW`. Info.plist + mevcut Android FGS plugin. |
| Galeri | iOS PHPicker; tam kütüphane izni yok |
| Galeriye kayıt | Yok — `NSPhotoLibraryAddUsageDescription` yok |
| Şifreleme | `ITSAppUsesNonExemptEncryption: false` (yalnız HTTPS) |
| Sign in with Apple | Yok — sosyal giriş kapalı |
| IAP / StoreKit | Yok |
| ATT / HealthKit / konum | Yok |
| Bildirim sesi | OS `default` |

---

## Senin işin (sıra)

### 1. Apple Developer

1. [developer.apple.com/programs](https://developer.apple.com/programs/) — **organizasyon** hesabı (sağlık 5.1.1(ix); bireysel riskli).
2. Identifiers → App ID `com.yeniform.app` → **Push Notifications**. **In-App Purchase capability ekleme.**
3. İlk EAS iOS store build’de credentials’ı EAS yönetsin: Distribution cert + App Store provisioning + APNs `.p8`.

### 2. App Store Connect

1. [App Store Connect](https://appstoreconnect.apple.com) → Yeni uygulama. Bundle `com.yeniform.app` birebir.
2. Dil: Türkçe. Kategori: Health & Fitness. Yaş anketi: [`ios-asc-forms.md`](ios-asc-forms.md).
3. Gizlilik: `https://www.yeniform.com/legal/gizlilik-politikasi`
4. Destek: `https://www.yeniform.com`
5. Hesap silme (App Privacy / inceleme notu): `https://www.yeniform.com/hesap-silme`
6. Listing kopyala: [`ios-listing.tr.md`](ios-listing.tr.md)

### 3. APNs + FCM istemci

1. EAS ilk iOS store build’de APNs Auth Key üretir (hesapta en fazla **2** key). Git’e konmaz.
2. Expo Push iOS **APNs** kullanır. Firebase Console’a `.p8` yüklemek Expo Push için zorunlu değil.
3. Kökte `GoogleService-Info.plist` (`BUNDLE_ID` = `com.yeniform.app`). `.easignore` EAS’e yükler; gitignore’da kalır.

FCM dosya adımları: [`SETUP_REQUIRED.md`](../../../SETUP_REQUIRED.md).

### 4. EAS IPA (yalnız açık onay)

```bash
npm run eas:preview-env          # EXPO_PUBLIC_* preview env’de yoksa
npm run build:ios:store
```

Profil `play-store`: store imzası, **preview** env (production env boşsa kullanma).

Bitince expo.dev’den IPA / TestFlight’a submit. Ad hoc preview IPA TestFlight’a gitmez.

İsteğe bağlı (ayrı onay): `npm run submit:ios` — ASC App ID / Apple ID ilk seferde EAS sorar; uydurma `ascAppId` yok.

### 5. TestFlight

- Internal: App Store Connect kullanıcıları (Account Holder / Admin / App Manager / Developer). Harici inceleme yok.
- External: Apple Beta App Review. İlk mağaza öncesi Internal yeter.
- Testers: 1 üye e-posta/şifre (Google/Apple kapalı). Personel test edeceksen staff. Şifreyi inceleme bitene kadar değiştirme.

### 6. Listing + formlar

- Metin: [`ios-listing.tr.md`](ios-listing.tr.md) — tıbbi cihaz uyarısı + “Uygulama içi satın alma yoktur.”
- Form / App Privacy / inceleme notu: [`ios-asc-forms.md`](ios-asc-forms.md)
- Screenshot: [`screenshot-checklist.md`](screenshot-checklist.md) — iPhone 6.7" (1290×2796), sıra Play 01–06. iPad yok.
- App ikon: `assets/icon.png` → EAS 1024. Play 512 ayrı dosya.

### 7. Production App Review (ayrı onay)

TestFlight Internal smoke bittiyse App Store → **Submit for Review**. İnceleme notu: `ios-asc-forms.md`.

Stripe ile dijital üyelik TR mağazada CTA ile reddedilir; bu yüzden iOS’ta satın alma butonu **yok**. IAP eklenmez.

---

## İzin gerekçeleri (Info.plist)

| Key | Neden |
|-----|--------|
| NSCameraUsageDescription | Görüntülü seans (Daily) + kalori / profil foto |
| NSMicrophoneUsageDescription | Görüntülü seans |
| NSPhotoLibraryUsageDescription | PHPicker profil / kalori / sağlık belgesi — tam kütüphane yok |
| NSBluetoothAlwaysUsageDescription | Daily WebRTC sesi Bluetooth kulaklığa |
| NSBluetoothPeripheralUsageDescription | Aynı (eski iOS) |
| UIBackgroundModes audio + voip | Seans sürerken kısa süre Home — ses. Gelen VoIP araması / PushKit yok |
| remote-notification | Chat, program, destek, hatırlatma |
| NSPhotoLibraryAddUsageDescription | **Yok** — galeriye kayıt yok |
| NSUserTrackingUsageDescription | **Yok** — reklam / ATT yok |

---

## Smoke (TestFlight’tan kurulan **yeni** IPA)

1. Soğuk açılış → splash → login
2. Üye: panel, mesaj, takvim, sağlık, kalori
3. iOS: **Web’den paket ekle / Planları İncele / Plan Seç / Ödeme Yönetimi** yok; web’den alınmış paket görünür, Portal yok
4. Daily: önizleme → katıl → Home → kamera durur (Apple); ses sürebilir → Ayrıl
5. Bildirim izni → `device_push_tokens` (APNs sonrası arka plan push)
6. Profil **Hesabımı sil** → web `/hesap-silme` (uygulama içinden başlar)
7. Legal: gizlilik / sözleşme linkleri

IAP / RevenueCat / Sign in with Apple yok.
