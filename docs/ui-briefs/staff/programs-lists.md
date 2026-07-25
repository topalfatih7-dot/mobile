# Programlar & Listeler — UI Brief (Fable 5)

Kaynak: `app/(staff)/programs.tsx` + `app/(staff)/lists.tsx` · LOCK: `docs/mobile/screens/staff/programs.md` + `lists.md`

## Mevcut durum
Her iki ekran 2 sabit karttan ibaret; ikinci kartlarda kullanıcıya görünen **"UI-only örnek kayıt"** / **"UI-only örnek liste"** metinleri var. Meta satırları ham teknik dil ("cycle14"). Kartlar dokunulabilir değil (LOCK: programs → builder'ı açar).

## Hedef kompozisyon (viewport sırası)
### Programlar (coach)
1. **Header**: "Programlar" + "Gönderilen antrenman programları" — korunur.
2. **Program kartları** (DEMO_PROGRAMS + DEMO_CLIENTS'tan gerçekçi ekler): dokununca ilgili danışanın builder'ına gider (`/(staff)/clients/{memberId}/program`).

### Listeler (dietitian)
1. **Header**: "Listeler" + "Beslenme listeleri" — korunur.
2. **Liste kartları**: aynı kart dili, sage vurgulu; dokunma hedefi yok (mobil builder listeler için bu fazda kapsam dışı — kart bilgilendirme amaçlı).

## Bileşen ve token detayı
- Kart: beyaz, cream-200 border, radius.xl; sol renk şeridi 4px — antrenman: brand-400, beslenme: sage-400.
- Kart içeriği: başlık `sansSemi` 16 + iki meta satırı:
  - Satır 1: danışan adı + durum rozeti ("Aktif" sage-100/sage-700 veya "Süresi doldu" cream-100/cream-800).
  - Satır 2: insan dili özet — "cycle14" yerine **"14 günlük döngü"**; hareket/öğün sayısı: "2 hareket · her gün" / "Kahvaltı + Öğle · her gün".
- **Demo kart içerikleri** (uydurma alan yok, mevcut demo kişiler):
  - Programlar: ① "Demo Antrenman" — Demo Üye · 14 günlük döngü · 2 hareket (DEMO_PROGRAMS); ② "Ev Direnç Programı" — Ayşe Yılmaz · 14 günlük döngü · 5 hareket. ("UI-only örnek kayıt" silinir.)
  - Listeler: ① "Demo Beslenme" — Demo Üye · 14 günlük döngü · Kahvaltı + Öğle (DEMO_PROGRAMS); ② "Dengeli Beslenme Listesi" — Mehmet Kaya · 14 günlük döngü · 3 öğün. ("UI-only örnek liste" silinir.)
- Programlar kartlarında sağda `chevron-forward` cream-300 (builder'a gider); Listeler'de yok.
- Rol yönlendirmesi (coach↔lists, dietitian↔programs redirect) shell'de kalır; ekrana gate UI eklenmez.

## Durumlar (boş / dolu / hata / kilitli)
- **Dolu**: yukarıdaki 2'şer kart.
- **Boş**: EmptyState — Programlar: "Henüz program yok" / Listeler: "Henüz liste yok"; alt açıklama "Danışan seçip oluşturduğunuzda burada görünür." (tek ortak açıklama; demo verili UI-only fazda görünmez).
- **Hata / kilitli**: yok (UI-only).

## Motion
1. Kartlar sıralı FadeIn (40+i·30ms).
2. Programlar kartı basışta scale 0.98 + zemin cream-50.

## Değişiklik listesi
- [ ] "UI-only örnek kayıt" / "UI-only örnek liste" metinlerini kaldır; gerçekçi ikinci kartları koy.
- [ ] "cycle14" → "14 günlük döngü" insan dili meta.
- [ ] Sol renk şeridi (brand/sage) + durum rozeti ekle.
- [ ] Programlar kartlarını dokunulabilir yap → danışan builder'ı; chevron ekle.
- [ ] Boş durum EmptyState'lerini tanımla.

## Kabul kriterleri
- [ ] "UI-only" ifadesi hiçbir kartta görünmüyor.
- [ ] "Programlar", "Gönderilen antrenman programları", "Listeler", "Beslenme listeleri" birebir.
- [ ] Programs kartı builder'ı açıyor (LOCK); Lists'te antrenman sepeti YOK (LOCK).
- [ ] Yeni ekran/alan yok; kartlar DEMO_PROGRAMS/DEMO_CLIENTS ile tutarlı.
- [ ] Tüm renkler token; mor yok.
