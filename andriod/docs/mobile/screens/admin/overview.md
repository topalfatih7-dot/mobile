# Admin — Overview (IMPLEMENTATION LOCK)

**MOBILE DIFF (2026-08-17):** Bu klasördeki admin ekranları **yalnız web**. Mobilde `app/(admin)` yok; admin login → `/(auth)/admin-web`.

- Web: AdminOverviewPage — KPI cards from computeAdminStats / platform
- Charts: simplify on mobile but same metrics (members, sessions, tickets, assignment gaps)
- No invented KPIs
