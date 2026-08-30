# Staff — Overview (LOCK) (IMPLEMENTATION LOCK)

- Web: StaffOverviewPage.jsx
- Show: client count, upcoming sessions (gerçek `*Sessions`), join link
- Queues: **Onay bekleyen talepler** (`pending`) + **İptal talepleri** (`cancel_pending`) — Onayla/Reddet
- Staff cancel on upcoming: ≥24s anında; &lt;24s → `admin_cancel_pending` (admin onay yalnız web)
- Data: getStaffClients + `src/utils/staffAppointments.ts`
- Force password already handled by shell
- MOBILE DIFF — KPI kartları tıklanır:
  - Danışan → `/(staff)/clients`
  - Bu Hafta Randevu → aynı panelde randevu bloğuna kaydır (onay kuyruğu / yaklaşan)
  - Oluşturulan Program → koç `/(staff)/programs`, diyetisyen `/(staff)/lists`, doktor `/(staff)/clients`
