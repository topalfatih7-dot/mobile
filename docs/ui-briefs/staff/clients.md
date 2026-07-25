# Staff Danışanlar — UI Brief (Fable 5)

Kaynak: `app/(staff)/clients/index.tsx` · LOCK: `docs/mobile/screens/staff/clients.md`

## Mevcut durum
Arama + kart listesi + üç ikon butonu çalışıyor. Zayıf noktalar: satırda avatar yok, üç ikon butonu etiketsiz (hangisi sağlık/program/mesaj belli değil), plan bilgisi düz metin (rozet değil), rol ayrımı görselde yok (diyetisyen de "barbell" görüyor), arama alanı ikonsuz.

## Hedef kompozisyon (viewport sırası)
1. **PanelScaffold header**: "Danışanlar" + "Atanmış danışanlarınız" — korunur.
2. **Arama alanı**: sol `search` ikonu + "Ara…" placeholder, 48 yükseklik (member library paritesi).
3. **Danışan kartları**: her satırda avatar (baş harfler) + isim + plan rozeti + e-posta; altında yatay aksiyon şeridi.

## Bileşen ve token detayı
- Arama: beyaz zemin, cream-200 border, radius.xl, yükseklik 48; ikon cream-800.
- Kart: beyaz, cream-200 border, radius.xl; iki katman — üstte kimlik satırı, altta aksiyonlar (araya 1px cream-100 ayraç).
- Avatar: 44 daire, baş harfler beyaz `sansSemi`; zemin danışanın planına göre — vip: gold-400, spor: brand-500, diyet: sage-500, diğer: cream-300.
- Plan rozeti: `getPlanLabel` çıktısı; radius.full, 11pt `sansSemi`; vip: gold-400/beyaz, spor: brand-100/brand-700, diyet: sage-100/sage-700.
- Aksiyon şeridi: ikon **+ kısa etiket** birlikte, min dokunma 44:
  - "Sağlık" — `fitness`, sage-600 → `/(staff)/clients/{id}/health`
  - Coach: "Program" — `barbell`, brand-600 → `/(staff)/clients/{id}/program`; **Dietitian**: aynı slotta "Liste" — `restaurant`, sage-600 → `/(staff)/lists` (LOCK: coach=program, dietitian=nutrition)
  - "Mesaj" — `chatbubble`, warm-500 → `/(staff)/messages/{id}`
- Etiketler 12pt `sansSemi`, ikonla aynı renk.

## Durumlar (boş / dolu / hata / kilitli)
- **Dolu**: rol filtresinden geçen DEMO_CLIENTS (coach: Demo Üye + Ayşe Yılmaz; dietitian: Demo Üye + Mehmet Kaya).
- **Boş (atama yok)**: mevcut EmptyState — "Danışan yok" / "Atama sonrası burada görünür." birebir korunur; üstüne sage-100 zeminli 64'lük `people` ikon dairesi.
- **Arama sonuçsuz**: EmptyState "Sonuç yok" başlığı yerine mevcut boş liste davranışı kullanılmaz — arama boş dönerse "Danışan yok" EmptyState'i yerine kısa satır: aramayı temizleme ipucu **eklenmez**, mevcut EmptyState gösterilir (yeni string uydurma yok).
- **Hata / kilitli**: yok (UI-only).

## Motion
1. Mevcut sıralı FadeIn (40+i·30ms) korunur.
2. Aksiyon butonu basışta scale 0.94→1.
3. Arama yazımında liste değişimi LayoutAnimation/Reanimated Layout ile yumuşak.

## Değişiklik listesi
- [ ] Arama alanına ikon + 48 yükseklik.
- [ ] Avatar (baş harf, plan renkli) ekle.
- [ ] Plan bilgisini renkli rozete çevir; e-posta ikinci satır cream-800 %65.
- [ ] İkon butonlarını etiketli aksiyon şeridine dönüştür (44 min dokunma).
- [ ] Dietitian rolünde "Program" yerine "Liste" aksiyonu (`/(staff)/lists`).
- [ ] EmptyState'e ikon dairesi ekle (metinler aynen).

## Kabul kriterleri
- [ ] "Danışanlar", "Atanmış danışanlarınız", "Ara…", "Danışan yok", "Atama sonrası burada görünür." birebir.
- [ ] Rol/atama filtresi (LOCK: atama+paket dışı danışan yok) mevcut mantıkla aynı.
- [ ] Dietitian bu ekrandan program builder'a gidemiyor.
- [ ] Tüm renkler token; mor yok; dokunma hedefleri ≥44.
- [ ] Yeni alan/kolon uydurulmamış — yalnız DEMO_CLIENTS alanları (name, email, membership) gösteriliyor.
