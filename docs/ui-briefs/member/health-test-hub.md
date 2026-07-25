# Sağlık Testleri Hub — UI Brief (Fable 5)

Kaynak: `app/(member)/health-test/index.tsx` · LOCK: `docs/mobile/screens/member/health-test-hub.md`

## Mevcut durum

Consent kartı, bölüm kartları (progress bar'lı) ve "Sonuçlara git" CTA'sı LOCK akışına uygun. Zayıf noktalar: tüm bölüm kartları aynı `fitness` ikonunu kullanıyor (bölüm meta'sında ikon varsa kullanılmıyor), consent kartı görsel olarak sıradan bir beyaz kart (ekranın en kritik adımı olduğu halde), kilitli kartlar yalnız opacity ile ayrışıyor.

## Hedef kompozisyon (viewport sırası)

1. Geri linki → başlık **Sağlık Testleri** → koşullu alt başlık (LOCK string'leri: consent varken "Testlere başlamadan önce onayları işaretleyin", sonrası "Her kategoriyi ayrı ayrı tamamlayın — istediğiniz sırayla ilerleyebilirsiniz").
2. **Consent kartı** (yalnız `needsConsent`): brand-50 zemin + brand-200 border ile vurgulu; üstte küçük bilgi satırı (kalkan ikonu brand-600), 2 checkbox, **Onayları kaydet** primary (min 48, disabled ikisi işaretlenene dek).
3. **Bölüm kartları** (`getApplicableSections` sırası — hardcode yok): ikon rozeti + başlık/alt başlık + chevron → progress bar → durum etiketi.
4. **Sonuçlara git** CTA (yalnız `allDone && !needsConsent`), tam genişlik primary.

Mesh atmosfer mevcut `MeshBackground`; ek katman gerekmez.

## Bileşen ve token detayı

- Consent kartı: **brand-50** zemin, brand-200 border, radius `radius.xl`; buton `Button` primary brand-600, yükseklik ≥48; kaydederken "Kaydediliyor…".
- Bölüm kartı: beyaz, radius `radius.xl`, cream-200 border; ikon rozeti 40, radius 12 — tamamlandı: sage-100 zemin/sage-600 `checkmark-circle`; devam: brand-50 zemin/brand-600 ikon (meta ikonu varsa o, yoksa `fitness`).
- Progress: track cream-100, dolgu brand-500 (devam) / sage-500 (tamam), yükseklik 6, radius full.
- Durum etiketi: "Tamamlandı" sage-600 Inter semi 12; "x/y zorunlu soru" cream-800 Inter 12.
- Kilitli kart (consent öncesi): opacity 0.55 + sağ üstte küçük kilit ikonu (cream-300) — yalnız soluklaşma yetmez, kilit nedeni görünür olsun.
- Tipografi: başlık Plus Jakarta Extra 28, alt başlık Inter 14/20.

## Durumlar

- **Consent gerekli:** consent kartı görünür, tüm bölüm kartları kilitli (disabled + kilit ikonu).
- **Devam eden bölüm:** brand progress + "x/y zorunlu soru".
- **Tamamlanan bölüm:** sage ikon/progress + "Tamamlandı".
- **Hepsi tamam:** altta "Sonuçlara git" CTA'sı belirir.
- **Trial bitti:** `FreeTrialExpiredGate` short-circuit (dokunma).

## Motion (Reanimated)

1. Bölüm kartları kademeli fade+slide (mevcut delay yapısı: 80 + i×30).
2. Consent kaydedilince: consent kartı fade-out + kartlardaki kilit görünümü fade ile kalkar (layout animasyonu).
3. Progress bar dolgu genişliği mount'ta 300ms ease ile animasyonlu.

## Değişiklik listesi

- [ ] `consentCard`: beyaz → `colors.brand[50]` zemin + `colors.brand[200]` border; başına kalkan ikonlu kısa bilgi satırı (yeni string ekleme — mevcut alt başlık yeterli, satır yalnız ikon+mevcut metin düzeni olabilir).
- [ ] Bölüm ikonu: `getSectionMeta(section.id)` ikon alanı varsa kullan; yoksa `fitness` fallback.
- [ ] Kilitli karta kilit ikonu (`lock-closed`, cream-300, sağ üst) ekle.
- [ ] Progress dolgusuna Reanimated width animasyonu; "Tamamlandı" etiketi `colors.sage[600]`.
- [ ] "Onayları kaydet" ve "Sonuçlara git" butonları min 48 doğrulansın.
- [ ] Bölüm listesi/filtre mantığına, string'lere ve consent davranışına dokunulmaz.

## Kabul kriterleri

- [ ] Alt başlıklar ve toast ("Onaylar kaydedildi. Testlere başlayabilirsiniz.") birebir.
- [ ] Bölümler `getApplicableSections`'tan; hardcode liste yok.
- [ ] Renk/radius yalnız token; CTA ≥48; kart radius ≤24.
- [ ] Consent öncesi kartlar hem soluk hem kilit ikonlu; consent sonrası animasyonla açılır.
- [ ] Tamamlanan/devam eden bölümler ikon + progress rengiyle net ayrışıyor.
