# Admin Başvurular — UI Brief (Fable 5)

> Kaynak: `app/(admin)/applications.tsx` · LOCK: `docs/mobile/screens/admin/applications.md`
> Veri: `DEMO_APPLICATIONS` (kind: staff|corporate|contact; status: pending|reviewed). Onay/ret **yerel state** + toast; `resolveStaffApplication` bağlanmaz.

## Mevcut durum
Üç sekme (Personel / Kurumsal / İletişim) ve kart listesi var. Sorunlar: durum ham İngilizce string ("pending") basılıyor; onayla/reddet aksiyonu hiç yok (LOCK'ta staff approve/reject var); kartlarda tarih ve tür bağlamı zayıf; sekmelerde sayaç yok.

## Hedef kompozisyon (viewport sırası)
1. **Başlık**: "Başvurular" + subtitle "Başvuru kuyruğu" (mevcut, kalır).
2. **Sekmeler**: Personel / Kurumsal / İletişim — her sekmede o türdeki başvuru sayısı rozeti (ör. "Personel · 1").
3. **Başvuru kartları**: ad + durum rozeti üst satırda; altında tür etiketi + göreli tarih ("Bugün").
4. **Personel sekmesinde** pending kartların altında iki buton: **"Onayla"** (primary) + **"Reddet"** (secondary/ghost, warm-500 metin). Kurumsal ve İletişim'de aksiyon butonu eklenmez (LOCK yalnız staff approve/reject tanımlar) — bu sekmelerde kart salt okunur.
5. Boş sekme: mevcut "Bu sekmede başvuru yok." metni `EmptyState` görünümüne taşınır (ikon + metin).

Onayla → durum rozeti yerelde "Onaylandı"ya döner, toast **"Başvuru onaylandı."**; Reddet → "Reddedildi", toast **"Başvuru reddedildi."** Butonlar karar sonrası gizlenir.

## Bileşen ve token detayı
- Sekme: mevcut pill yapısı kalır (seçili brand-600); sayaç, etiketin yanında aynı renkte 11pt.
- Durum rozeti (radius.full, 11pt `fonts.sansSemi`):
  - pending → **"Bekliyor"**: warm-100 zemin, warm-500 metin
  - reviewed → **"İncelendi"**: brand-100 zemin, brand-700 metin
  - onaylandı → sage-100 zemin, sage-700 metin
  - reddedildi → cream-200 zemin, cream-800 metin
- Kart: beyaz, radius 20, cream-200 border; ad `fonts.sansSemi` 15 cream-900; alt satır `fonts.sans` 12 cream-800.
- Aksiyon butonları: yükseklik 44, yan yana eşit genişlik; Onayla brand-600 primary, Reddet beyaz zemin cream-300 border warm-500 metin.
- Boş durum: cream-300 `file-tray-outline` ikonu 32 + mevcut metin.

## Durumlar
- Pending personel kartı: rozet + iki buton görünür.
- Karar verilmiş kart: yalnız rozet; butonlar yok.
- Boş sekme: EmptyState.

## Motion
1. Sekme değişimi: liste fade + translateY 12→0 (~200ms).
2. Karar anı: butonlar fade-out, rozet renk geçişiyle güncellenir; kartta hafif sage-50 flaş (onayda).
3. Toast mevcut Toast bileşeniyle.

## Değişiklik listesi
- [ ] Ham `status` yerine Türkçe rozetler (Bekliyor / İncelendi / Onaylandı / Reddedildi).
- [ ] Personel sekmesine Onayla/Reddet butonları + yerel durum değişimi + toast.
- [ ] Kartlara tür etiketi ve göreli tarih satırı; sekmelere sayaç.
- [ ] Boş sekme metnini EmptyState bileşenine taşı.

## Kabul kriterleri
- [ ] Sekme kimlikleri staff/corporate/contact aynen; yeni sekme/alan yok.
- [ ] Aksiyon yalnız personel başvurularında (LOCK paritesi); karar yereldir, veri katmanına yazılmaz.
- [ ] Ekranda İngilizce string kalmadı; tüm renkler token.
