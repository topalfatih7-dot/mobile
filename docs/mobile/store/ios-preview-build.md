# iOS preview build (ad hoc / internal)

Bu dosya, Yeni Form **iOS test IPA** alma ve kurma sürecidir. App Store / TestFlight yayını değildir.

Komut (yalnızca kullanıcı onayından sonra): `npm run build:preview:ios`  
Profil: `eas.json` → `preview` → `distribution: internal`, `ios.simulator: false`  
Bundle ID: `com.yeniform.app`  
EAS proje: owner `yeniform`, `extra.eas.projectId` = `0799a1b3-4e0a-4d73-9961-918878977fbb`

**Build alma.** Kullanıcı açıkça demeden `eas build` / `npm run build:preview:ios` çalıştırma.

---

## Ne üretilir?

EAS bulutta **gerçek iPhone’a kurulan `.ipa`** üretir. Windows’ta Xcode / Mac gerekmez; derleme Expo sunucusunda olur.

Bu profil **simülatör IPA’sı değildir**. Simülatör çıktısı yalnızca Mac’te açılır, telefona kurulmaz.

Kurulum: expo.dev build sayfasındaki **Install** linki / QR. `expo start` yok — Android preview APK gibi standalone.

---

## Android ile fark (kritik)

| | Android preview APK | iOS preview IPA |
|--|---------------------|-----------------|
| Kim kurar? | Bilinmeyen kaynak izni olan neredeyse her Android | Yalnızca **o build’in anındaki** kayıtlı iPhone’lar |
| Cihaz kaydı | Yok | `eas device:create` (UDID) **build’den önce** |
| Link | Linki olan indirir | Linki herkes açabilir; iOS, UDID profilde yoksa **kurulumu reddeder** |
| Yeni telefon | Aynı APK kurulur | Yeni cihaz → yeni build veya `eas build:resign` |

Tek iPhone kaydedip build alırsan **o IPA’yı pratikte yalnız o telefon kurar.** Bu “link şifresi” değil; Apple **ad hoc provisioning** kuralı.

---

## Önkoşullar

### 1. Ücretli Apple Developer Program

