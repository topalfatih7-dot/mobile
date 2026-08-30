# App Store Connect — politika / form şablonu (sen doldurursun)

Kaynak: gizlilik / KVKK / sağlık (`appendices/D-legal-slugs.md`) + Play [`android-play-forms.md`](android-play-forms.md) + [`play-data-safety.csv`](play-data-safety.csv). Uydurma veri türü yok. IAP ürünü **oluşturma**. **Onaysız eas build yok.**

ASC: Uygulama → App Privacy / Age Rating / App Review Information. Metinleri kopyala-yapıştır.

---

## App Privacy (Nutrition Labels)

Reklam SDK yok. ATT yok. Tracking **No**.

Üst sorular:

| Soru | Cevap |
|------|--------|
| Do you or your third-party partners collect data? | **Yes** |
| Used for tracking? | **No** |
| Privacy policy URL | `https://www.yeniform.com/legal/gizlilik-politikasi` |

Hesap silme (App Privacy notu + inceleme): `https://www.yeniform.com/hesap-silme`  
Uygulama: Profil → **Hesabımı sil** (5.1.1(v) uygulama içinden başlar; native form yok).

Her tür: **Linked to User** = evet (hesaba bağlı), **Used for Tracking** = hayır, **Purpose** = App Functionality (± Account Management iletişim için). Purchase History / Payment Info **işaretleme** (IAP yok; kart Stripe **web**).

| Apple türü | Toplanır | Üçüncü tarafla paylaşılır | Play CSV eş | Amaç |
|------------|----------|---------------------------|-------------|------|
| Contact Info → Name | Evet | Hayır (barındırma) | PSL_NAME | Hesap |
| Contact Info → Email Address | Evet | Hayır | PSL_EMAIL | Hesap |
| Contact Info → Phone Number | Evet | Hayır | PSL_PHONE | Hesap |
| Identifiers → User ID | Evet | Hayır | PSL_USER_ACCOUNT | Hesap |
| Identifiers → Device ID | Evet (push token) | Expo Push (gönderim) | PSL_DEVICE_ID | Bildirim |
| Health & Fitness → Health | Evet | Hayır | PSL_HEALTH | Uygulama |
| Health & Fitness → Fitness | Evet | Hayır | PSL_FITNESS | Uygulama |
| Photos or Videos → Photos | Evet | Hayır | PSL_PHOTOS | Profil / kalori / belge |
| Photos or Videos → Videos | Evet (kütüphane uzman videosu; kullanıcı galeriden video yüklemez) | Hayır | PSL_VIDEOS | Uygulama |
| Audio Data → Audio | Evet (canlı Daily; kayıt dosyası yok) | Daily.co (seans iletimi) | PSL_AUDIO | Görüşme |
| Other Data → Other User Content | Evet (1:1 mesaj) | Hayır (atanmış uzman / sistem) | PSL_OTHER_MESSAGES | Mesajlaşma |
| Sensitive Info | Hayır (ırk/siyaset yok) | — | — | — |
| Location | Hayır | — | — | — |
| Contacts / Calendar | Hayır | — | — | — |
| Purchases / Payment Info | **Hayır** | Stripe yalnız web | purchase history **işaretleme** | — |
| Advertising Data / IDFA | Hayır | — | AD_ID yok | — |

Şifreleme: transit HTTPS. Daily ses/görüntü geçici (ephemeral) — kalıcı seans kaydı yok.

---

## Yaş derecesi (Age Rating)

Apple anketi (4+ / 9+ / 12+ / 17+ üretir). Beklenen **12+**. Hedef kitle yine **18+**. Kids Category **hayır**. Metadata’da “çocuklar için” yok.

| Soru (özet) | Cevap |
|-------------|--------|
| Cartoon / fantasy violence | None |
| Realistic violence | None |
| Sexual content / nudity | None |
| Profanity or crude humor | None |
| Horror / fear themes | None |
| Medical / treatment information | **Infrequent/Mild** (sağlık testi, koçluk; teşhis iddiası yok) |
| Alcohol, tobacco, drugs | None |
| Simulated gambling | None |
| Unrestricted web access | No (in-app tarayıcı yalnız yasal / Stripe Portal / hesap silme) |
| Gambling / contests | None |
| Mature / suggestive themes | None |
| Horror | None |
| Guns / weapons | None |

