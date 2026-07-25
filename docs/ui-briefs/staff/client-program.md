# Danışan Program Oluşturucu — UI Brief (Fable 5)

Kaynak: `app/(staff)/clients/[id]/program.tsx` · LOCK: `docs/mobile/screens/staff/client-program.md`

**KULLANICI KARARI (kilitli):** Mobilde **SADELEŞTİRİLMİŞ akış** — egzersiz listesi → sepete ekle → set/tekrar bottom sheet → gönder (yerel toast). Web'in tam modal sistemi (CoachProgramSendModal tarih modları, paket pencere uyarıları) bu UI-only fazda **taşınmaz**; LOCK'taki cart entry varsayılanları (amountType `reps`, amount `12`, durationUnit `sn`) aynen kullanılır.

## Mevcut durum
Düz liste + "Ekle" + isim-only sepet + gönder butonu. Eksikler: arama yok, sepet girdisinde set/tekrar yok, egzersiz satırında thumbnail/meta yok, sepet düzenlenemiyor, toast geliştirici dili ("Program gönderildi (UI-only yerel).").

## Hedef kompozisyon (viewport sırası)
1. **PanelScaffold header** (showBack): "Program oluştur" + danışan adı — korunur.
2. **Arama alanı**: "Ara…" placeholder, 48 yükseklik (library paritesi).
3. **Egzersiz listesi** (DEMO_EXERCISES): satır = `ExerciseVideoThumbnail` (48, videoPending) + isim + meta (bodyPart · zorluk TR · Makine) + sağda "Ekle" / eklenmişse sage `checkmark-circle`.
4. **Alt sabit bar (bottom bar)**: sol "Sepet" + adet rozeti; sağ **"Programı Gönder"** primary CTA (sepet boşken pasif).
5. **Sepet bottom sheet** (alt bardan açılır): sepet kartları + gün ataması + gönder.

## Bileşen ve token detayı
- Egzersiz satırı: beyaz, cream-200 border, radius.xl, min 44; zorluk TR etiketleri member library'deki `DIFFICULTY_LABELS` (Başlangıç/Orta/İleri). "Ekle" 13pt `sansSemi` brand-600.
- Alt bar: `rgba(255,255,255,0.94)` zemin, üst border cream-200, safe-area padding; sepet rozeti 20 daire warm-500 zemin/beyaz sayı; CTA min 48.
- **Sepet sheet** (radius üst 24, cream-50 zemin):
  - Sepet kartı (CartEntryCard'ın sade hali): thumb 40 + isim + özet satırı "3 set × 12 tekrar · 60 sn dinlenme" + sağda `trash` (warm-500) ve `pencil` (brand-600).
  - `pencil` → **set/tekrar sheet'i**: Stepper bileşeniyle üç alan — Set (varsayılan 3), Tekrar (varsayılan **12**, LOCK) veya Süre (sn, amountType `reps`↔`duration` segment ile), Dinlenme (sn, varsayılan 60). "Tamam" ile kapanır.
  - **Gün ataması (basit)**: sheet üstünde 7 çip (Pzt…Paz, radius.full, seçili brand-600/beyaz) — girdi başına değil, program geneli; varsayılan "Her gün" davranışı = hiçbiri seçili değilken tüm günler.
  - Sheet altında "Programı Gönder" (sepet CTA ile aynı işlev).
- Gönder: sepet boş → toast **"En az bir hareket ekleyin"** (LOCK, birebir). Başarı toastı: "Program gönderildi (UI-only yerel)." → **"Program {danışan adı} adlı danışana gönderildi."** (success); sepet temizlenir, sheet kapanır.

## Durumlar (boş / dolu / hata / kilitli)
- **Sepet boş**: alt bar rozeti gizli, CTA %45 opaklık pasif; sheet açılırsa EmptyState satırı "En az bir hareket ekleyin".
- **Dolu**: rozet adedi, satırlarda checkmark.
- **Arama sonuçsuz**: EmptyState "Sonuç yok" / "Filtreleri temizleyip tekrar deneyin." (library paritesi).
- **Kilitli**: dietitian bu route'a giremez (LOCK) — shell yönlendirmesi, ekranda ek UI yok.

## Motion
1. "Ekle" basışında satır ikonu checkmark'a scale-pop ile döner; alt bar rozeti bounce (scale 1→1.25→1).
2. Sepet/set-tekrar sheet'leri: slide-up + backdrop fade (~250ms, Reanimated).
3. Sepetten silmede satır fade+height collapse.

## Değişiklik listesi
- [ ] Arama alanı ekle (isimde filtre, DEMO_EXERCISES).
- [ ] Egzersiz satırına thumbnail + meta + eklenmiş durumu.
- [ ] Alt sabit bar: sepet rozeti + "Programı Gönder".
- [ ] Sepet bottom sheet: kart listesi, sil, düzenle.
- [ ] Set/tekrar/dinlenme sheet'i (Stepper; varsayılan 12 tekrar korunur).
- [ ] Basit gün çipleri (program geneli).
- [ ] Boş sepet toastı "En az bir hareket ekleyin" (buton pasif olsa da sheet içinden tetiklenebilir); başarı toastını kullanıcı-dostu yap.

## Kabul kriterleri
- [ ] Akış: liste → sepet → set/tekrar sheet → gönder → yerel toast; web modal sistemi YOK.
- [ ] Varsayılanlar LOCK'a uygun: amount 12, amountType reps, durationUnit sn.
- [ ] "En az bir hareket ekleyin" birebir; "UI-only" ifadesi kullanıcıya görünmüyor.
- [ ] Yeni egzersiz alanı/ekran uydurulmamış; yalnız DEMO_EXERCISES alanları.
- [ ] Tüm renkler token; mor yok; CTA ≥48, sheet radius ≤24.
