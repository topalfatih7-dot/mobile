# API — request / respond cancel + reschedule

`POST /api/auth` (Bearer JWT). Web + mobil aynı.

## `action: 'request-cancel-session'`

### Body

```json
{
  "action": "request-cancel-session",
  "sessionId": "bk-…",
  "sessionType": "coach|dietitian|doctor",
  "memberId": "uuid (personel/admin için zorunlu; üye self’te yok)",
  "forceAdmin": false
}
```

### Outcomes (`outcome`)

| Actor | Koşul | outcome |
|-------|--------|---------|
| Üye | `pending` | `cancelled` (`pending_withdraw`) |
| Üye | `scheduled`/`rescheduled` ≥24s | `cancel_pending` |
| Üye | &lt;24s | 400 hata |
| Personel | ≥24s | `cancelled` |
| Personel | &lt;24s | `admin_cancel_pending` |
| Admin + `forceAdmin` | her zaman | `cancelled` |

## `action: 'respond-cancel-session'`

Personel: `cancel_pending` → `approve` (`cancelled`) / `reject` (önceki status).

## `action: 'respond-admin-cancel'`

Admin (web): `admin_cancel_pending` → `approve` / `reject`.

## `action: 'reschedule-session'`

Üye: ≥24s; `days` varsayılan koç 3 / diğer 5. &lt;24s → 400.

## Slot

`staff_booked_slots` aktif: `pending`, `scheduled`, `rescheduled`, `cancel_pending`, `admin_cancel_pending`.
