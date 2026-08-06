# P0 — Hesap kurulumu + keys handoff (sen)

Kod tarafı P2 iskeleti paralel ilerler. Sandbox satın alma **bu checklist tamamlanmadan** test edilmez.

## Bundle

- iOS/Android: `com.yeniform.app`
- Scheme: `yeniform://`

## Store ürünleri (oluştur)

| Product ID | Tip |
|------------|-----|
| `yf_eko_diyet_1m` | auto-renew |
| `yf_eko_diyet_3m` | auto-renew |
| `yf_eko_diyet_6m` | auto-renew |
| `yf_eko_spor_1m` | auto-renew |
| `yf_eko_spor_3m` | auto-renew |
| `yf_eko_spor_6m` | auto-renew |
| `yf_diyet_1m` | auto-renew |
| `yf_diyet_3m` | auto-renew |
| `yf_diyet_6m` | auto-renew |
| `yf_spor_1m` | auto-renew |
| `yf_spor_3m` | auto-renew |
| `yf_spor_6m` | auto-renew |
| `yf_vip_1m` | auto-renew |
| `yf_vip_3m` | auto-renew |
| `yf_vip_6m` | auto-renew |
| `yf_doktor_once` | one-time |

Fiyat referansı: web `PLAN_PRICING` (`eko_diyet` / `eko_spor` ≈ eski eko; `diyet`/`spor`/`vip`/`doktor`).

Eski `yf_eko_*` (tek eko) **satma** — web’de `eko` artık satılmıyor.

## Adımlar

1. **Apple Developer** — App ID `com.yeniform.app`, In-App Purchase, Push
2. **App Store Connect** — app + subscription group + yukarıdaki ürünler + Sandbox tester
3. **Google Play** — aynı product id’ler + lisans test hesabı
4. **RevenueCat** — iOS/Android app bağla, ürünleri import, Default Offering, entitlement(s)
5. **Webhook** (kod deploy sonrası): URL `https://www.yeniform.com/api/revenuecat-webhook`  
   Authorization: `Bearer <REVENUECAT_WEBHOOK_SECRET>`
6. **Supabase Auth** redirect (yoksa): `yeniform://auth/callback`, `yeniform://auth/callback?next=reset-password`
7. **EAS** ✅ `projectId` = `0799a1b3-4e0a-4d73-9961-918878977fbb` (`app.json` extra.eas)

## Handoff (chat’e yapıştır)

```
EXPO_PUBLIC_REVENUECAT_API_KEY_IOS=
EXPO_PUBLIC_REVENUECAT_API_KEY_ANDROID=
REVENUECAT_WEBHOOK_SECRET=
EAS_PROJECT_ID=
ASC_PRODUCTS_OK=evet/hayır
PLAY_PRODUCTS_OK=evet/hayır
```

Mobil `.env` / EAS secrets + Vercel `REVENUECAT_WEBHOOK_SECRET` doldurulur → sandbox smoke.
