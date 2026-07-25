# Staff Genel Bakış — UI Brief (Fable 5)

Kaynak: `app/(staff)/index.tsx` · LOCK: `docs/mobile/screens/staff/overview.md`

## Mevcut durum
KPI satırı (2 kart), tek "Yaklaşan görüşme" kartı ve düz link satırları var. Zayıf noktalar: KPI kartları karaktersiz (ikon/renk vurgusu yok), yaklaşan seans tek sabit karttan ibaret (liste değil), ekranın altında kullanıcıya görünen geliştirici metni **"UI-only giriş: {email}"** duruyor, çıkış butonu içerik akışının ortasında.

## Hedef kompozisyon (viewport sırası)
1. **PanelScaffold header** (mevcut): "Genel Bakış" + `{isim} · {rol TR}` alt başlık — korunur.
2. **KPI satırı**: 2 kart yan yana — "Danışan" (DEMO_CLIENTS filtresinden gelen sayı) ve "Yaklaşan seans". LOCK kapsamı: danışan sayısı + yaklaşan seanslar; üçüncü KPI **eklenmez**.
3. **Yaklaşan seanslar listesi** (kart grubu, başlık "Yaklaşan görüşme" korunur): DEMO_CLIENTS + demo seans verisinden türetilen 2–3 satır. Ör: "Demo Üye · Yarın 10:00 · 30 dk", "Ayşe Yılmaz · Perş 14:00 · 30 dk". İlk (en yakın) satırda "Görüşmeye katıl" primary CTA; diğerlerinde yalnız saat rozeti.
4. **Hızlı erişim satırları**: Danışanlar / Ödemeler / Admin mesajları / Ekip (collab) — mevcut hedefler ve metinler aynen, sağa `chevron-forward` eklenir.
5. **Çıkış Yap**: en alta, ayraç çizgisinin (cream-200) altına ghost buton olarak taşınır.

## Bileşen ve token detayı
- KPI kartı: beyaz zemin, cream-200 border, radius.xl; sol üstte 32'lik yumuşak daire — Danışan: sage-100 zemin + sage-600 `people` ikonu; Yaklaşan seans: brand-100 zemin + brand-600 `videocam` ikonu. Değer `fonts.displayExtra` 28 brand-700 (mevcut), etiket 12 cream-800.
- Seans satırı: 40'lık avatar dairesi (brand-500 zemin, isim baş harfleri beyaz), isim `sansSemi` 15, meta 12 cream-800; sağda saat rozeti (brand-50 zemin, brand-700 metin, radius.full).
- "Görüşmeye katıl" CTA: mevcut Button primary (brand-600), min yükseklik 48; hedef route `/(staff)/call/coach/ui-sess-coach-1` korunur.
- Hızlı erişim satırı: mevcut linkRow stili + sağda `chevron-forward` cream-300; min dokunma 44.
- Geliştirici metni **"UI-only giriş: {email}"** tamamen kaldırılır — e-posta zaten Profilim ekranında görünür.

## Durumlar (boş / dolu / hata / kilitli)
- **Dolu (varsayılan)**: KPI + 2–3 seans satırı + linkler.
- **Boş (seans yok — ör. doktor demo)**: seans grubunda EmptyState yerine tek satır kart: "Yaklaşan görüşme yok" (`sans` 14 cream-800) — yeni ekran/alan yok, mevcut kart stili.
- **Hata / kilitli**: yok (UI-only, gate shell'de).

## Motion
1. Mevcut FadeIn kademesi (40/80/120ms) korunur; seans satırları 30ms aralıkla sıralı fade+slide.
2. KPI değerleri girişte hafif scale 0.96→1 (Reanimated, ~220ms).
3. Link satırı basışta zemin cream-50→cream-100 geçişi.

## Değişiklik listesi
- [ ] "UI-only giriş: {email}" metnini kaldır.
- [ ] KPI kartlarına ikon dairesi ekle (sage/brand ayrımı).
- [ ] Tek seans kartını 2–3 satırlık "Yaklaşan görüşme" listesine dönüştür (DEMO_CLIENTS isimleriyle, gerçekçi gün/saat).
- [ ] En yakın seansa CTA, diğerlerine saat rozeti.
- [ ] Link satırlarına chevron + pres durumu ekle.
- [ ] Çıkış Yap'ı ayraçla en alta taşı.

## Kabul kriterleri
- [ ] Ekranda hiçbir "UI-only" / geliştirici ifadesi görünmüyor.
- [ ] "Genel Bakış", "Danışan", "Yaklaşan seans", "Görüşmeye katıl", "Çıkış Yap" stringleri birebir korunmuş.
- [ ] Yeni KPI/alan/ekran eklenmemiş; route hedefleri değişmemiş.
- [ ] Tüm renkler 02-design-system token'ı; mor yok; CTA ≥48, satırlar ≥44.
- [ ] Rol filtresi (coach/dietitian/doctor danışan sayısı) mevcut mantıkla aynı.
