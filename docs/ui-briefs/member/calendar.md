# Takvim — UI Brief (Fable 5)

## Mevcut durum
Ay ızgarası, gün noktaları, seçili gün detayı ve basit müsaitlik chip'leri çalışıyor. Web `CalendarPage.jsx` ile kıyaslandığında görsel zenginlik ve birkaç durum eksik (aşağıda somut gap listesi).

## Web'e göre eksikler (gap listesi — somut)
1. **Ay istatistiği**: Web header'da "Bu Ay X/Y tamamlandı" + dairesel yüzde göstergesi var; mobilde yok.
2. **Gün hücresi tamamlanma durumları**: Web'de günün tüm görevleri bitince sage check ikonu, kısmi tamamlamada hücre altında mini ilerleme çubuğu; mobilde sadece noktalar var.
3. **Legend**: Web'de takvim altında "Antrenman / Beslenme / Tamamlanan gün" açıklaması; mobilde yok.
4. **Genel boş durum**: Web'de `myPrograms.length === 0` iken kesikli çerçeveli "Henüz program yok" kartı; mobilde hiçbir şey görünmüyor.
5. **Müsaitlik editörü**: Web'de "Antrenman Müsaitliğim" başlıklı açılır kart (alt metin: "X antrenman günü seçili" / "Antrenman yapabileceğiniz gün ve saatleri belirleyin", "Koç programı için" pili, İptal + Kaydet). Mobilde düz "Müsaitlik düzenle" butonu ve yalnızca gün chip'leri; **saat seçimi yok** (WeeklyAvailability parity eksik — gün açılınca '09:00' sabitleniyor).
6. **Gün detayı**: Web'de ilerleme çubuğu + yüzde, "Bugün" rozeti, "Diyet Listesi (n öğün)" / "Koç Programı (n hareket)" bölüm başlıkları, bölüm bazlı boş metinler ("Bu gün için diyet listesi yok" / "Bu gün için antrenman yok"), tamamlanan satırda üstü çizili metin + "Öğün tamamlandı" / "Harika! Bu aktiviteyi tamamladınız." kutlama satırı, egzersizde "İzle" butonu + detay modalı. Mobilde bunların hiçbiri yok; tek boş metin "Bu gün için program kaydı yok."
7. **Kopya farkı**: Header alt metni webde "Koçunuz ve diyetisyeninizin hazırladığı günlük programlar"; mobil "Günlük antrenman ve öğünlerini takip et" — web metnine dön.

## Hedef kompozisyon (viewport sırası)
1. **Header** (PANEL_IMAGES.calendar + koyu gradient): "Program Takvimi" + web alt metni; sağda ay istatistik rozeti (Bu Ay X/Y + yüzde halkası) — yalnız total>0 iken.
2. **Antrenman Müsaitliğim** açılır kartı (web paritesi, madde 5).
3. **Ay navigasyonu + ızgara** tek beyaz kartta; altta legend şeridi (cream-50 zemin).
4. `myPrograms` boşsa: kesikli border boş durum kartı ("Henüz program yok" + açıklama).
5. **Seçili gün detayı**: tarih + "Bugün" rozeti, ilerleme çubuğu, Beslenme ve Antrenman blokları.

## Bileşen ve token detayı
- İstatistik rozeti: `rgba(255,255,255,0.15)` zemin, radius 16; yüzde halkası beyaz stroke; kupa ikonu gold-400.
- Gün hücresi: seçili brand-600 zemin; bugün brand-50 zemin + brand-300 ring; tüm görevler bitti → sage-500 `checkmark-circle` (noktaların yerine); kısmi → 2px brand-400 mini bar.
- Noktalar: workout brand-400, nutrition sage-400 (web tonu).
- Müsaitlik kartı: brand-50/beyaz degrade zemin, brand-100 border; başlık ikonu brand-500 kutuda beyaz `calendar` ikonu; "Koç programı için" pili brand-100 zemin brand-700 metin.
- Tamamlanan satır: sage-50 zemin, başlıkta üstü çizili, altında mint-400 şimşek + kutlama metni.
- İlerleme çubuğu: cream-200 ray, brand-500 dolgu, yükseklik 8, radius.full.

## Durumlar
- **Boş (program yok)**: madde 4 kartı; takvim yine görünür.
- **Boş gün**: bölüm bazlı web metinleri ("Bu gün için diyet listesi yok" vb.).
- **Kilitli**: yok (takvim tüm üyelere açık).
- **Kaydetme**: `saving` iken toggle'lar yoksayılır (mevcut); checkbox %50 opaklık.

## Motion
1. Gün detay kartı: tarih değişince fade + translateY 16→0 (Reanimated).
2. Müsaitlik kartı aç/kapa: yükseklik + opacity animasyonu (~250ms).
3. Tamamlama: check ikonunda scale 0.5→1 spring; ilerleme çubuğu genişliği animasyonlu.

## Değişiklik listesi
- [ ] Header alt metnini web kopyasına çevir; ay istatistik rozetini ekle (monthStats hesabı webdeki gibi).
- [ ] "Müsaitlik düzenle" butonunu web paritesindeki açılır karta dönüştür (başlık, alt metin, pil, İptal/Kaydet).
- [ ] GAP: `docs/mobile/screens/member/calendar.md` — mobil müsaitlikte saat seçimi (WeeklyAvailability) tanımı eksik. Öneri: gün chip'i + saat chip'leri webdeki bileşen paritesiyle eklensin. Durum: needs-user. (Bu brief yalnız gün chip'i görselini parlatır, saat mantığı eklemez.)
- [ ] Gün hücrelerine tamamlandı ikonu + kısmi mini bar; takvim altına legend.
- [ ] `myPrograms` boş durumunda "Henüz program yok" kartı.
- [ ] Gün detayına: ilerleme çubuğu + yüzde, "Bugün" rozeti, bölüm başlıkları (n öğün / n hareket), bölüm boş metinleri, tamamlanan satır stili + kutlama metinleri, egzersiz satırına "İzle" butonu.

## Kabul kriterleri
- [ ] DAY_NAMES, weekStartsOn:1, completionKey/mealCompletion mantığı değişmedi.
- [ ] Toast "Müsaitlik bilgileriniz kaydedildi" aynen; `?avail=1` davranışı korunur.
- [ ] Yeni öğün tipi / ekran / alan icat edilmedi; tüm renkler token.
- [ ] Boş durum metinleri web ile birebir.