---

## Sağlık

Tıbbi cihaz / FDA / CE **hayır**. HealthKit **yok**. Kamera tıbbi ölçüm **yok** — yalnız seans + kalori/profil foto.

**Listing’e yapıştır:**

```
Bu uygulama tıbbi cihaz değildir; herhangi bir hastalığı teşhis, tedavi, iyileştirme veya önleme iddiası taşımaz. Tıbbi tavsiye, teşhis veya tedavi için bir sağlık uzmanına danışın.
```

Tam metin: `https://www.yeniform.com/legal/saglik-sorumluluk-reddi`

---

## Kullanıcı içeriği (1.2)

1:1 atanmış koç / diyetisyen / doktor. Herkese açık feed yok. Şikayet/engelle UI yok (web parity) — Destek / `info@yeniform.com`.

```
Kullanıcı içeriği yalnız atanmış uzmanla özel mesajdır; herkese açık paylaşım yok. Kayıtta üyelik sözleşmesi ve gizlilik kabul edilir. İlk mesajdan önce mesajlaşma bilgilendirmesi onaylanır. Telefon/e-posta paylaşımı otomatik engellenir. İtiraz veya kötüye kullanım Destek Merkezi veya info@yeniform.com ile iletilir; personel ve admin thread’i kapatabilir. Hedef kitle 18+.
```

Topluluk: `https://www.yeniform.com/legal/topluluk-kurallari`

---

## Ödeme (3.1.1 / 3.1.3)

**IAP yok.** iOS binary’de `/plans` / `/membership` satın alma CTA **yok**.

Savunma: 3.1.3(f) companion + 1:1 seans 3.1.3(d). Web’den alınmış üyelik e-posta/şifre ile açılır. iOS’ta iptal/kart / Stripe Portal UI yok (2026-08-22).

Listing: “Uygulama içi satın alma yoktur. Üyelik yeniform.com üzerinden.”

---

## Sign in with Apple

Gerekmez. Yalnız e-posta/şifre. Sosyal giriş kapalı.

## Şifreleme

`ITSAppUsesNonExemptEncryption: false`. Konsol: standard encryption exemption.

## Reklam / ATT

Hayır. `NSUserTrackingUsageDescription` yok.

## Telif / içerik hakları

Egzersiz videoları ve program içeriği Yeni Form / uzman kadrosu. Üçüncü taraf müzik yok.

Copyright (listing): `© 2026 Yeni Form`

---

## Demo / App Review hesabı

Giriş: e-posta/şifre. Şifre inceleme bitene kadar sabit. Üye; staff ayrı.

Seans yoksa not: join penceresi koç 10 dk önce / 20 dk sonra; token yalnız `scheduled`.

---

## İnceleme notu (kopyala)

```
Yeni Form, yeniform.com web hizmetinin iOS companion uygulamasıdır (Guideline 3.1.3(f)). Dijital üyelik App Store I’da satılmaz; uygulamada satın alma butonu, harici checkout CTA’sı, Ödeme Yönetimi ve StoreKit yoktur. Web’den alınmış üyelik e-posta/şifre ile açılır. Stripe iptal/kart iOS’ta yok; ileride tasarlanır.

1:1 koç, diyetisyen veya doktor görüntülü seansı Daily.co WebRTC ile yapılır. UIBackgroundModes voip + audio yalnız bu seansın sesinin kısa süre arka planda sürmesi içindir. PushKit gelen arama yoktur; kullanıcı takvimden katılır. iOS’ta arka planda kamera kapalıdır.

Hesap silme: Profil → Hesabımı sil → https://www.yeniform.com/hesap-silme (uygulama içinden başlar).

Gizlilik: https://www.yeniform.com/legal/gizlilik-politikasi
Sözleşme: https://www.yeniform.com/legal/uyelik-ve-abonelik-sozlesmesi
Sağlık reddi: https://www.yeniform.com/legal/saglik-sorumluluk-reddi

Demo: e-posta/şifre (aşağı). Sosyal giriş yok.
```

Demo satırını kendi test hesabınla doldur.

## Privacy policy URL

https://www.yeniform.com/legal/gizlilik-politikasi

Uygulama içi: kayıt/giriş yasal linkleri + `/(public)/legal/*`.
