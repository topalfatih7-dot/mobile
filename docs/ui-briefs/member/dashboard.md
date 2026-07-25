# Üye Dashboard — UI Brief (Fable 5)

Kaynak: `app/(member)/dashboard.tsx` · LOCK: `docs/mobile/screens/member/dashboard.md`

## Mevcut durum

Bölüm sırası LOCK ile uyumlu (hero → günün ipucu → banner'lar → badge satırı → 4 stat → grafikler → hızlı linkler → blog). Sorunlar: hero fotoğraf kartında başlık + 2 CTA dar ekranda (≤360dp) sıkışıyor; ipucu ve banner'larda token dışı hexler (`#fbf6ea`, `#92400e`, `#78350f`) var; hero ve modal radius 28 (kilitli aralık 16–24 dışında).

## Hedef kompozisyon (viewport sırası — LOCK sırası değişmez)

1. **Hero** (fotoğraf + brand-900 gradyan): tarih satırı → başlık → alt metin → 2 CTA pill. Dar ekranda CTA'lar tek satır kalmalı; sığmıyorsa dikey stack (`flexWrap` yerine `width < 360 → column`).
2. **Günün ipucu** kartı — gold vurgu; loading'de ikon pulse (mevcut).
3. **Banner'lar** (koşullu, LOCK 3–6): deneme / bitiyor / doldu / upsell. Hepsi tek görsel dil: soldan ikon, ortada metin, sağda buton; min touch 44.
4. **MembershipBadge + "Destek Alanı"** chip satırı.
5. **StatCard ×4** — 2 sütunluk grid (her kart `width: '48%'` mantığı), sarma tutarlı olsun.
6. **Grafik kartları** (Kilo Trendi + 2 WeeklyAdherence).
7. **QuickLinkTile ×4** → blog kartları.

Mesh atmosfer: `MeshBackground` kalır; hero altında cream-50 zemine yumuşak geçiş — ekstra katman ekleme, mevcut mesh yeterli.

## Bileşen ve token detayı

- Hero: radius **24** (28 değil), gradyan `rgba(26,69,92,…)` = brand-900 → uyumlu, kalsın. Başlık `fonts.displayExtra`, dar ekranda 20/26 (≥360dp'de 22/28). Tarih satırı `numberOfLines={1}`.
- CTA pill: min yükseklik **48** (şu an ~35 — `paddingVertical: 10` yetersiz); beyaz pill metni brand-700, ghost pill `rgba(255,255,255,0.18)`.
- İpucu kartı: zemin `#fbf6ea` → **warm-50** (`#fff9f5`), border `rgba(gold-400,0.35)` kalabilir (token türevi), ikon kutusu gold-500.
- Amber banner: zemin warm-50 + border warm-200 (mevcut, doğru); metin renkleri `#92400e/#78350f` → **cream-900** (başlık) ve **cream-800** (gövde); vurgu ikonları gold-500/warm-500 kalsın.
- Brand banner: brand-50 zemin + brand-200 border (mevcut, doğru); pill brand-500, min yükseklik 44.
- Bottom sheet (Başarı Hikayen): üst radius **24**; başlık `fonts.displayBold` 20.
- Yazı tipi hiyerarşisi: başlıklar Plus Jakarta (display*), gövde Inter (sans*). Değişmez.

## Durumlar

- **Kilitli:** `isFreeTrialExpired` → yalnız `FreeTrialExpiredGate` (dokunma).
- **Boş grafikler:** mevcut boş metinler birebir korunur ("Kilo kayıtlarınız burada görünecek" vb.).
- **Tip loading:** opacity 0.6 + ikon pulse.
- **Banner koşulları:** LOCK'taki mantık birebir; yalnız görsel düzenlenir.

## Motion (Reanimated)

1. Mevcut `FadeIn` kademesi (0→280ms) kalır; hero'ya ek olarak 12px yukarı slide.
2. StatCard'lara basışta hafif scale (0.98) pressed feedback.
3. Bottom sheet açılışı: slide + backdrop fade (Modal `slide` yerine Reanimated sheet gerekmiyorsa mevcut yeterli).

## Değişiklik listesi

- [ ] `hero.borderRadius: 28 → 24`; `modalCard` üst radius `28 → 24`.
- [ ] Dar ekran (`useWindowDimensions().width < 360`): hero başlık 20/26, `heroCtas` dikey stack; `heroDate`'e `numberOfLines={1}`.
- [ ] `ctaPrimary/ctaGhost`: `minHeight: 48` ekle (CTA lock kuralı).
- [ ] `tip.backgroundColor: '#fbf6ea' → colors.warm[50]`.
- [ ] `bannerAmberText/bannerTitle/bannerSub` renkleri: `#92400e/#78350f` → `colors.cream[900]` / `colors.cream[800]` (opaklıkla ton).
- [ ] `stats`: StatCard'lara %48 genişlik ver → düzgün 2'li grid.
- [ ] StatCard/QuickLinkTile pressed state: scale 0.98 + opacity 0.92.
- [ ] Hiçbir string, bölüm sırası veya banner koşulu değişmez.

## Kabul kriterleri

- [ ] iPhone SE (320–375dp) genişliğinde hero taşmıyor; CTA metinleri kırpılmıyor.
- [ ] Tüm hex'ler `02-design-system.md` tokenlarından (veya rgba türevlerinden).
- [ ] Tüm radius değerleri 16–24 aralığında; CTA min 48.
- [ ] LOCK layout sırası ve string'ler birebir; ekstra kart/bölüm yok.
- [ ] FreeTrialExpiredGate short-circuit bozulmadı.
