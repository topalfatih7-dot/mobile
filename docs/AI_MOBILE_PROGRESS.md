# Yeni Form Mobile — AI Progress Report

> **Tek durum kaynağı**  
> İndeks: [`docs/README.md`](./README.md) · Parity: [`FEATURE_PARITY.md`](./FEATURE_PARITY.md) · Yol: [`ROADMAP.md`](./ROADMAP.md) · Tasarım: [`DESIGN_SYSTEM.md`](./DESIGN_SYSTEM.md)
>
> **Son güncelleme:** 2026-07-14 (Tur M–P — tam derinlik parity)

---

## 0. 60 saniyede başla

1. Bu dosya + ROADMAP + FEATURE_PARITY + DESIGN_SYSTEM  
2. Web: `../Serenova-F-t/src/`  
3. Expo **v56** · `npm run start:go`

**Kural:** Belgelenmeyen davranışı uydurma. Ekstra özellik yok.

---

## 1. Turlar

| Tur | Konu | Durum |
|-----|------|-------|
| A–L | Auth → Lumina → rota iskeletleri | ✅ |
| **M** | Üye: booking, health-test Q, calorie foto+gate, library video, payments/calendar | ✅ |
| **N** | Staff: lists/library/payments + client program/health | ✅ |
| **O** | Admin CRUD: plans/blog/content/library/applications/support + paneller | ✅ |
| **P** | Public: apply API, legal full, membership CTA | ✅ |

---

## 2. Yeni servisler (Tur M–O)

| Dosya | Ne |
|-------|-----|
| `db/sessions.ts` | bookStaffSession, getStaffBookedSlots, cancel via patch |
| `utils/memberPackages.ts` | photo/manual calorie + video gates |
| `aiVision.ts` | `/api/ai-food-vision` |
| `data/healthTest*.full.js` | web soru setleri |
| `db/plans|blog|content|applications|activities.ts` | admin CRUD |

AppContext: `bookSession`, `cancelSession`, `rescheduleSession`, `getStaffBookedSlots`.

---

## 3. Sonraki (opsiyonel derinlik)

- Stripe Customer Portal (web’de varsa)  
- Native Daily embed  
- OneSignal EAS build  
- Admin video upload storage flow  

---

## 4. Runtime

- AsyncStorage 2.2.0 · Outfit + Manrope  
- `expo-image-picker` + `expo-file-system/legacy` (kalori foto)
