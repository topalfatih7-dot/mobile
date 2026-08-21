# Google Play — politika form şablonu (sen doldurursun)

Kaynak: gizlilik / KVKK / sağlık metinleri (`appendices/D-legal-slugs.md`). Uydurma veri türü yok.

AAB izinleri (2026-08-21): FGS **yalnız kamera + mikrofon** (Daily). `MEDIA_PLAYBACK` / `MEDIA_PROJECTION` **blocked** — o formları doldurma. Eski AAB’de mediaPlayback gördüysen yeni AAB yükle, form kaybolur.

## Data safety (özet)

Play Console **Veri güvenliği** → sağ üst **CSV'yi içe aktar**:
[`play-data-safety.csv`](play-data-safety.csv)
(`assets/store/play-data-safety.csv` aynı dosya).

Reklam SDK’sı yok. `AD_ID` bloklu. Play hesap silme URL: `https://www.yeniform.com/hesap-silme`

| Veri | Toplanır | Paylaşılır | Amaç |
|------|----------|------------|------|
| E-posta, ad, hesap | Evet (Supabase Auth / members) | Hayır (barındırma) | Hesap |
| Sağlık (test, program, öğün) | Evet | Hayır | Uygulama işlevi |
| Foto (profil, kalori, belge) | Evet | Hayır | Uygulama işlevi |
| Mesaj içeriği | Evet | Hayır (atanmış uzman / sistem) | Mesajlaşma |
| Cihaz push token | Evet | Expo Push | Bildirim |
| Ödeme kartı | **Uygulamada yok** | Stripe **web** | Satın alma web’de |
| Konum, rehber, reklam ID | Hayır | — | — |

Şifreleme: transit (HTTPS). Hesap silme: Play’e **web URL** (aşağı).

CSV’de ses/video işaretli: canlı Daily seansı (kayıt dosyası yok) + egzersiz kütüphanesi (uzman içeriği). Kullanıcı galeriden video yüklemez.

## Content rating (IARC)

Anket: sağlık/fitness, kullanıcı üretimi mesaj (atanmış uzman), şiddet/kumar/uyuşturucu yok. Beklenen ~12+ / PEGI eşdeğeri — anket sonucu geçerli. Hedef kitle yine **18+**.

## Hedef kitle

18+ (sağlık koçluğu). Çocuklara yönelik değil. **Designed for Families’e girme.**

## Ads

Hayır.

## Financial features

**Uygulama içi ödeme / Play Billing yok.** Dijital üyelik **web Stripe** (`yeniform.com/plans`). Play’de abonelik ürünü oluşturma.

Konsol: Financial features → uygulama ödeme işlemi sunmuyor / in-app digital goods satılmıyor.

Listing cümlesi zorunlu: “Uygulama içi satın alma yoktur.”

## Health apps (Uygulama içeriği)

