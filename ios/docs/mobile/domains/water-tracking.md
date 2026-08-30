# Domain — Su takibi (LOCK)

Web SoT: ana repo [`docs/WATER_TRACKING.md`](../../../../../Serenova-F-t/Adsız/docs/WATER_TRACKING.md) (ajan web repo’yu da okur). Bu dosya mobil lock; uydurma yok.

**Web uygulandı (2026-08-25).** Mobil kod web `src/components/water/*` ve `src/utils/waterTracking.js` birebir port. Yeni rota / yeni JSONB log dizisi / bardak sayacı yok.

## Ürün (kısaltma)

- Varsayılan hedef **2000 ml**. Üye değiştiremez. Diyetisyen/admin `rpc set_member_water_goal`.
- Kayıt yalnız **ml** (1–1000). “8 bardak” yok. Bilgi: **Ortalama bir su bardağı yaklaşık 200 ml’dir.**
- Tablo `member_water_logs`. Hedef `members.data.waterTracking`.
- `local_date` cihaz yerel `yyyy-MM-dd` (takvim). `Europe/Istanbul` ile karıştırma.
- Üye loglar; personel SELECT; INSERT personelde yok.

## UI

- Dashboard grafik grid **ilk hücre**: `WaterCarafeCard` `size=full` (kristal karaf, gold çerçeve, `.water-carafe-card`). StatsCard’a ekleme. **Lock istisnası:** yeni KPI değil; bu kart bilinçli süslü.
- Calendar day sheet üstü: `size=compact`. Ay hücresinde su noktası yok. Unpaid takvim kapısı durur; su panelden girilir.
- Staff client health / bilgiler: `StaffWaterProgress` (bar, karaf yok). Hedef input yalnız dietitian + admin.
- Nav’a Su yok. Seri suya bağlanmaz.

SVG path ve copy: web `WaterCarafeCard.jsx` + `WATER_COPY`.

## Bildirimler

- `habit_water` saatleri aynı. Hedef dolduysa o gün kurulmaz. Gövde kalan ml. Tap dashboard. Quick-add yok.
- `action: water_goal_updated` → `/(member)/dashboard` (liste + Expo). WhatsApp yok.
- Android reboot: mevcut MOBILE DIFF (`BOOT_COMPLETED` yok).

## Contracts

- Tablo + RLS + RPC: web migration `20260825_member_water_logs.sql`
- Client: `from('member_water_logs')` + `rpc('set_member_water_goal')`
- `saveMemberPatch` waterTracking yutması web’de var; port et.

## Acceptance

- [ ] 2000 ml default; üye hedef input yok
- [ ] ml number + Ekle + geri al; bardak UI yok
- [ ] Karaf fill % hedefe göre; hedef dolunca sage + **Hedef doldu**
- [ ] habit_water skip when `todayMl >= goal`
- [ ] water_goal_updated tap dashboard
- [ ] Dietitian RPC; coach hedef kaydı 403/exception
