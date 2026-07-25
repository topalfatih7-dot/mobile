# Admin Planlar — UI Brief (Fable 5)

> Kaynak: `app/(admin)/plans.tsx` · LOCK: `docs/mobile/screens/admin/plans.md`
> Veri: `ALL_PLANS` + `formatTry`. Kilitli karar: okuma listesi + **hafif düzenleme bottom sheet** (fiyat/açıklama), yerel state + toast; upsertPlan bağlanmaz.

## Mevcut durum
Düz beyaz kartlarda ad + fiyat·periyot + blurb listeleniyor. Sorunlar: kartlar salt okunur, LOCK'taki düzenleme yolu için hiçbir giriş yok; plan sırası/hiyerarşisi görsel olarak ayrışmıyor (Basic ile Vip aynı ağırlıkta); periyot ham değer basılıyor.

## Hedef kompozisyon
1. **Başlık**: "Planlar" + subtitle "Paket tanımları" (kalır).
2. **Plan kartları** (ALL_PLANS sırası: Basic → Eko → Diyet → Spor → Doktor → Vip — sıra değişmez):
   - Üst satır: plan adı + sağda düzenle ikonu (`create-outline`, brand-600, 44×44 dokunma alanı).
   - Fiyat satırı: `formatTry(price)` büyük + "/ aylık" tarzı periyot eki küçük; Basic'te "Ücretsiz".
   - Blurb: cream-800 küçük metin.
   - Vip kartında gold-400 "En kapsamlı" köşe rozeti (mevcut üyelik sayfası hiyerarşisiyle uyumlu vurgu; yeni alan değil, sunum).
3. Düzenle ikonu → **düzenleme bottom sheet**:
   - Grabber + başlık "{Plan adı} düzenle".
   - **Fiyat (₺)** sayısal TextField + **Açıklama** çok satırlı TextField (mevcut blurb ile dolu).
   - "Kaydet" primary CTA (min 48) + "Vazgeç" ghost.
4. Kaydet → sheet kapanır, karttaki fiyat/blurb yerel state ile güncellenir, toast **"{Plan adı} güncellendi."**

## Bileşen ve token detayı
- Kart: beyaz, radius 20, cream-200 border; Vip kartı gold-400 %40 border + warm-50→beyaz hafif degrade zemin.
- Plan adı `fonts.sansSemi` 16 cream-900; fiyat `fonts.displayExtra` 22 brand-700; periyot 12 cream-800.
- Sheet: beyaz, üst radius 24, grabber cream-300, scrim cream-900 %40; alanlar mevcut `TextField` bileşeni.
- Fiyat alanı `keyboardType="numeric"`; geçersiz (boş/negatif) değerde Kaydet pasif %50 opak.

## Durumlar
- Liste sabit (ALL_PLANS) — boş durum yok.
- Sheet'te Vazgeç → değişiklik atılır; tekrar açılışta son yerel değerler görünür.
- Yerel düzenleme yalnız fiyat + blurb; ad, id, periyot salt okunur (sheet'te gösterilmez ya da pasif etiket).

## Motion
1. Kartlar: 40ms stagger FadeIn.
2. Sheet: translateY spring + scrim fade.
3. Kaydet sonrası kartta fiyat/blurb kısa fade geçişi.

## Değişiklik listesi
- [ ] Her karta düzenle ikonu; fiyat/açıklama düzenleme bottom sheet'i (yerel state + toast).
- [ ] Fiyat tipografisini büyüt (displayExtra brand-700); Basic'te "Ücretsiz" gösterimi.
- [ ] Vip kartına gold vurgusu (border + degrade + rozet).
- [ ] Periyot ham değer yerine Türkçe ek ("/ ay" biçimi mevcut period alanından türetilir, yeni metin uydurulmaz).

## Kabul kriterleri
- [ ] Plan id/sıra (free|eko|diyet|spor|doktor|vip) değişmedi; yeni plan/alan yok.
- [ ] Düzenleme yalnız fiyat + blurb; yerelde kalır, upsertPlan çağrılmaz.
- [ ] Renkler token; mor yok; UI Türkçe; CTA ≥48.
