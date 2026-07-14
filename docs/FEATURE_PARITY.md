# Yeni Form Mobile — Feature Parity Matrix

> Web otorite: `Serenova-F-t/src` + `docs/rn-migration/05-navigation-graph.md`  
> **Son güncelleme:** 2026-07-14 (Tur N/O/P — staff depth, admin CRUD, public submit/legal)  
> Legend: `✅` var · `🟡` kısmi · `❌` yok · `⏭` web-only (RN’e taşınmaz)

**Kurallar:** Ekstra özellik eklenmez. Var olan özellik sormadan çıkarılmaz. Belgelenmeyen davranış uydurulmaz.

---

## 0. Bilinçli sınırlar (sorulmadan yapılmaz)

| Madde | Durum |
|-------|--------|
| Apple Sign-In | ⏭ web’de yok |
| Native Daily SDK embed | ⏭ mevcut: browser join |
| OneSignal native | 🟡 stub; Expo Notifications devam |
| GA4 / sitemap / SEO / JsonLd | ⏭ web-only |
| `ScrollToTop` / `<head>` SEO | ⏭ web-only |

---

## 1. Auth / chromeless

| Web | Mobil | Durum |
|-----|-------|--------|
| `/auth/callback` | `app/(auth)/callback.tsx` + `app/auth/callback.tsx` | ✅ |
| `/login` | `app/(auth)/login.tsx` | ✅ Lumina AuthScaffold |
| `/register` → `/onboarding` | `register.tsx` + `onboarding.tsx` | ✅ plan query → onboarding |
| `/forgot-password` | `forgot-password.tsx` | ✅ |
| `/reset-password` | `reset-password.tsx` | ✅ |
| Google OAuth | `oauthAuth.ts` + SocialAuthButtons | ✅ |
| Single-session | `singleSession.ts` | ✅ |
| Staff force password | `StaffForcePasswordChange` | ✅ |
| Email/phone verification | `authVerification.ts` | ✅ |

---

## 2. Public / marketing

| Web | Mobil | Durum |
|-----|-------|--------|
| `/` Landing | `app/index.tsx` (welcome) + `app/(public)/index.tsx` | 🟡 welcome + public landing |
| `/membership` | `app/(public)/membership.tsx` | ✅ free→register; paid→register?plan veya Stripe (oturumlu) |
| `/hakkimizda` | `app/(public)/about.tsx` | 🟡 |
| `/stories` | `app/(public)/stories.tsx` | 🟡 |
| `/blog`, `/blog/:id` | `app/(public)/blog/*` | 🟡 |
| `/team/coaches\|dietitians\|doctors` | `app/(public)/team/index.tsx` (role/chip) | 🟡 |
| `/team/:id` | `app/(public)/team/[id].tsx` | 🟡 |
| `/team/apply` | `app/(public)/team/apply.tsx` | ✅ `submit_staff_application` RPC |
| `/corporate`, `/corporate/apply` | `app/(public)/corporate/*` | ✅ apply → `submit_corporate_application` |
| `/legal/:slug` (+ kvkk/privacy/terms) | `app/(public)/legal/[slug].tsx` | ✅ tam metin (`src/data/legal`) |
| `*` 404 | Expo default | 🟡 |

---

## 3. Member

| Web | Mobil | Durum |
|-----|-------|--------|
| `/dashboard` | `app/(app)/index.tsx` | 🟡 UI → Lumina |
| `/programs` | `programs.tsx` + `program/[id]` | 🟡 |
| `/messages`, `/messages/:role` | `messages/*` | 🟡 |
| `/profile` | `profile/index.tsx` | 🟡 |
| `/profile` edit / settings | `edit`, `settings` | 🟡 |
| `/notifications` | `profile/notifications.tsx` | 🟡 |
| `/support` | `profile/support.tsx` | 🟡 |
| `/profile/payments` | `profile/payments.tsx` | ✅ geçmiş + yükselt CTA |
| `/schedule` (+ tabs) | `schedule.tsx` | ✅ book/cancel + slots |
| `/calorie` | `calorie.tsx` | ✅ text + photo + paket gate |
| `/health-test` (+ section/finish) | `health-test/*` | ✅ gerçek sorular + patch |
| `/calendar` | `calendar.tsx` | ✅ liste + randevu CTA |
| `/library` | `library.tsx` | ✅ detay + signed video |
| `/call/:type/:id` | `call/[type]/[sessionId]` | 🟡 browser join |
| Team / membership / measurements | `profile/team`, `membership`, `measurements` | 🟡 |

