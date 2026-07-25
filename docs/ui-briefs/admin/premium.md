# Admin Premium Yönetimi — UI Brief (Fable 5)

> Kaynak: `app/(admin)/premium.tsx` · LOCK: `docs/mobile/screens/admin/premium.md` (F13)
> Veri: `DEMO_CLIENTS` + `DEMO_STAFF` + `ALL_PLANS`. Kilitli karar: liste → **alt sayfa (bottom sheet) düzenleme**, yerel state + başarı toast'ı. `adminUpdatePremiumMembership` bağlanmaz.

## Mevcut durum
Ekran LOCK'taki "tüm üyeler listesi → satır → EditPremiumModal" akışının yerine tek serbest e-posta alanı + plan butonları koyuyor. Toast metni "vip atandı (UI-only yerel)." geliştirici dili. Üye listesi, süre ve uzman atama alanları hiç yok.

## Hedef kompozisyon (viewport sırası)
1. **Başlık**: "Premium ata" + subtitle **"Üye paketlerini yönet"**.
2. **Üye listesi**: DEMO_CLIENTS'tan tüm üyeler (Basic dahil filtrelenmez — LOCK). Satır: avatar (baş harf), ad, altında `getPlanLabel(membership)` plan rozeti + e-posta; sağda cream-300 chevron.
3. Satıra dokun → **düzenleme bottom sheet** açılır.

### Düzenleme sheet içeriği (yukarıdan aşağı)
1. Grabber + başlık: üye adı; altında mevcut plan rozeti.
2. **Plan** bölümü: `ALL_PLANS` chip'leri (Basic dahil — free'ye düşürme LOCK'ta var); seçili chip brand-600 zemin beyaz metin.
3. **Süre (ay)** bölümü: 1 / 3 / 6 / 12 chip'leri (durationMonths karşılığı).
4. **Uzman atama** bölümü: üç satır — Koç / Diyetisyen / Doktor; her satırda DEMO_STAFF'tan ilgili roldeki isim chip'i + "Atama yok" chip'i (assignedCoachId/DietitianId/DoctorId null karşılığı).
5. **"Paketi güncelle"** primary CTA (min 48) + "Vazgeç" ghost buton.

CTA → sheet kapanır, satırdaki plan rozeti yerel state ile güncellenir, toast: **"{Üye adı} için paket güncellendi."**

## Bileşen ve token detayı
- Satır: beyaz kart radius 20, cream-200 border, min 56; avatar 40×40 brand-100 zemin brand-700 baş harf.
- Plan rozeti: brand-50 zemin brand-700 metin 11pt radius.full; Basic için cream-100/cream-800.
- Sheet: beyaz zemin, üst radius 24, cream-300 grabber (36×4), içerik padding 20, arkada cream-900 %40 scrim.
- Bölüm başlıkları: `fonts.sansSemi` 12 brand-600 uppercase (overview grup stiliyle aynı).
- Chip: min 40, radius.full, cream-200 border; seçili brand-600 zemin/border beyaz metin. Doktor atama chip'i seçiliyken sage-600 kullanma — tüm seçimler brand-600 (tutarlılık).
- CTA: mevcut `Button` primary (brand-600).

## Durumlar
- Liste boş olamaz (demo verisi sabit) — boş durum tasarlanmaz.
- Sheet açıkken seçimler yereldir; "Vazgeç" değişiklikleri atar.
- Aynı üye tekrar açılınca son yerel seçimler görünür (oturum içi kalıcılık).

## Motion
1. Sheet: translateY spring ile açılış (~300ms), scrim fade; kapanışta ters yönde.
2. Chip seçimi: scale 0.96→1 mini spring.
3. Satır plan rozeti güncellenince rozette kısa fade geçişi.

## Değişiklik listesi
- [ ] E-posta TextField + düz plan butonları düzenini kaldır; DEMO_CLIENTS üye listesine dönüştür.
- [ ] Bottom sheet: plan chip'leri + süre chip'leri + üç uzman atama satırı + primary CTA.
- [ ] Toast "vip atandı (UI-only yerel)." → "{Üye adı} için paket güncellendi."
- [ ] Subtitle "Manuel paket atama (UI-only)" → "Üye paketlerini yönet".
- [ ] Satır rozeti yerel state'ten beslensin (seçim sonrası görünür değişim).

## Kabul kriterleri
- [ ] Tüm üyeler listelenir (paid-only filtre yok — LOCK).
- [ ] Alan seti LOCK'taki options tablosunun dışına çıkmaz (extendDays/supportSchedule vb. UI-only fazda eklenmez, uydurma alan da yok).
- [ ] Uzman atama satırları düşürülmedi (LOCK: "Do not drop assignment dropdowns").
- [ ] Hiçbir yerde "UI-only" ibaresi görünmez; tüm renkler token, plan id'leri free|eko|diyet|spor|doktor|vip.
