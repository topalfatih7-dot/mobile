# Staff Profil & Ödemeler — UI Brief (Fable 5)

Kaynak: `app/(staff)/profile.tsx` + `app/(staff)/payments.tsx` · LOCK: `docs/mobile/screens/staff/profile.md` + `payments.md`

## Mevcut durum
- **Profil**: e-posta/rol kartı + müsaitlik editörü çalışıyor. Zayıf: rol ham İngilizce ("coach"), avatar/kimlik hissi yok, müsaitlik saat çipleri küçük (min 44 altı), kaydet CTA listeyle aynı hizada kayboluyor.
- **Ödemeler**: KPI + 2 satır var ama alt başlıkta **"Özet (UI-only demo)"** ve altta **"Gerçek ödeme verisi bağlama sonrası gelir."** geliştirici metinleri. LOCK: web'de de mock — "demo olarak etiketle" der; bunu kullanıcı-dostu tek rozetle çözeriz.

## Hedef kompozisyon
### Profil
1. **Header**: "Profilim" + isim — korunur.
2. **Kimlik kartı**: 56 avatar (baş harfler, brand-500) + isim + rol rozeti TR (coach→"Koç" brand-100/brand-700, dietitian→"Diyetisyen" sage-100/sage-700, doctor→"Doktor" gold-400/beyaz) + e-posta satırı.
3. **Müsaitlik editörü**: "Müsaitlik" bölümü — gün blokları + saat çipleri (mevcut yapı, rötuşlu).
4. **"Müsaitliği kaydet"** CTA: içerik sonunda, üstünde 1px cream-200 ayraç.

### Ödemeler
1. **Header**: "Ödemeler" + alt başlık — "Özet (UI-only demo)" → **"Hak ediş özeti"**; başlık yanına küçük **"Demo" rozeti** (gold-400 zemin, beyaz 10pt, radius.full) — LOCK'un "label demo if still mock" şartını kullanıcı-dostu karşılar.
2. **KPI kartı**: "₺12.400 / Bu ay tahmini hak ediş" — korunur; sol üstte mint-50 zemin + sage-600 `trending-up` ikon dairesi.
3. **Danışan satırları**: mevcut 2 satır + plan rozeti ve durum rozetiyle zenginleştirilir: "Demo Üye" + Vip rozeti + "Aktif" (sage); "Ayşe Yılmaz" + Spor rozeti + "Aktif". "Gerçek ödeme verisi bağlama sonrası gelir." satırı silinir.

## Bileşen ve token detayı
- Saat çipi: minHeight 44, paddingHorizontal 12, radius.full; seçili brand-600/beyaz (mevcut renk kuralı), seçili değil beyaz + cream-200 border. Gün etiketi yanına seçili saat sayacı: "Pzt · 2 saat" 12pt cream-800.
- Gün bloğu: beyaz kart (cream-200 border, radius.xl) içinde — çipler kartın içinde sarmalanır; kartlar arası gap 8.
- Kaydet CTA: Button primary min 48; toast **"Müsaitlik bilgileriniz kaydedildi"** (mevcut, korunur).
- Ödemeler satırı: isim `sansSemi` 15 + plan rozeti (clients brief kuralı) + sağda "Aktif" rozeti sage-100/sage-700. Hakediş matematiği **eklenmez** (LOCK: payout math uydurma).
- Şifre/bio/foto düzenleme alanları bu UI-only fazda **eklenmez** (mevcut ekranda yok; yeni alan uydurma yasağı — web editör paritesi bağlama fazının işi).

## Durumlar (boş / dolu / hata / kilitli)
- **Profil dolu**: kimlik + müsaitlik.
- **Müsaitlik boş gün**: çipsiz gün kartı normal görünür; sayaç "0 saat" yazmaz, gizlenir.
- **Ödemeler boş**: EmptyState "Kayıt yok" (demo veride görünmez).
- **Hata / kilitli**: yok (UI-only).

## Motion
1. Saat çipi seçiminde scale 0.92→1 + renk geçişi ~150ms.
2. Kartlar sıralı FadeIn.
3. Kaydette CTA scale 0.96→1 + success toast.

## Değişiklik listesi
- [ ] Profil: kimlik kartı (avatar + TR rol rozeti); ham "coach" değerini gizle.
- [ ] Saat çiplerini 44 min dokunmaya büyüt; gün bloklarını karta al; saat sayacı ekle.
- [ ] Kaydet CTA'yı ayraçla ayır.
- [ ] Ödemeler: "Özet (UI-only demo)" → "Hak ediş özeti" + "Demo" rozeti.
- [ ] "Gerçek ödeme verisi bağlama sonrası gelir." satırını sil.
- [ ] Danışan satırlarına plan + durum rozetleri; KPI kartına ikon dairesi.

## Kabul kriterleri
- [ ] "UI-only", "bağlama sonrası" ifadeleri görünmüyor; mock durum yalnız "Demo" rozetiyle belirtiliyor (LOCK şartı).
- [ ] "Profilim", "Müsaitlik", "Müsaitliği kaydet", "Ödemeler", "Bu ay tahmini hak ediş" stringleri birebir.
- [ ] Hakediş hesabı/yeni ödeme alanı uydurulmamış.
- [ ] Müsaitlik toggle mantığı değişmemiş; yalnız görsel rötuş.
- [ ] Tüm renkler token; mor yok; çipler ≥44, CTA ≥48.
