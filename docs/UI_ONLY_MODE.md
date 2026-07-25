# UI-Only Mode — Detaylı Notlar

> **Durum:** Kapalı (`UI_ONLY_MODE = false`) — gerçek Supabase / API yolları aktif.  
> **Amaç:** Demo gezintisi için tekrar açılabilir.  
> **Tarih:** 2026-07-21

---

## 0. Özet

| Soru | Cevap |
|------|--------|
| Supabase client açılıyor mu? | **Evet** (`UI_ONLY_MODE=false`) |
| Login gerçek mi? | **Evet** — `POST /api/auth` |
| Mutations DB’ye yazıyor mu? | **Evet** |

Tek anahtar: `src/config/runtime.ts` → `UI_ONLY_MODE`

---

## 1. Demo roller (yalnız `UI_ONLY_MODE=true` iken)

| E-posta öneki | `role` | Hedef |
|---------------|--------|--------|
| `admin@` | admin | `/(admin)` |
| `coach@` / `staff@` | staff (coach) | `/(staff)` |
| `diet@` | staff (dietitian) | `/(staff)` (+ Lists) |
| `doctor@` | staff (doctor) | `/(staff)` |
| diğer | member | `/(member)/dashboard` |

---

## 2. Demo’ya geri dönmek

```text
1. src/config/runtime.ts  →  UI_ONLY_MODE = true
2. npx expo start -c
```

---

## 3. Bağlama checklist

```text
1. .env / .env.local: EXPO_PUBLIC_SUPABASE_* + API_BASE + DAILY_DOMAIN
2. UI_ONLY_MODE = false
3. IAP: EXPO_PUBLIC_REVENUECAT_API_KEY_IOS / _ANDROID (opsiyonel GAP)
4. Dev-client rebuild (Daily / RevenueCat / notifications)
```

## 4. İlgili

- Progress: `docs/AI_MOBILE_PROGRESS.md`
- Spec lock: `docs/mobile/IMPLEMENTATION-LOCK.md`
