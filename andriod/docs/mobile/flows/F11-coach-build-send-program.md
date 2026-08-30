# F11 — Coach Build & Send Program

1. Staff → Clients → member → Program (veya Programlarım kartı → aynı builder, `programId` ile düzenle)
2. Adım 1 **Süre** — 14 gün / özel aralık, paket pencereleri
3. Adım 2 **Günler** — kütüphaneden hareket **ekle** (`createCartEntry`: `sets` varsayılan 3, reps/süre, not). Satır **Bu günde** ise tekrar basınca o günden çıkar (`exerciseId`). Sepet sheet kısa özet + çöp + “Gün akışını düzenle”
4. Adım 3 **Akış** — `CoachProgramDayFlowEditor` (wizard adımı, yeni route değil): dolu günlerde set / tekrar veya süre / birim / not / sıra / sil. Ekleme yok
5. Adım 4 **Önizleme** — sayfa içi özet (günler, hareket, set × tekrar/süre, notlar). Nested Modal yok (iOS boş ekran)
6. **Gönder** — tek `CoachProgramSendModal` → `createProgram` / `updateProgram`. iOS `pageSheet` + `OverlayPortalProvider` (şeffaf Modal + `FormKeyboardScroll` `flex:1` boş ekran). `PlanDateField embedded` — iç içe tarih Modal yok
7. Üye Programs + Calendar’da görür

Edit: `rowToProgram` `staff_id` boşsa `data.staffId` kullanır; hydrate `sets` / amount alanlarını korur.
