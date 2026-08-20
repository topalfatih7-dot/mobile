# Android — Play Store **test** yayını (AAB)

Sideload / preview APK **yok**. Test kurulumu yalnız Play Internal veya Closed opt-in.

Paket: `com.yeniform.app`  
Profil: `eas.json` → `play-store` → AAB (`app-bundle`), `distribution: store`, env **preview**  
EAS: owner `yeniforms-team`, `extra.eas.projectId` = `460ad8b4-c94a-4933-885c-be703befe489`

Ödeme: uygulama içi IAP **yok**. Satın alma web Stripe. Play’de abonelik ürünü oluşturma.

FCM: kökte `google-services.json` (git’e girmez). Arka plan push: bu AAB + Expo **FCM V1** + Firebase SHA (EAS upload + Play **App signing key**). Gradle yok.

**Onaysız `eas build` / Submit yok.**

---

## Senin işin (sıra)

### 1. Play Console uygulaması

1. [Google Play Console](https://play.google.com/console) → uygulama yoksa oluştur.
2. Paket adı: `com.yeniform.app` (binary ile birebir).
3. Varsayılan dil: Türkçe. Kategori: Sağlık ve Fitness.

### 2. Push konsol (AAB’den önce veya ilk Internal ile paralel)

1. Firebase `yeniform-aa5c1` → Android `com.yeniform.app` → EAS SHA ( [`SETUP_REQUIRED.md`](../../../SETUP_REQUIRED.md) §3 ).
2. FCM V1 JSON → [Expo Credentials](https://expo.dev/accounts/yeniforms-team/projects/yeniform/credentials) (`SETUP_REQUIRED.md` §4).
3. Play’e ilk AAB gittikten sonra: App integrity → **App signing key** SHA-1/256 → aynı Firebase uygulamasına ekle (upload key değil). SHA eklemek binary’yi yenilemez.

### 3. EAS AAB (yalnız açık onay)

Sorunlar kilitlenince, onayınla:

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

Kopyala: [`android-listing.tr.md`](android-listing.tr.md)

- Feature graphic: [`assets/store/google-play-feature-graphic.png`](../../../assets/store/google-play-feature-graphic.png) (1024×500)
- Yüksek çözünürlük ikon: [`assets/store/google-play-icon-512.png`](../../../assets/store/google-play-icon-512.png) (512×512)
- Telefon screenshot: [`assets/store/play-phone/`](../../../assets/store/play-phone/) — 1080×2160 (Play 2:1). Sıra: [`screenshot-checklist.md`](screenshot-checklist.md)

### 6. Politika formları

Kopyala: [`android-play-forms.md`](android-play-forms.md)

- Data safety CSV: [`play-data-safety.csv`](play-data-safety.csv)
- IARC, FGS, sağlık, reklam yok
- **Hesap silme URL:** `https://www.yeniform.com/hesap-silme` (canlı)

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
| RECORD_AUDIO + MICROPHONE | Görüntülü seans |
| POST_NOTIFICATIONS | Chat, program, destek, hatırlatma |
| BLUETOOTH_CONNECT | Daily ses yönlendirme |
| FGS camera / microphone | Görüşme sürerken arka plan medya |
| FGS mediaPlayback | Egzersiz videosu / ses |
| AD_ID | **Yok** — `blockedPermissions` |

Galeri: Android 13+ sistem Photo Picker (geniş `READ_MEDIA` yok).

---

## Smoke (Play’den kurulan AAB)

1. Soğuk açılış → splash → login
2. Üye: panel, mesaj, takvim, sağlık, kalori, **Web’den satın al / yönet**
3. Daily join (kamera/mic)
4. Bildirim izni → `device_push_tokens` (FCM V1 + SHA sonrası arka plan push)
5. Play Console’da 16 KB uyarısı yok

IAP / RevenueCat yok.
