---
name: yeniform-staff-admin
description: >-
  Handles Yeni Form staff (coach/dietitian/doctor) and admin panels. Use when
  working on staff panel, koç program builder, diyetisyen listeler, danışanlar,
  admin premium, başvurular, seanslar, or admin CRUD operations.
---

# Yeni Form Staff & Admin

## Staff roles

| Role | Extra nav | Core tools |
|------|-----------|------------|
| coach | Programs, Library, Collab | Cart program builder → send modal |
| dietitian | Lists (not programs/library), Collab | Nutrition program builder |
| doctor | Base + messages | Clients, health notes, calls |

Force password when `tempPasswordIssued`. Clients via `getStaffClients()` (assignment + package).

## Admin

**MOBILE DIFF:** Admin paneli uygulamada yok. Admin login → `/(auth)/admin-web` → web `/admin`. Premium, başvurular, kütüphane CRUD web’de.

## Coach program builder UX

`StaffClientProgramPage`: library filters → cart entries (`createCartEntry`: reps/duration, order) → package date windows → `CoachProgramSendModal` → `createProgram`.

## Admin critical flows (web only)

Premium atama web admin. **Dondur / İptal paneli yok** — üye Stripe Portal (F16).

## Related

[reference.md](reference.md)
