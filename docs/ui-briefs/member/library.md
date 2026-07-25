# Video Kütüphanesi — UI Brief (Fable 5)

Kaynak: `app/(member)/library.tsx` · LOCK: `docs/mobile/screens/member/library.md`

## Mevcut durum

Hero + erişim uyarısı + arama + katlanır filtre paneli + thumb'lı liste + video modal çalışıyor; filtre seti web ile uyumlu. Sorunlar: zorluk chip'leri İngilizce ham değer gösteriyor ("beginner/intermediate/advanced" — UI İngilizce yasak; egzersiz adları hariç, onlar LOCK gereği İngilizce kalır), arama her tuşta istek atıyor (debounce yok), hero radius 28, sayfalama sonu yükleme göstergesi yok.

## Hedef kompozisyon (viewport sırası)

1. **Hero** (fotoğraf + brand-900 gradyan, 140px): başlık **Video Kütüphanesi** + alt başlık.
2. **Erişim uyarısı** (yalnız `!fullAccess`): warm-50 bilgi kartı (mevcut string korunur).
3. **Arama satırı**: search ikonu + input (48 yüksek, mevcut) — 300ms debounce.
4. **Filtre toggle**: "Filtreler (n)" + chevron; açılınca **chip grubu**: zorluk ×3 (TR etiket), konum ×3 (Ev/Salon/Ofis), Makine.
5. **Egzersiz satırları**: 64px webp thumb + İngilizce ad (LOCK: çevirme) + bodyPart·zorluk meta + chevron; sonsuz kaydırma, liste sonunda küçük spinner.
6. **Video modal** (bottom sheet): ad + meta → 220px player alanı (signed URL / durum metni) → Kapat.

## Bileşen ve token detayı

- Hero radius **24** (28 değil); başlık Plus Jakarta Extra 26 beyaz; gradyan brand-900 türevi rgba (mevcut).
- Chip: radius full, beyaz + cream-200 border; seçili **sage-600** zemin/beyaz metin (mevcut, doğru); min yükseklik 36, touch alanı ≥44 (dikey padding artır).
- Zorluk etiketleri UI'da TR: beginner→"Başlangıç", intermediate→"Orta", advanced→"İleri" (filtre değeri İngilizce kalır — yalnız görünen etiket).
- Satır: beyaz, radius `radius.xl`, cream-200 border; ad Inter semi 15 cream-900 `numberOfLines={2}`; meta Inter 12 cream-800/0.65.
- Satır meta'sındaki `difficulty` gösterimi de aynı TR map'ten geçer.
- Modal: üst radius **24**; player alanı cream-100 zemin, radius `radius.xl`; kilit mesajı "Oynatma için Spor veya Vip paket gerekli" (mevcut string) yanına kilit ikonu gold-500.
- "Kapat" min yükseklik 48.

## Durumlar

- **Yükleniyor (ilk):** ActivityIndicator brand-600 (mevcut).
- **Boş:** "Sonuç yok" + "Filtreleri temizleyip tekrar deneyin." (mevcut).
- **Sınırlı erişim:** warm-50 uyarı kartı + modalda kilit mesajı; liste önizlemesi açık.
- **video_pending:** thumb placeholder + modalda "Video hazırlanıyor…".
- **Sayfa sonu:** `page < totalPages` iken alt spinner; bittiğinde gizli.

## Motion (Reanimated)

1. Filtre paneli aç/kapa: yükseklik + fade (LayoutAnimation yerine Reanimated `FadeIn/FadeOut` + layout transition).
2. Liste satırları ilk yüklemede kademeli fade (index ×30ms, ilk 8 satırla sınırla).
3. Modal slide-up + backdrop fade (mevcut Modal slide yeterli; player içeriği yüklenince fade).

## Değişiklik listesi

- [ ] Zorluk chip etiketleri ve satır meta gösterimi için TR map: Başlangıç/Orta/İleri (filtre değerleri değişmez).
- [ ] Arama input'una 300ms debounce (`useEffect` + timeout); istek mantığı aynı.
- [ ] `header.borderRadius: 28 → 24`; `modalCard` üst radius `28 → 24`.
- [ ] Sonsuz kaydırma sırasında `ListFooterComponent` spinner (yalnız `loading && page > 1`).
- [ ] Filtre paneline Reanimated giriş/çıkış animasyonu.
- [ ] Chip dikey padding'i touch ≥44 olacak şekilde artır.
- [ ] Egzersiz adları İngilizce kalır (LOCK); signed URL/erişim mantığına dokunulmaz.

## Kabul kriterleri

- [ ] UI'da görünen tüm etiketler Türkçe; egzersiz adları depolandığı gibi İngilizce.
- [ ] Filtre seti web ile aynı; sıralama UI'sı eklenmedi.
- [ ] Renkler token; radius 16–24; touch hedefleri ≥44; Kapat ≥48.
- [ ] Arama yazarken tek istek/300ms; liste sonunda footer spinner görünüyor.
- [ ] Kısıtlı üyelikte liste önizleme + oynatma kilidi davranışı değişmedi; thumb'larda video mount edilmiyor.
