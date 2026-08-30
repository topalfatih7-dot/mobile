# Store screenshot checklist

## iPhone

İlk App Store sürümü: **6.7" zorunlu** (1290×2796). iPad yok (`supportsTablet: false`). 6.5" / 5.5" App Store artık zorunlu değil — çekilirse opsiyonel.

| Cihaz | Boyut | Durum |
|-------|-------|-------|
| 6.7" (15/16 Pro Max) | 1290×2796 | ⬜ sen çekeceksin — TestFlight IPA |
| 6.5" | 1284×2778 | ⬜ opsiyonel |
| 5.5" | 1242×2208 | ⬜ gerekmez |

Klasör önerisi (Play `assets/store/play-phone/` gibi): `assets/store/ios-phone/` — sen TestFlight IPA’dan çekeceksin; git’e mock çerçeveli yasak görsel koyma.

Dosya adları (Play ile aynı sıra):

1. `01-panel-saglik-skoru.jpg`
2. `02-panel-takip.jpg`
3. `03-programlarim.jpg`
4. `04-program-takvimi.jpg`
5. `05-hareket-kutuphanesi.jpg`
6. `06-kalori.jpg`

iOS’ta ödemeler / web checkout ekranı **çekme**.

## Android

| Tip | Öneri | Durum |
|-----|-------|-------|
| Feature graphic | 1024×500 — `assets/store/google-play-feature-graphic.png` | ✅ |
| Telefon screenshot | 1080×2160 — `assets/store/play-phone/` | ✅ Play 2:1 |
| Yüksek çözünürlük ikon | 512×512 — `assets/store/google-play-icon-512.png` | ✅ |
| 7" tablet (opsiyonel) | — | ⬜ |

## Ekran önerisi (üye)

Screenshot sırası (Play ve App Store aynı 01–06; Play **07 yükleme**, 01’in kopyası):

1. `01-panel-saglik-skoru.jpg` — panel  
2. `02-panel-takip.jpg` — takip  
3. `03-programlarim.jpg` — programlar  
4. `04-program-takvimi.jpg` — takvim  
5. `05-hareket-kutuphanesi.jpg` — kütüphane  
6. `06-kalori.jpg` — kalori  

iOS’ta satın alma / web checkout ekranı **çekme** (3.1.1). Filigran / mock telefon çerçevesi: mağaza kurallarına uy.
