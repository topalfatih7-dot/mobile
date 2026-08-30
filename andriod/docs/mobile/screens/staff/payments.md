# Staff — Payments (LOCK) (IMPLEMENTATION LOCK)

- **Expo:** `/(staff)/payments` (iOS: `app/staff/payments`)
- **Web:** `PaymentManagementPage.jsx` → `StaffPayments` / `useStaffEarnings` / `StaffPayoutAccountCard` / `StaffEarningsHistory`
- Live `staff_earnings` by `staff_id` (no mock / no Demo badge)
- Hero: görüşme başı net hakediş + Cuma EFT/IBAN + Cuma 00:00–Perşembe 23:59 (İstanbul) + sayılır / sayılmaz
- KPI: Bekleyen Hakediş (ödeme Cuma etiketi), Bu Ay Seans (**Seans başı**), Toplam Kazanç
- **Banka ve IBAN** — `staff_payout_accounts`; banka IBAN’dan otomatik; hesap sahibi = panel adı; isim uyarısı
- History: dönem grubu + her seans danışan / İstanbul tarihi / tür / eşzamanlı dk
- Do not invent payout math — amounts come from `staff_earnings.amount_try`
