# 03 — Navigation

## Rol gate

| Durum | Hedef |
|-------|--------|
| Unauthenticated → protected | Login; `from` = intended path |
| Admin hit member/staff route | `/admin` |
| Staff hit member/admin | `/staff` |
| Member hit staff/admin | `/profile` or member home |
| Member auth but no `members` row | Onboarding `?plan=` (+ `oauth=1`) |

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
    corporate...
  (auth)/
    login.tsx
    forgot-password.tsx
    reset-password.tsx
    onboarding.tsx
    auth/callback.tsx
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

Profil → Panel → Sağlık Testleri → Takvim → Kalori Hesapla → Mesajlar → Randevularım → Programlarım → Kütüphane → Bildirimler → Destek → Ödeme Yönetimi.

Badge kaynakları: chatUnread, notificationUnread, openSupportTickets, healthTestIncomplete.

`membership === 'free'` → sonda “Planları İncele” (`/(public)/membership`).

## Staff drawer (sıra — `src/data/staffNav.ts`)

Base: Genel Bakış, Profilim, Danışanlarım, Mesajlar.  
+ Collab (coach/dietitian): Ekip Mesajları.  
+ Admin Mesajları.  
Dietitian: Listeler + Ödeme. Coach: Programlar + Kütüphane + Ödeme. Doctor: Programlar + Ödeme.

## Admin drawer (sıra — `src/data/adminNav.ts`)

Genel Bakış → Üyeler → Paketler → Premium Yönetimi → Başvurular → Kütüphane → Kadromuz → Finans & Ödemeler → Seanslar → Mesajlar → Destek Talepleri → Blog → İçerik → Analitik → YZ Gider → Aktivite → Hesap Ayarları → Abonelikler (MOBILE DIFF: inventory).

Desktop-heavy (analytics charts, bulk tables) simplified mobile views.

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
