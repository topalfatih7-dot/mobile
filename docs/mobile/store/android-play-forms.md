# Google Play — politika form şablonu (sen doldurursun)

Kaynak: gizlilik / KVKK / sağlık metinleri (`appendices/D-legal-slugs.md`). Uydurma veri türü yok.

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

## Content rating (IARC)

Anket: sağlık/fitness, kullanıcı üretimi mesaj, şiddet/kumar yok. Beklenen ~12+ / PEGI eşdeğeri — anket sonucu geçerli.

## Hedef kitle

18+ (sağlık koçluğu). Çocuklara yönelik değil. Families Policy’ye girme.

## Ads

Hayır.

## Financial features

Uygulama içi ödeme yok. Abonelik **web Stripe**. Play ürünü oluşturma.

## Health

Sağlık ve Fitness. Tıbbi cihaz değil. Sorumluluk reddi web’de: `/saglik-sorumluluk-reddi`.

## Foreground services

Play **Uygulama içeriği → Ön plan hizmeti izinleri**. İzin AAB’de varsa form zorunlu.

**Video bağlantısı kutusuna metin yapıştırma.** Oraya yalnızca herkese açık / gizli YouTube (veya incelemenin açabildiği Drive) URL’si. Açıklama ayrı kutuya.

Aynı YouTube videosu kamera + mikrofon için kullanılabilir. Medya oynatma ayrı video.

Demo’yu Daily FGS’li `play-store` AAB’de çek (önceki sohbet: servis + Android’de otomatik kamera kapatma). Eski AAB’de Home’da kamera düşebilir; inceleme reddeder.

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

### Media playback (`FOREGROUND_SERVICE_MEDIA_PLAYBACK`)

**Görev:** yalnız **Medya oynatma**. **Pencere içinde pencere gösterme işaretleme** (sistem PiP açık değil). Diğer işaretleme.

**İşlev açıklaması:**

```
Üye egzersiz kütüphanesinde koç hareket videolarını native oynatıcıyla izler (expo-video). Android medya oynatma ön plan hizmeti, kullanıcı videoyu başlattıktan sonra tam ekran / kısa süre uygulama dışına çıkınca oynatmanın kesilmemesi içindir. Kullanıcı videoyu uygulama içinden başlatır. Görüntülü seans bu izinle yapılmaz (kamera + mikrofon FGS).
```

**Ertelenir / kesilirse kullanıcı etkisi:**

```
Hareket videosu duraklar. Kullanıcı kütüphaneye dönünce yeniden oynatır.
```

**Demo video:** Giriş → Hareket kütüphanesi → bir hareket aç → video oynasın → Home veya tam ekran → (varsa) medya bildirimi → uygulamaya dön.

## Photos and videos

Android 13+: sistem seçici. Amaç: profil, kalori foto, sağlık belgesi. Fotoğraf galerisinin tamamına sürekli erişim yok.

## Government / News

Hayır.

## App access (inceleme)

Üye test hesabı ver. Giriş: e-posta/şifre (Google/Apple kapalı).

## Hesap silme (Play)

Play: “Hesap silme URL’si” → `https://www.yeniform.com/hesap-silme`

Self-servis: giriş + şifre + onay. Stripe paketleri hemen kapanır (iade yok). Personel/admin: `info@yeniform.com`.

Mobilde native silme formu yok; profil **Hesabımı sil** web’e gider.

## Privacy policy URL

https://www.yeniform.com/legal/gizlilik-politikasi
