# Android — Play Store yayını (AAB)

Kod tarafı hazır. **EAS build / Play yükleme / Submit yalnız sen onaylayınca.**

Paket: `com.yeniform.app`  
Profil: `eas.json` → `play-store` → AAB (`app-bundle`), `distribution: store`, env **preview**  
EAS: owner `yeniforms-team`, `extra.eas.projectId` = `460ad8b4-c94a-4933-885c-be703befe489`

Ödeme: uygulama içi IAP **yok**. Satın alma web Stripe. Play’de abonelik ürünü oluşturma.

FCM: kökte `google-services.json` (git’e girmez). Canlı arka plan bildirimi **yeni EAS AAB** + Play App Signing SHA-1 Firebase’de olmadan gelmez.

---

## Senin işin (sıra)

### 1. Play Console uygulaması

1. [Google Play Console](https://play.google.com/console) → uygulama yoksa oluştur.
2. Paket adı: `com.yeniform.app` (binary ile birebir).
3. Varsayılan dil: Türkçe. Kategori: Sağlık ve Fitness.

### 2. EAS AAB (onayınla, Metro yok)

```bash
npm run eas:preview-env          # EXPO_PUBLIC_* preview env’de yoksa
npm run build:play:android
```

Bitince expo.dev’den **`.aab`** indir (APK değil).

Telefonda sideload **Yeni Form** (`com.yeniform.app`) varsa **sil** — Play imzası farklıdır.

### 3. Closed / Internal testing’e yükle

- AAB’yi **Internal testing** veya **Closed testing** track’ine yükle.
- Tester e-postaları ekle; opt-in linkini paylaş (sideload APK sayılmaz).
- Kişisel Play hesabı (Kas 2023+): herkese açık yayın için konsol **Closed testing + 12 tester / 14 gün** isteyebilir. Organizasyon hesabı muaf olabilir — kendi Dashboard’una bak.

İsteğe bağlı (ayrı onay): `npm run submit:play:android` → Internal track, **incelemeye göndermez**.

### 4. Firebase SHA (push)

Play Console → Test and release → App integrity / App signing:

1. **App signing key** SHA-1 ve SHA-256 kopyala.
2. [Firebase](https://console.firebase.google.com/) → yeniform-aa5c1 → Android `com.yeniform.app` → SHA ekle.
3. Onayınla **ikinci** `npm run build:play:android` ve Play’e yeni AAB.

### 5. Mağaza listing (metin hazır)

Kopyala: [`android-listing.tr.md`](android-listing.tr.md)

- Feature graphic: [`assets/store/google-play-feature-graphic.png`](../../../assets/store/google-play-feature-graphic.png) (1024×500)
- Uygulama ikonu: Play AAB’den gelir; yüksek çözünürlük için [`assets/icon.png`](../../../assets/icon.png)
- Screenshot: telefonda 1080×1920 veya 1080×2340 — [`screenshot-checklist.md`](screenshot-checklist.md)

### 6. Politika formları

Kopyala: [`android-play-forms.md`](android-play-forms.md)

- Data safety, IARC, FGS, sağlık, reklam yok
- **Hesap silme URL:** Google zorunlu. Mobilde ekran yok. Web’de silme/talep sayfası yoksa Submit **blok**. URL’yi Play’e yapıştır; yoksa web’e eklet.

### 7. İnceleme hesabı

Play “App access” için: 1 üye e-posta/şifre (ve personel test edeceksen staff). Şifreyi inceleme süresi boyunca değiştirme.

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
4. Bildirim izni → `device_push_tokens` (2. AAB + SHA sonrası arka plan push)
5. Play Console’da 16 KB uyarısı yok

IAP / RevenueCat yok.
