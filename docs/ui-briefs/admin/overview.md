# Admin Genel Bakış — UI Brief (Fable 5)

> Kaynak: `app/(admin)/index.tsx` · LOCK: `docs/mobile/screens/admin/overview.md`
> Veri: `DEMO_ADMIN_STATS` (members, activeSessions, openTickets, unassigned, staffCount, applications). Yeni KPI icat etme.

## Mevcut durum
KPI grid (4 sade beyaz kart) + 3 gruplu düz nav satırları çalışıyor. Sorunlar: subtitle "Operasyon paneli (UI-only)" geliştirici dili; KPI kartları renksiz ve ikonsuz; nav satırlarında ikon yok, gruplar görsel olarak ayrışmıyor; "Giriş: {email}" hint'i ve Çıkış butonu sayfa sonunda kopuk duruyor.

## Hedef kompozisyon (viewport sırası)
1. **Başlık**: "Genel bakış" + subtitle **"Yeni Form operasyon paneli"** (UI-only ibaresi kalkar).
2. **KPI grid** (2×2): Üye / Aktif seans / Açık talep / Atamasız üye — her kart sol üstte renkli ikon rozeti, büyük sayı, kısa etiket.
3. **Nav grupları**: "Operasyon", "İçerik", "Sistem" başlıkları altında ikonlu satırlar (`ADMIN_NAV` başlıkları aynen — yeniden adlandırma yok).
4. **Hesap şeridi**: en altta tek satır kart — sol tarafta avatar (baş harf) + e-posta + "admin" rozeti, sağda "Çıkış Yap" ghost buton. "Giriş:" öneki kalkar.

## Bileşen ve token detayı
- KPI kartı: beyaz zemin, radius 20 (`radius.xl`), cream-200 border; ikon rozeti 36×36 radius 12:
  - Üye → brand-50 zemin / brand-600 `people` ikonu
  - Aktif seans → sage-50 / sage-600 `videocam`
  - Açık talep → warm-50 / warm-500 `help-buoy`
  - Atamasız üye → gold-400 %12 opak zemin / gold-500 `person-add`
- Sayı: `fonts.displayExtra` 28, cream-900; etiket `fonts.sans` 12, cream-800.
- Grup başlığı: mevcut uppercase brand-600 stili kalır; üstüne `spacing.md` boşluk.
- Nav satırı: min 48; solda 32×32 brand-50 kutuda brand-600 Ionicons (ör. members `people`, premium `star`, sessions `calendar`, applications `document-text`, staff `id-card`, support `chatbubble-ellipses`, messages `mail`, library `barbell`, blog `newspaper`, content `layers`, payments `card`, plans `pricetags`, subscriptions `repeat`, analytics `stats-chart`, activity `pulse`, ai-costs `sparkles`, account `person-circle`); sağda cream-300 chevron (mevcut).
- Hesap şeridi: beyaz kart radius 20; avatar 40×40 brand-600 zemin, beyaz baş harf; "admin" rozeti gold-400 zemin beyaz 10pt (PanelScaffold titleBadge stili).

## Durumlar
- KPI değerleri her zaman `DEMO_ADMIN_STATS`'tan; 0 değeri de sayı olarak gösterilir (boş durum yok).
- Çıkış: mevcut `logout()` + `/(auth)/login` yönlendirme davranışı aynen.

## Motion
1. KPI grid: mevcut `FadeIn` kalır; kartlar 40ms kademeli (stagger) fade + translateY 12→0.
2. Nav grupları: mevcut `delay={60}` FadeIn korunur.
3. Nav satırı press: `Pressable` pressed durumunda zemin cream-100 (opacity oynatma yok).

## Değişiklik listesi
- [ ] Subtitle "Operasyon paneli (UI-only)" → "Yeni Form operasyon paneli".
- [ ] KPI etiketlerini netleştir: "Üye", "Aktif seans", "Açık talep", "Atamasız üye"; her karta ikon rozeti + renk ekle.
- [ ] Nav satırlarına grup renginde ikon kutusu ekle; pressed zemin durumu.
- [ ] "Giriş: {email}" hint + ayrık Çıkış butonu → avatarlı hesap şeridi kartına dönüştür.
- [ ] KPI kartlarına stagger animasyonu.

## Kabul kriterleri
- [ ] KPI'lar yalnız DEMO_ADMIN_STATS alanlarından; yeni metrik/ekran yok.
- [ ] `ADMIN_NAV` başlıkları ve route'ları değişmedi.
- [ ] Tüm renkler 02-design-system tokenı; mor yok; UI tamamen Türkçe.
- [ ] "UI-only" ibaresi ekranda hiçbir yerde görünmüyor.
