# Android — Play Store **test** yayını (AAB)

Sideload / preview APK **yok**. Test kurulumu yalnız Play Internal veya Closed opt-in.

Paket: `com.yeniform.app`  
Profil: `eas.json` → `play-store` → AAB (`app-bundle`), `distribution: store`, env **preview**  
EAS: owner `yeniforms-team`, `extra.eas.projectId` = `460ad8b4-c94a-4933-885c-be703befe489`

Ödeme: uygulama içi IAP **yok**. Satın alma web Stripe. Play’de abonelik ürünü oluşturma.

FCM: kökte `google-services.json` (git’e girmez). Arka plan push: bu AAB + Expo **FCM V1** + Firebase SHA (EAS upload + Play **App signing key**). Gradle yok.

**Onaysız `eas build` / Submit yok.**

---

## Teknik (Expo SDK 56 + Play 2026)

Kaynak: [Expo SDK 56](https://docs.expo.dev/versions/v56.0.0/), [Play target API](https://support.google.com/googleplay/android-developer/answer/11926878), [16 KB pages](https://developer.android.com/guide/practices/page-sizes), [EAS Submit Android](https://docs.expo.dev/submit/android/).

| Madde | Durum |
|-------|--------|
| `targetSdkVersion` / `compileSdkVersion` | SDK **56** varsayılan **API 36** (Play 31 Ağu 2026) |
| `minSdk` | Android 7+ (SDK 56) |
| 16 KB sayfa | SDK 56 + RN 0.85; native Daily/WebRTC AAB sonrası Play App bundle explorer |
| Paket formatı | Yalnız **AAB** (`play-store`); APK mağazaya gitmez |
| FGS AAB’de | Daily `camera\|microphone` + kalıcı “Görüşme devam ediyor” |
| FGS **yok** | `MEDIA_PLAYBACK` (`expo-audio` yok), `MEDIA_PROJECTION` (blocked; Webrtc servisi silinir) |
| `BOOT_COMPLETED` | Yok — Play Android 15 boot+FGS tarayıcısı; habit DATE açılışta yeniden kurulur |
| Bildirim sesi | OS `default` (`yeniform-alerts-v3`); web wav yok |
| Galeri | Android 13+ Photo Picker; `READ_MEDIA_*` blocked |
| Reklam ID | `AD_ID` blocked |
| Yön | `orientation: default` + `resizeableActivity=true` (API 36 büyük ekranda kilit yok) |
| Bildirim ikonu | Beyaz glif, şeffaf zemin (`assets/notification-icon.png`) |

Önceki Internal AAB `1.0.1` / versionCode **5–6** bu Android 15 + OS ses düzeltmesini **içermez**. Test için **yeni** `play-store` AAB gerekir (onayınla `npm run build:play:android`).

---

## Senin işin (sıra)

### 1. Play Console uygulaması

1. [Google Play Console](https://play.google.com/console) → uygulama yoksa oluştur.
2. Paket adı: `com.yeniform.app` (binary ile birebir).
3. Varsayılan dil: Türkçe. Kategori: Sağlık ve Fitness.
4. Gizlilik: `https://www.yeniform.com/legal/gizlilik-politikasi`

### 2. Push konsol (AAB’den önce veya ilk Internal ile paralel)

1. Firebase `yeniform-aa5c1` → Android `com.yeniform.app` → EAS SHA ([`SETUP_REQUIRED.md`](../../../SETUP_REQUIRED.md) §3).
2. FCM V1 JSON → [Expo Credentials](https://expo.dev/accounts/yeniforms-team/projects/yeniform/credentials) (`SETUP_REQUIRED.md` §4).
3. Play’e ilk AAB gittikten sonra: App integrity → **App signing key** SHA-1/256 → aynı Firebase uygulamasına ekle (upload key değil). SHA eklemek binary’yi yenilemez.

### 3. EAS AAB (yalnız açık onay)

```bash
npm run eas:preview-env          # EXPO_PUBLIC_* preview env’de yoksa
npm run build:play:android
```

Bitince expo.dev’den **`.aab`** indir (APK değil).

Telefonda sideload **Yeni Form** varsa **sil** — Play imzası farklıdır.

### 4. Internal / Closed testing

- AAB’yi **Internal testing** veya **Closed testing** track’ine yükle.
- Tester e-postaları + **opt-in** linki (sideload sayılmaz).
- Kişisel Play hesabı (Kas 2023+): herkese açık yayın için konsol **Closed testing + 12 tester / 14 gün** isteyebilir.

İsteğe bağlı (ayrı onay): `npm run submit:play:android` → Internal track, **incelemeye göndermez**. Play API servis hesabı Expo’da yoksa AAB’yi konsoldan elle yükle.

### 5. Mağaza listing (metin hazır)

Kopyala: [`android-listing.tr.md`](android-listing.tr.md) — tıbbi cihaz uyarısı dahil.

- Feature graphic: [`assets/store/google-play-feature-graphic.png`](../../../assets/store/google-play-feature-graphic.png) (1024×500)
- Yüksek çözünürlük ikon: [`assets/store/google-play-icon-512.png`](../../../assets/store/google-play-icon-512.png) (512×512)
- Telefon screenshot: [`assets/store/play-phone/`](../../../assets/store/play-phone/) — 1080×2160, **01–06** (07 kopya, yükleme)

### 6. Politika formları

Kopyala: [`android-play-forms.md`](android-play-forms.md)

- Data safety CSV: [`play-data-safety.csv`](play-data-safety.csv)
- IARC, Health apps, FGS camera+mic, Photo Picker, reklam yok, finansal IAP yok
- **Hesap silme URL:** `https://www.yeniform.com/hesap-silme`

### 7. İnceleme hesabı

Play “App access”: 1 üye e-posta/şifre (personel test edeceksen staff). Şifreyi inceleme süresi boyunca değiştirme.

### 8. Production Submit (ayrı onay)

Closed test eşiği bittiyse Production → **Submit for review**.

Stripe ile dijital üyelik Google tarafından reddedilebilir; IAP eklenmez.

---

## Play izin gerekçeleri (App content)

| İzin / FGS | Neden |
|------------|--------|
| CAMERA | Görüntülü seans (Daily) + kalori / profil foto |
| RECORD_AUDIO | Görüntülü seans |
| POST_NOTIFICATIONS | Chat, program, destek, hatırlatma |
| BLUETOOTH_CONNECT | Daily ses yönlendirme |
| WAKE_LOCK | Görüşme sırasında cihaz uyutmasın |
| FGS camera / microphone | Seans sürerken Home — arka plan kamera + mik |
| FGS mediaPlayback / mediaProjection | **Yok** — blocked |
| READ_MEDIA_* | **Yok** — Photo Picker |
| AD_ID | **Yok** — `blockedPermissions` |

---

## Smoke (Play’den kurulan **yeni** AAB)

1. Soğuk açılış → splash → login
2. Üye: panel, mesaj, takvim, sağlık, kalori, **Web’den satın al / yönet**
3. Daily: önizleme → katıl → **Home** → bildirim “Görüşme devam ediyor” → karşı taraf görüntü+ses alır → Ayrıl
4. Bildirim izni → `device_push_tokens` (FCM V1 + SHA sonrası arka plan push)
5. Play Console: target API 36, 16 KB uyarısı yok, FGS yalnız camera+microphone
6. Bildirim: telefonun kendi zili (web wav değil; yarıda kesilmez)

IAP / RevenueCat yok.
