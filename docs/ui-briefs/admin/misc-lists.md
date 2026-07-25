# Admin Hafif Liste Ekranları — Birleşik UI Brief (Fable 5)

> Kapsam: `content` · `blog` · `analytics` · `ai-costs` · `activity` · `sessions` · `staff` · `payments` · `subscriptions` · `library` · `account`
> LOCK: her ekranın `docs/mobile/screens/admin/*.md` dosyası. Ağır grafik YOK — analitik sade sayı satırları kalır. Tüm aksiyonlar yerel + toast.

## Ortak dil (tüm ekranlar)
- Kart: beyaz, radius 20, cream-200 border; satır min 48; başlıklar `fonts.sansSemi`, sayılar `fonts.displayExtra` brand-700.
- Her listede satır başına 40ms stagger FadeIn; press durumunda cream-100 zemin.
- Ekranda "UI-only", "demo", "bağlama sonrası", ham İngilizce enum/tablo adı **kalmayacak**.
- Rozet paleti: aktif/yayında sage-100/sage-700 · beklemede warm-100/warm-500 · bilgi brand-100/brand-700 · pasif cream-200/cream-800.

## Ekran ekran değişiklikler

### İçerik (`content.tsx`)
- Subtitle "site_content" → **"Site içerikleri"**.
- Ham `kind` etiketi → Türkçe rozet: success_story **"Başarı hikâyesi"** (sage), faq **"SSS"** (brand), tip **"İpucu"** (warm); solda tür ikonu (`trophy`, `help-circle`, `bulb`).
- Karta cream-800 tek satır özet eklenebilir (mevcut title'ı destekler, yeni alan uydurma).

### Blog (`blog.tsx`)
- Karta tarih satırı (createdAt'ten göreli, ör. "Bugün") + durum rozeti: "Yayında" sage / "Taslak" cream.
- Başlık 16pt; solda 40×40 brand-50 kutuda brand-600 `newspaper` ikonu.

### Analitik (`analytics.tsx`)
- Subtitle "Mobil sade metrikler" → **"Platform özeti"**. Grafik eklenmez (LOCK: key numbers first).
- Satırlar DEMO_ADMIN_STATS'tan kalır (Toplam üye / Personel / Açık ticket → **"Açık talep"** / Başvuru); her satıra solda küçük renkli ikon rozeti (overview KPI paletiyle aynı eşleme).
- Satırlar tek beyaz kart içinde hairline ayraçlı gruba alınabilir (tek tek kart yerine) — daha derli.

### AI maliyetleri (`ai-costs.tsx`)
- KPI etiketi "Bu ay tahmini (UI-only)" → **"Bu ay tahmini maliyet"**; KPI kartına gold-400 `sparkles` ikonu.
- Çağrı satırları kalır (Kalori metin / Kalori vision → **"Kalori görsel"** / Sağlık analizi); her satıra sağda ince brand-100 oran çubuğu (128'e normalize, grafik değil dolgu şeridi).

### Aktivite (`activity.tsx`)
- "Premium atama (UI-only)" → **"Demo Üye'ye Vip Paket atandı"**; diğer satırlar kalır.
- Satır başına olay ikonu: giriş `log-in` brand, paket `star` gold-500, destek `chatbubble-ellipses` warm-500; zaman etiketi sağa hizalı 11pt.
- Dikey zaman çizgisi görünümü: ikon kutuları arasında 1px cream-200 çizgi.

### Seanslar (`sessions.tsx`)
- Tür şeridi: kart solunda 3px renk çubuğu — koç brand-400, diyetisyen sage-400 (takvim nokta paletiyle aynı).
- "2 gün · 10:00" → **"2 gün sonra · 10:00"**; sağ üstte "Planlandı" brand rozeti.
- Düzenleme girişi yok (LOCK: düzenleme premium sayfası üzerinden).

### Personel (`staff.tsx`)
- Ham "coach · aktif" → rol renkli avatar (mesajlar brief'i paleti) + Türkçe rol (**Koç / Diyetisyen / Doktor**) + "Aktif" sage rozeti.
- Satır altına müsaitlik özeti: availability'den gün sayısı, ör. "Hafta içi müsait" / "Salı, Perşembe müsait" (mevcut veriden türetilir).

### Ödemeler (`payments.tsx`)
- "UI-only — sahte geçmiş yok" meta ve "RevenueCat webhook bağlama sonrası gerçek liste." hint'i kaldırılır.
- DEMO_CLIENTS + plan verisinden 3 gerçekçi satır: "Vip Paket · 6 ay — Demo Üye", "Spor Paketi · 1 ay — Ayşe Yılmaz", "Diyet Paketi · 1 ay — Mehmet Kaya"; sağda `formatTry` tutar + "IAP" brand rozeti; altta göreli tarih.
- Üstte tek özet şeridi: "Bu ay 3 ödeme" (satırlardan türetilir, yeni metrik değil).

### Abonelikler (`subscriptions.tsx`)
- "Aktif ücretli üyelik (demo)" → **"Aktif ücretli üyelik"**.
- İki KPI kartı yan yana (2'li grid): 86 sage `checkmark-circle` ikonlu, 12 warm `time` ikonlu ("7 gün içinde bitiyor" — dikkat rengi).

### Kütüphane (`library.tsx`)
- Subtitle "Egzersiz CRUD shell" → **"Egzersiz kütüphanesi"**.
- Kart: solda 56×56 cream-100 küçük görsel kutusu (`videoPending` → brand-300 `videocam-off` ikonu + "Video bekleniyor" warm rozeti); bodyPart + zorluk rozeti (beginner **"Başlangıç"** sage / intermediate **"Orta"** brand) + konum chip'leri (home **"Ev"**, gym **"Salon"**, office **"Ofis"**).
- "Video yükle (bağlama sonra)" → **"Video yükle"**; toast "Upload bağlama sonrası." → **"Video yükleme yakında aktif olacak."** (info).

### Hesap (`account.tsx`)
- Kart üstüne 56×56 brand-600 avatar (baş harf); "Rol: admin" değeri → **"Yönetici"**.
- Çıkış butonu kalır; üstüne cream-200 hairline ile ayrım. Yeni alan (şifre değiştirme formu vb.) bu fazda eklenmez.

## Durumlar
- Tüm listeler demo veriyle dolu; yalnız library filtre eklenmediği için boş durum gerekmez.
- Toast'lar mevcut Toast bileşeniyle; success sage, info brand tonu.

## Motion
- Ortak: liste stagger FadeIn; ai-costs oran şeridi genişliği 300ms animasyonlu; abonelik KPI sayıları girişte kısa fade.

## Kabul kriterleri
- [ ] 11 ekranın hiçbirinde "UI-only" / "demo" / "bağlama" / ham İngilizce enum görünmüyor.
- [ ] Yeni ekran, alan veya metrik icat edilmedi; tüm değerler mevcut demo verisinden veya ondan türetildi.
- [ ] Analitik ve ai-costs'ta grafik kütüphanesi yok — sadece satır + dolgu şeridi.
- [ ] Renk/radius/font yalnız 02-design-system tokenları; UI tamamen Türkçe.
