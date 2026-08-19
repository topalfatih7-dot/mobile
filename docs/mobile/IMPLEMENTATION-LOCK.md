# IMPLEMENTATION LOCK — Uydurma yasağı

Bu dosya, uygulayıcı yapay zeka / geliştirici için **zorunlu** kurallardır. `docs/mobile/**` ve `.cursor/skills/**` ile çelişen hiçbir şey yapılamaz.

## 0. Temel yasa

1. **Spec’te yoksa ekleme.** Yeni ekran, endpoint, tablo kolonu, JSONB key, renk, font, paket id uydurma.
2. **Web’den farklı davranış uydurma.** Parity varsayılanı web’dir; sapma yalnızca bu klasörde “MOBILE DIFF” başlığıyla yazılıysa.
3. **Emin değilsen dur.** `appendices/G-open-questions-resolved.md` güncelle veya kullanıcıya sor — tahmin etme.
4. **Önce oku:** ilgili `screens/*`, `flows/*`, `contracts/*`, `domains/*`, sonra kod.

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

## 3. Ödeme

- **MOBILE DIFF (2026-08-15):** Uygulama içi IAP / RevenueCat **yok**. Satın alma ve abonelik yönetimi yalnız **web Stripe** (`contracts/api-stripe.md`).
- Mobil UX: plan/status Supabase’ten; CTA → login’li web `/plans` (üye paneli paket seç / güncelle). `screens/member/payments.md`.
- Handoff: aynı Supabase JWT (`/auth/callback?next=/plans&src=mobile#access_token&refresh_token`). Magic link / yeni session yok. Web tek-oturum claim+refresh bu akışta atlanır.
- Feature gate SoT: Supabase `members` — client’ta mağaza entitlement okuma yok. Ödeme sonrası uygulamaya otomatik dönüş yok; ön plana gelişte yalnız `members` satırı yenilenir.

## 3b. Paneller

- **MOBILE DIFF (2026-08-17):** Admin paneli uygulamada **yok**. Admin giriş → `/(auth)/admin-web` (web `/admin` CTA). Üye + personel panelleri native.
- **MOBILE DIFF:** Public pazarlama SKIP sayfaları (stories, corporate, corporate-apply, team-apply) uygulamada **rota yok** — web’den.

## 4. Auth

- Production password login/signup: `POST /api/auth` — raw `signInWithPassword` production’da yok.
- `pending_registration` metadata şekli onboarding lock dosyasında birebir.
- `hasRegisteredMember` false iken panel chrome’da sahte isim yok.
- **MOBILE DIFF (2026-08-17):** Sosyal giriş (Google / Apple) kapalı — yalnız e-posta/şifre. Native Turnstile widget yok (`client: yeniform-mobile` + `x-yeniform-mobile-key`).
- **MOBILE DIFF:** Kayıt tek adım ücretsiz üyelik; ücretli paket panel içinden web `/plans`. Stepper (Hesap → Üyelik) yok.

- **MOBILE DIFF (2026-08-15):** Uygulama içi IAP / RevenueCat **yok**. Satın alma ve abonelik yönetimi yalnız **web Stripe** (`contracts/api-stripe.md`).
- Mobil UX: plan/status Supabase’ten; CTA → login’li web `/plans` (üye paneli paket seç / güncelle). `screens/member/payments.md`.
- Handoff: aynı Supabase JWT (`/auth/callback?next=/plans&src=mobile#access_token&refresh_token`). Magic link / yeni session yok. Web tek-oturum claim+refresh bu akışta atlanır.
- Feature gate SoT: Supabase `members` — client’ta mağaza entitlement okuma yok. Ödeme sonrası uygulamaya otomatik dönüş yok; ön plana gelişte yalnız `members` satırı yenilenir.

## 4. Auth

- Production password login/signup: `POST /api/auth` — raw `signInWithPassword` production’da yok.
- `pending_registration` metadata şekli onboarding lock dosyasında birebir.
- `hasRegisteredMember` false iken panel chrome’da sahte isim yok.

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

## 7. UI-only bayrağı

`UI_ONLY_MODE` (`src/config/runtime.ts`) şu an **kapalı** (`false`) — gerçek Supabase/API yolları aktif. Demo gezintisi için tekrar `true` yapılabilir; detay: [`docs/UI_ONLY_MODE.md`](../UI_ONLY_MODE.md).
