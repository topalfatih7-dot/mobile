# Staff Kütüphane — UI Brief (Fable 5)

Kaynak: `app/(staff)/library.tsx` · LOCK: `docs/mobile/screens/staff/library.md` · Parite referansı: `app/(member)/library.tsx`

## Mevcut durum
Yalnız 3 düz kart (isim + ham İngilizce meta "beginner/intermediate"). Arama yok, filtre yok, thumbnail yok. Alt başlıkta "(demo)" ibaresi kullanıcıya görünüyor. LOCK: coach için filtreler member library ile parite; dietitian → lists redirect (shell'de).

## Hedef kompozisyon (viewport sırası)
1. **PanelScaffold header**: "Kütüphane" + alt başlık — "Egzersiz seçimi (demo)" → **"Egzersiz kütüphanesi"**.
2. **Arama alanı**: `search` ikonu + "Ara…", 48 yükseklik (member paritesi).
3. **Filtre toggle satırı**: "Filtreler" + aktif sayaç "(n)" + chevron (member paritesi).
4. **Filtre çipleri** (açılır): zorluk (Başlangıç / Orta / İleri) + konum (Ev / Salon / Ofis) + "Makine" — member library ile aynı set; yeni filtre **eklenmez**.
5. **Egzersiz satırları**: `ExerciseVideoThumbnail` (64, videoPending) + isim + TR meta + chevron.

## Bileşen ve token detayı
- Arama/filtre/satır stilleri member library'den birebir alınır: çip radius.full, seçili sage-600/beyaz; satır beyaz, cream-200 border, radius.xl.
- Meta TR: `DIFFICULTY_LABELS` (beginner→Başlangıç, intermediate→Orta, advanced→İleri); `bodyPart` zaten TR (Bacak/Göğüs/Sırt); "Makine" eki korunur. Konum etiketleri: home→Ev, gym→Salon, office→Ofis.
- Filtreleme DEMO_EXERCISES üzerinde yerel (fetch yok — UI-only): arama isimde, çipler `difficulty`/`locations`/`requiresMachine` alanlarında.
- Satır dokunuşu: member'daki video önizleme modalı paritesi — `videoPending: true` olduğundan modalda "Video hazırlanıyor…" durumu görünür (member locked string). Staff'ta paket kilidi/gate kartı **yok** (üyelik gate'i member'a özgü).
- Header'a member'daki görselli hero **eklenmez** (screen LOCK'ta yok; PanelScaffold başlığı yeterli).

## Durumlar (boş / dolu / hata / kilitli)
- **Dolu**: 3 demo egzersiz; filtre daralttıkça canlı liste.
- **Sonuçsuz**: EmptyState "Sonuç yok" / "Filtreleri temizleyip tekrar deneyin." (member paritesi, birebir).
- **Video**: modalda "Video hazırlanıyor…" (videoPending).
- **Kilitli**: dietitian shell redirect'i — ekranda ek UI yok.

## Motion
1. Filtre paneli: FadeIn 180ms / FadeOut 140ms (member paritesi).
2. Satırlar sıralı FadeIn; filtre değişiminde liste yumuşak layout geçişi.
3. Modal: slide-up (mevcut RN Modal animationType paritesi).

## Değişiklik listesi
- [ ] Alt başlıktan "(demo)" ibaresini kaldır → "Egzersiz kütüphanesi".
- [ ] Arama + "Filtreler" toggle + çip seti ekle (member paritesi).
- [ ] Ham İngilizce zorluk değerlerini TR etikete çevir.
- [ ] Satırlara ExerciseVideoThumbnail + chevron ekle.
- [ ] Dokununca video önizleme modalı (member paritesi, videoPending durumu).
- [ ] Sonuçsuz EmptyState ekle.

## Kabul kriterleri
- [ ] Filtre seti member library ile birebir aynı (fazla/eksik çip yok).
- [ ] "(demo)" ve ham İngilizce değer kullanıcıya görünmüyor.
- [ ] "Sonuç yok", "Filtreleri temizleyip tekrar deneyin.", "Video hazırlanıyor…" member locked stringleriyle birebir.
- [ ] Üyelik gate/paket kilidi UI'ı staff ekranına EKLENMEMİŞ.
- [ ] Tüm renkler token; mor yok; arama 48, çipler ≥44.
