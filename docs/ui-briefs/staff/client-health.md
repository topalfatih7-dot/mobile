# Danışan Sağlık Özeti — UI Brief (Fable 5)

Kaynak: `app/(staff)/clients/[id]/health.tsx` · LOCK: `docs/mobile/screens/staff/client-health.md`

## Mevcut durum
Tek düz kart (Cinsiyet / Paket / Sağlık testi) + not alanı. Kritik sorunlar: kullanıcıya görünen geliştirici cümlesi **"UI-only — yanıtlar bağlama sonrası"**, cinsiyet ham İngilizce değer ("female"), paket ham id ("vip"), toast metni geliştirici dili ("Not yerel olarak kaydedildi (UI-only)."). LOCK: yalnız yanıtlar + klinik not, analiz yok (`showHealthAnalysis=false`) — buna uygun.

## Hedef kompozisyon (viewport sırası)
1. **PanelScaffold header** (showBack): "Sağlık özeti" + danışan adı — korunur.
2. **Kimlik kartı**: avatar (baş harf) + isim + plan rozeti + cinsiyet TR etiketi tek kompakt kartta.
3. **Sağlık testi yanıtları kartı**: bölüm başlıklı yapılandırılmış özet satırları (aşağıda demo içerik).
4. **Klinik not**: "Not" etiketi + çok satırlı input + "Notu kaydet" CTA — korunur.

## Bileşen ve token detayı
- Kimlik kartı: beyaz, cream-200 border, radius.xl; avatar 48 (plan rengiyle, clients brief'iyle aynı kural); cinsiyet TR: female→"Kadın", male→"Erkek" (görünen etiket TR, veri değeri değişmez).
- Yanıt kartı: her satır `etiket (sansSemi 12, brand-600, uppercase) + değer (sans 15, cream-900)` mevcut label/val stiliyle. **"UI-only — yanıtlar bağlama sonrası" cümlesi silinir**; yerine DEMO_CLIENTS ile tutarlı gerçekçi demo yanıtları:
  - "Hedef" → "Kilo vermek ve kondisyon kazanmak"
  - "Aktivite düzeyi" → "Haftada 2–3 gün hafif egzersiz"
  - "Kronik rahatsızlık" → "Belirtilmedi"
  - "Uyku" → "Ortalama 6–7 saat"
  (Bunlar demo sunum verisidir; sağlık testi katalog alanı **eklenmez**, mevcut kart içinde satır olarak durur.)
- Satır araları 1px cream-100 ayraç; kart içi gap 8.
- Not input: mevcut stil (minHeight 100) + odakta border brand-300.
- Kaydet toast: "Not yerel olarak kaydedildi (UI-only)." → **"Not kaydedildi."** (success).

## Durumlar (boş / dolu / hata / kilitli)
- **Dolu**: kimlik + demo yanıt satırları + not.
- **Boş (danışan bulunamadı)**: header alt başlık "Danışan" (mevcut fallback); kartlarda "—" değerleri (mevcut davranış korunur).
- **Not boş kaydetme**: boş notta CTA pasif (%45 opaklık) — hata toastı eklenmez.
- **Hata / kilitli**: yok (UI-only).

## Motion
1. Kartlar sıralı FadeIn (40/80/120ms).
2. Not kaydette CTA'da kısa scale 0.96→1 + success toast.
3. Input odak border geçişi ~150ms.

## Değişiklik listesi
- [ ] "UI-only — yanıtlar bağlama sonrası" cümlesini kaldır; 4 gerçekçi demo yanıt satırı koy.
- [ ] Cinsiyet/paket ham değerlerini TR etiket + plan rozetine çevir.
- [ ] Kimlik kartına avatar ekle; Cinsiyet/Paket bilgisini kimlik kartında topla.
- [ ] Toast metnini "Not kaydedildi." yap.
- [ ] Boş notta kaydet CTA'sını pasifleştir.
- [ ] Satır ayraçları + kart hiyerarşisi (kimlik / yanıtlar / not) uygula.

## Kabul kriterleri
- [ ] "UI-only", "bağlama sonrası" ifadeleri hiçbir yerde görünmüyor.
- [ ] Sağlık analizi/AI yorumu YOK (LOCK: showHealthAnalysis=false) — yalnız yanıt + not.
- [ ] "Sağlık özeti", "Not", "Notu kaydet" stringleri birebir.
- [ ] Yeni ekran/alan yok; demo yanıtlar tek mevcut kartın satırları.
- [ ] Tüm renkler token; mor yok; CTA ≥48.
