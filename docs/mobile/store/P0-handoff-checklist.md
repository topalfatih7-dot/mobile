# P0 — Hesap kurulumu (mağaza)

Mobil IAP / RevenueCat **yok** (2026-08-08). Play’de abonelik ürünü oluşturma. Satın alma: web Stripe.

## Bundle

- iOS/Android: `com.yeniform.app`
- Scheme: `yeniform://`

## Adımlar

1. **Apple Developer** — App ID `com.yeniform.app`, Push (IAP yok)
2. **Google Play** — uygulama `com.yeniform.app` — ürün kataloğu yok
3. **Supabase Auth** redirect: `yeniform://auth/callback`, `yeniform://auth/callback?next=reset-password`
4. **EAS** ✅ `projectId` = `460ad8b4-c94a-4933-885c-be703befe489` (owner `yeniforms-team`)
5. Android yayın runbook: [`android-play-store.md`](android-play-store.md)

## Handoff

```
EAS_PROJECT_ID=460ad8b4-c94a-4933-885c-be703befe489
PLAY_APP_CREATED=evet/hayır
PLAY_CLOSED_TESTERS=
ACCOUNT_DELETION_URL=  # 2026-08-20: tasarlanacak — Production Submit öncesi zorunlu
```