[developer.apple.com/programs](https://developer.apple.com/programs/) — yıllık üyelik. Ücretsiz Apple ID ile imzalı IPA gerçek cihaza kurulamaz.

İlk `eas build` sırasında terminal Apple hesabına giriş ister. EAS’e bırak:

- Credentials’ı EAS yönetsin mi? → **Evet**
- Push Notifications kurulsun mu? → **Evet** (APNs key)

EAS üretir (elle Certificate/Profile oluşturmana gerek yok):

| Credential | Ne işe yarar |
|------------|----------------|
| Distribution Certificate | IPA imzası (build zamanı) |
| Ad hoc Provisioning Profile | `com.yeniform.app` + izinli UDID listesi |
| APNs key (`.p8`) | iOS remote push (çalışma zamanı). Hesapta en fazla **2** key. |

`.p8` git’e **konmaz**. Expo Push iOS’ta **APNs** kullanır; Android’deki `google-services.json` ile karıştırma.

### 2. En az bir test iPhone — build’den önce

Build cihaz olmadan da **tamamlanır**. IPA’yı kurmak için o telefonun UDID’si profilde olmalıdır.

```bash
eas device:create
```

Çıkan URL / QR’ı **iPhone’da Safari** ile aç; kayıt profilini kur. Bu, cihazı Expo listesine ekler. Apple Developer Portal’a asıl yazılma, cihazın bir provisioning profile’a ilk kez dahil edildiği build (veya resign) anındadır.

**Sıra zorunlu:** cihaz kaydı → **sonra** build. Önce build, sonra telefon kaydı: o IPA o telefona girmez.

Yeni / yenilenmiş Apple üyeliğinde cihaz işlenmesi **24–72 saat** sürebilir; ilk build fail olursa bekle, tekrar al.

Ad hoc limiti: **yılda 100 cihaz** / Apple hesabı.

Cihaz listesi:

```bash
eas device:list
eas device:rename
eas device:delete
```

### 3. EAS preview ortam değişkenleri

Android preview ile aynı; binary’ye gömülür (`npm run eas:preview-env`):

- `EXPO_PUBLIC_SUPABASE_URL`
- `EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY` (veya `ANON_KEY`)
- `EXPO_PUBLIC_API_BASE_URL` = `https://www.yeniform.com`
- `EXPO_PUBLIC_YENIFORM_MOBILE_API_SECRET`
- isteğe bağlı: `EXPO_PUBLIC_DAILY_DOMAIN`

### 4. Firebase iOS dosyası (push istemcisi)

Kökte `GoogleService-Info.plist` (`BUNDLE_ID` = `com.yeniform.app`). Gitignore’da; git’e girmez.

Push’un **gönderimi** Expo + EAS APNs key ile olur. Plist, native Firebase istemcisi içindir. Firebase Console’a ayrıca `.p8` yüklemek (Cloud Messaging → Apple) Expo Push için zorunlu değildir.

FCM dosya adımları: [`SETUP_REQUIRED.md`](../../../SETUP_REQUIRED.md).

---

## Adım adım (onay sonrası)

1. Apple Developer üyeliği aktif.
2. Test iPhone: `eas device:create` tamam.
3. Kullanıcı build onaylar.
4. `npm run build:preview:ios`
5. İlk seferde Apple login + EAS credential / APNs onayları.
6. Bitince [expo.dev](https://expo.dev) → Yeni Form → Builds → **Install**.
7. **Kayıtlı** iPhone’da linki aç, kur.
8. Gerekirse: **Ayarlar → Genel → VPN ve cihaz yönetimi** (veya Profil ve aygıt yönetimi) → geliştiriciyi güven.
9. **Yeni Form** ikonunu aç — Metro / `expo start` yok.

Aynı anda Android: `npm run build:preview:android` (APK; UDID yok). İkisi: `npm run build:preview`.

---

## İkinci / üçüncü iPhone

1. Yeni telefonu `eas device:create` ile kaydet.
2. Eski IPA **yetmez**. Ya:
   - yeni `npm run build:preview:ios`, veya
   - `eas build:resign` (mevcut IPA’yı yeni ad hoc profil ile yeniden imzala; tam rebuild’den kısa).
3. Non-interactive CI’da cihaz listesi güncellenmez; yerel/interactive build veya `--refresh-ad-hoc-provisioning-profile` gerekir.

---

## Kurulum sonrası smoke

1. Soğuk açılış → splash → panel veya welcome.
2. Üye giriş → bildirim izni **İzin Ver**.
3. Supabase `device_push_tokens` satırı (`ExponentPushToken[...]`).
4. Uygulama arkada, personelden mesaj → OS bildirimi.
5. Tap → üye mesaj rotası (`P3-push-test-gate.md`).

---

## Gerekmeyenler (bu tur)

- Mac / Xcode (EAS cloud)
- TestFlight / App Store Connect uygulama kaydı (preview ad hoc)
- Apple Enterprise Program
- Plist veya APNs `.p8` commit
- Gradle / Android snippet

Mağaza yayını ayrı: `production` profili + App Store Connect. Listing: `ios-listing.tr.md`.

---

## Proje durumu (2026-08-17)

Hazır: `eas.json` preview iOS, bundle ID, privacy string’ler, `UIBackgroundModes: remote-notification`, `expo-notifications`, `ITSAppUsesNonExemptEncryption`, `GoogleService-Info.plist` yerelde.

Build öncesi kod (ayrı tur, kullanıcı onayı): `app.config.js` henüz `ios.googleServicesFile` bağlamıyor; `.easignore` plist’i EAS upload’dan hariç tutuyor. IPA yine çıkar; iOS Firebase native bağlanmaz. Push için asıl kapı yine EAS APNs + kayıtlı cihaz.

Kaynak: [Expo internal distribution](https://docs.expo.dev/build/internal-distribution/), [App credentials](https://docs.expo.dev/app-signing/app-credentials/), [Push setup](https://docs.expo.dev/push-notifications/push-notifications-setup/).
