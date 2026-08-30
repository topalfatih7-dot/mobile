# IMPLEMENTATION LOCK — Uydurma yasağı

Bu dosya, uygulayıcı yapay zeka / geliştirici için **zorunlu** kurallardır. `docs/mobile/**` ve `.cursor/skills/**` ile çelişen hiçbir şey yapılamaz.

**Platform:** iOS (`/Users/mac/Desktop/mobile/ios`). Android değişiklikleri `../andriod` klasöründe yapılır.

## 0. Temel yasa

1. **Spec’te yoksa ekleme.** Yeni ekran, endpoint, tablo kolonu, JSONB key, renk, font, paket id uydurma.
2. **Web’den farklı davranış uydurma.** Parity varsayılanı web’dir; sapma yalnızca bu klasörde “MOBILE DIFF” başlığıyla yazılıysa.
3. **Emin değilsen dur.** `appendices/G-open-questions-resolved.md` güncelle veya kullanıcıya sor — tahmin etme.
4. **Önce oku:** ilgili `screens/*`, `flows/*`, `contracts/*`, `domains/*`, sonra kod.
5. **Build:** yalnız `npm run build:ios` / `build:ios:store` / `build:preview:ios`. Onaysız `eas build` yok. Android AAB bu klasörden üretilmez.

## 1. UI / tasarım

| İzinli | Yasak |
|--------|-------|
| `02-design-system.md` hex tokenları | Yeni mor/gradient tema, rastgele radius |
| Screen dosyasındaki layout sırası | “Daha modern” diye kart/hero eklemek |
| `C-copy-strings.md` + screen string tabloları | İngilizce veya uydurma TR metin |
| Mevcut bileşen map (`B-component-map`) | Keyfi UI kit değiştirmek |

## 2. Veri / API

| İzinli | Yasak |
|--------|-------|
| `contracts/*` body/response | Yeni `/api/foo` |
| `supabase-tables.md` + mapper key’leri | `members.data.xyz` icat |
| Plan id: free\|eko\|eko_diyet\|eko_spor\|diyet\|spor\|doktor\|vip (`eko` eski, satış kapalı) | gumus/altin UI’da birincil id (legacy map yalnızca query’de: gumus→eko_diyet) |

## 3. Ödeme (iOS)

- **MOBILE DIFF (2026-08-15):** Uygulama içi IAP / RevenueCat **yok**.
- **MOBILE DIFF (2026-08-21) App Store 3.1.3(f):** web `/plans` / `/membership` satın alma CTA **yok** (`canOfferWebPurchase() === false`). Unpaid/trial kapılarında Plan Seç / harici checkout yok. Kilitli randevu/kalori ekranlarında **Paketleri gör** / **satın alın** yok. Kayıt metni yükseltme vaadi yok. `habit_upsell` kurulmaz; tap panel.
- **MOBILE DIFF (2026-08-22) ödeme yönetimi yok:** Drawer **Ödeme Yönetimi**, profil/dashboard Portal CTA ve `/(member)/profile/payments` **yok** (rota profil’e yönlendirir). İptal/kart Stripe Portal ileride tasarlanır.
- Paketler **bağımsız faturalanır**; bir Stripe aboneliğini kapatmak diğerini durdurmaz.
- Feature gate SoT: Supabase `members` — client’ta mağaza entitlement okuma yok.

## 3b. Paneller

- **MOBILE DIFF (2026-08-17):** Admin paneli uygulamada **yok**. Admin giriş → `/(auth)/admin-web` (web `/admin` CTA). Üye + personel panelleri native.
- **MOBILE DIFF:** Public pazarlama SKIP sayfaları (stories, corporate, corporate-apply, team-apply) uygulamada **rota yok** — web’den.

## 4. Auth

- Production password login/signup: `POST /api/auth` — raw `signInWithPassword` production’da yok.
- `pending_registration` metadata şekli onboarding lock dosyasında birebir.
- `hasRegisteredMember` false iken panel chrome’da sahte isim yok.
- **MOBILE DIFF (2026-08-17):** Sosyal giriş (Google / Apple) kapalı — yalnız e-posta/şifre. Native Turnstile widget yok (`client: yeniform-mobile` + `x-yeniform-mobile-key`).
- **MOBILE DIFF:** Kayıt tek adım ücretsiz üyelik; iOS’ta satın alma CTA yok. Stepper (Hesap → Üyelik) yok.

## 5. Uygulama sırası (zorunlu)

Ana web proje: `/Users/mac/Desktop/Serenova-F-t/Adsız` (paket: `donusum-programi`).

```
1. yeniform-mobile-router skill
2. İlgili domain skill
3. docs/mobile screen + flow + contract
4. Web src dosyasını oku (pages/components/services/context) — birebir doğrula (zorunlu)
5. Kod
6. Acceptance checklist screen dosyasından
```

## 6. Gap protokolü

Spec eksikse:

```
GAP: <dosya yolu> — <ne eksik>
Öneri: <tek cümle>
Durum: blocked | needs-user
```

Kod yazmaya devam etme.

## 7. Demo / UI-only

`UI_ONLY_MODE` ve demo yığını **kaldırıldı**. Uygulama yalnız gerçek Supabase/API yollarını kullanır.
