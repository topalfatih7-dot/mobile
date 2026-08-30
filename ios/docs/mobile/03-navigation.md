# 03 — Navigation

## Rol gate

| Durum | Hedef |
|-------|--------|
| Unauthenticated → protected | Login; `from` = intended path |
| Admin login | `/(auth)/admin-web` — yönetim yalnız web (`/admin`) |
| Staff hit member | `/staff` |
| Member hit staff | member home |
| Member auth but no `members` row | Onboarding (ücretsiz tek adım) |

## Expo Router önerisi

```
app/
  index.tsx                 → redirect by role
  (public)/
    landing.tsx
    membership.tsx
    blog/...
    team/...
    legal/[slug].tsx
    corporate...              **MOBILE DIFF: rota yok**
  (auth)/
    login.tsx
    forgot-password.tsx
    reset-password.tsx
    onboarding.tsx
    admin-web.tsx             **MOBILE DIFF: admin web CTA**
  (member)/
    _layout.tsx             → PanelTopBar + PanelDrawer + Stack
    dashboard.tsx
    calendar.tsx
    programs.tsx
    messages/...
    schedule.tsx
    health-test/...
    calorie.tsx
    library.tsx
    notifications.tsx
    support.tsx
    profile/...
    call/[sessionType]/[sessionId].tsx
  (staff)/
    _layout.tsx             → PanelTopBar + PanelDrawer + Stack
    index.tsx
    clients/...
    notifications.tsx
    messages/...
    programs.tsx | lists.tsx
    library.tsx
    payments.tsx
    profile.tsx
    call/...
  (admin)/
    _layout.tsx             → PanelTopBar + PanelDrawer + Stack
    ...
```

## Panel chrome (web parity)

Bottom tab bar **yok**. Ana proje `PanelMobileMenu` ile aynı patern:

- **PanelTopBar** — hamburger + `BrandLogo` (logo variant) + (üye: bildirim zili)
- **PanelDrawer** — soldan slide-in (250ms), koyu overlay, nav listesi, çıkış
- İçerik: `Stack` `headerShown: false` (sayfa başlıkları `PanelScaffold`)

Kaynak: `src/components/panel/PanelChrome.tsx`, `PanelTopBar.tsx`, `PanelDrawer.tsx`.

## Member drawer (sıra — `src/data/memberNav.ts`)

Ana Sayfa → Profil → Sağlık Testleri → Takvim → Kalori Hesapla → Mesajlar → Randevularım → Programlarım → Kütüphane → Bildirimler → Destek.

Badge kaynakları: chatUnread, notificationUnread, openSupportTickets, healthTestIncomplete.

`membership === 'free'` → **iOS:** “Planları İncele” yok (`canOfferWebPurchase` false). **MOBILE DIFF (2026-08-22):** iOS drawer’da Ödeme Yönetimi yok.

Logo (top bar + drawer) `brandHref` ile Ana Sayfa’ya gider: üye `/(member)/dashboard`, personel `/(staff)`.

## Staff drawer (sıra — `src/data/staffNav.ts`)

Base: Ana Sayfa, Profilim, Danışanlarım, Bildirimler, Mesajlar.  
+ Collab (coach / dietitian / doctor): Ekip Mesajları.  
+ Admin Mesajları.  
Dietitian: Listeler + Ödeme. Coach: Programlarım + Kütüphane + Ödeme. Doctor: yalnızca Ödeme (Programlar / Kütüphane / Listeler yok).

## Admin drawer

**MOBILE DIFF (2026-08-17):** `app/(admin)` yok. Admin `/(auth)/admin-web`. Web spec: `screens/admin/*` (yalnız web uygulaması).

## Deep links

| Pattern | Screen |
|---------|--------|
| `yeniform://auth/callback` | Auth callback |
| `yeniform://reset-password` | Reset |
| `yeniform://call/:type/:id` | VideoCall |
| `yeniform://messages/:role` | Member chat |
| `yeniform://staff/messages/:memberId` | Staff chat |

## Web rota eşlemesi

Tam liste: [appendices/A-screen-inventory.md](appendices/A-screen-inventory.md).