**Nav notu:** Web 12–13 sidebar item. Mobil: floating tabs (Ana / Program / Mesaj / Daha) + `more.tsx` üzerinden kalan rotalar (`href: null`).

---

## 4. Staff

| Web | Mobil | Durum |
|-----|-------|--------|
| `/staff` | `app/(staff)/index.tsx` | 🟡 |
| `/staff/clients` | `clients/index.tsx` | 🟡 |
| `/staff/clients/:id/health` | `clients/[id]/health.tsx` | ✅ healthTest cevapları + profil |
| `/staff/clients/:id/program` | `clients/[id]/program.tsx` | ✅ liste + ata / not |
| `/staff/messages` (+ id) | `messages/*` | 🟡 |
| `/staff/admin-messages` | messages tab | 🟡 |
| `/staff/collab-messages` | messages tab (coach/dietitian) | 🟡 |
| `/staff/programs` | `programs.tsx` | 🟡 |
| `/staff/lists` (dietitian) | `lists.tsx` | ✅ nutrition program listeleri |
| `/staff/library` | `library.tsx` (gate → lists) | ✅ `fetchLibraryExercises` |
| `/staff/payments` | `payments.tsx` | ✅ atanmış danışan ödemeleri |
| `/staff/profile` | `profile.tsx` (+ role links) | 🟡 |
| `/staff/call/...` | `call/...` | 🟡 |
| Role-conditional nav | profil kısayolları + library/programs gate | 🟡 tabs sabit; links role-aware |

---

## 5. Admin

| Web | Mobil | Durum |
|-----|-------|--------|
| `/admin` | `app/(admin)/index.tsx` (nav hub) | 🟡 |
| `/admin/members` (+ health) | `members/[id]` kısmi | 🟡 |
| `/admin/messages` (+ staff/audit/collab) | `messages/*` | 🟡 |
| `/admin/plans` | `plans.tsx` | ✅ getPlans / upsertPlan |
| `/admin/premium` | `premium.tsx` | ✅ ücretli üye listesi |
| `/admin/applications` | `applications.tsx` | ✅ staff/corporate resolve |
| `/admin/library` | `library.tsx` | ✅ exercise add/edit/remove |
| `/admin/staff` | `staff.tsx` | 🟡 dizin listesi |
| `/admin/blog` | `blog.tsx` | ✅ add/edit/remove posts |
| `/admin/content` | `content.tsx` | ✅ site_content CRUD |
| `/admin/payments` | `payments.tsx` | ✅ tüm ödemeler |
| `/admin/subscriptions` | `subscriptions.tsx` → payments | ✅ redirect parity |
| `/admin/sessions` | `sessions.tsx` | ✅ member session özeti |
| `/admin/support` | `support.tsx` | ✅ tickets + reply/status |
| `/admin/analytics` | `analytics.tsx` | 🟡 |
| `/admin/activity` | `activity.tsx` | ✅ activities log |
| `/admin/account` | `account.tsx` | 🟡 |

---

## 6. Özet sayaçlar (Tur N/O/P sonrası)

| Alan | ✅/🟡 | ❌ | ⏭ |
|------|-------|----|---|
| Auth | 8 | 0 | 1 (Apple) |
| Public | ~4 ✅ / ~7 🟡 | 0 rota | SEO |
| Member | ~12 🟡 | — | — |
| Staff | ~5 ✅ depth / ~9 🟡 | 0 rota | — |
| Admin | ~10 ✅ CRUD/liste / ~6 🟡 | 0 rota | — |

Faz ilerledikçe bu dosya güncellenir. Video oynatıcı, Stripe portal, premium atama RPC derinliği hâlâ 🟡.