Zorunlu. Kaynak: [Health Content and Services](https://support.google.com/googleplay/android-developer/answer/16679511).

| Soru | Cevap |
|------|--------|
| Uygulama sağlık/fitness özelliği sunuyor mu? | Evet — Sağlık ve Fitness |
| Tıbbi cihaz / Medical Device? | **Hayır.** Onay, CE, FDA yok. |
| Health Connect / sağlık izinleri (ACTIVITY_RECOGNITION, BODY_SENSORS, …)? | Hayır |
| Donanım (glikoz ölçer vb.)? | Hayır |
| Kamera ile tıbbi ölçüm (oksimetre vb.)? | Hayır — kamera yalnız seans + kalori/profil foto |
| İnsan araştırması / IRB? | Hayır |
| Contact tracing / resmi sağlık durumu? | Hayır |

**Listing’e yapıştırılan uyarı** (Play: tıbbi cihaz olmayan sağlık uygulaması):

```
Bu uygulama tıbbi cihaz değildir; herhangi bir hastalığı teşhis, tedavi, iyileştirme veya önleme iddiası taşımaz. Tıbbi tavsiye, teşhis veya tedavi için bir sağlık uzmanına danışın.
```

Uygulama içi: sağlık testi onay kutuları + gizlilik/sözleşme (kayıt). Tam metin: `https://www.yeniform.com/legal/saglik-sorumluluk-reddi`

## User-generated content

Mesajlar atanmış koç / diyetisyen / doktor ile **1:1** (herkese açık feed yok). Web’de de ayrı “şikayet/engelle” butonu yok — uydurma UI yok.

Konsol (UGC var mı? **Evet**, özel mesaj):

```
Kullanıcı içeriği yalnız atanmış uzmanla özel mesajdır; herkese açık paylaşım yok. Kayıtta üyelik sözleşmesi ve gizlilik kabul edilir. İlk mesajdan önce mesajlaşma bilgilendirmesi onaylanır. Telefon/e-posta paylaşımı otomatik engellenir. İtiraz veya kötüye kullanım Destek Merkezi veya info@yeniform.com ile iletilir; personel ve admin thread’i kapatabilir. Hedef kitle 18+.
```

Topluluk kuralları: `https://www.yeniform.com/legal/topluluk-kurallari`

## Foreground services

Play **Uygulama içeriği → Ön plan hizmeti izinleri**. Yalnız AAB’de duran tipler.

Bu AAB: **camera + microphone**. Media playback ve media projection **yok** (blocked). Formda çıkarsa yeni AAB yükle; eski `1.0.1` / versionCode 5 mediaPlayback içerebilir.

**Video bağlantısı kutusuna metin yapıştırma.** Yalnız YouTube veya incelemenin açabildiği Drive URL’si. Açıklama ayrı kutu.

Aynı video kamera + mikrofon için. Demo’yu **Daily FGS’li yeni** `play-store` AAB’de çek.

### Camera (`FOREGROUND_SERVICE_CAMERA`)

**Görev:** yalnız **Arka planda kamera görüntü akışı**. Diğer / QR / tarama işaretleme.

**İşlev açıklaması:**

```
Üye ve uzman görüntülü seansı (Daily) sırasında kullanıcı Ana Ekran’a veya başka bir uygulamaya geçse bile görüşme sürer. Kamera görüntüsü karşı tarafa canlı iletilir. Kalıcı bildirim: “Görüşme devam ediyor.” Kullanıcı seansı uygulama içinden başlatır. Gizli kayıt yok. Uygulama içinde başka bir ekrana çıkmak görüşmeyi sonlandırır.
```

**Ertelenir / kesilirse kullanıcı etkisi:**

```
Görüşme görüntüsü karşı tarafa gitmez; seans bozulur. Kullanıcı uygulamaya dönünce kamera yeniden açılır veya görüşmeye yeniden katılır.
```

**Demo video:** Giriş → randevu Katıl → Görüşmeye katıl → Home → bildirim “Görüşme devam ediyor” → karşı cihaz hâlâ görüyor → uygulamaya dön → Ayrıl.

### Microphone (`FOREGROUND_SERVICE_MICROPHONE`)

**Görev:** yalnız **Arka planda ses girişi**. Diğer işaretleme.

**İşlev açıklaması:**

```
Aynı görüntülü seans: kullanıcı Ana Ekran’a veya başka uygulamaya geçse bile mikrofon açık kalır, ses karşı tarafa iletilir. Kalıcı bildirim: “Görüşme devam ediyor.” Kullanıcı seansı uygulama içinden başlatır. Gizli ses kaydı yok.
```

**Ertelenir / kesilirse kullanıcı etkisi:**

```
Karşı taraf sesi duymaz. Kullanıcı uygulamaya dönünce mikrofon yeniden bağlanır.
```

**Demo video:** Kamera videosu ile aynı (Home’da konuş, karşı taraf duysun).

## Photos and videos

[Sensitive permissions](https://support.google.com/googleplay/android-developer/answer/16324062): Android 13+ **sistem Photo Picker**. `READ_MEDIA_IMAGES` / `READ_MEDIA_VIDEO` **blocked**.

Konsol: geniş galeri izni istenmiyor; Photo Picker yeterli.

Amaç: profil, kalori foto, sağlık belgesi. Sürekli galeri erişimi yok.

## Government / News

Hayır.

## App access (inceleme)

Üye test hesabı ver. Giriş: e-posta/şifre (Google/Apple kapalı). Şifreyi inceleme bitene kadar değiştirme.

## Hesap silme (Play)

Play: “Hesap silme URL’si” → `https://www.yeniform.com/hesap-silme`

Self-servis: giriş + şifre + onay. Stripe paketleri hemen kapanır (iade yok). Personel/admin: `info@yeniform.com`.

Mobilde native silme formu yok; profil **Hesabımı sil** web’e gider.

## Privacy policy URL

https://www.yeniform.com/legal/gizlilik-politikasi

Uygulama içi (Play Health): kayıt/giriş yasal linkleri + `/(public)/legal/*`.
