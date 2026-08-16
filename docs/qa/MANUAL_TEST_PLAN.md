# Elle Test Planı — Yeni Form Mobile (sıfırdan)

> **Tarih:** 2026-08-06  
> **Nasıl çalışırız:** Sen sırayla aşamaları uygularsın → bulduğun her sorunu şu formatta atarsın → ben düzeltirim.  
> **Stack notları:** `docs/library-refs/`  
> **Ürün otoritesi:** `docs/mobile/IMPLEMENTATION-LOCK.md` + screen/flow dosyaları  

---

## Bug rapor formatı (kopyala-yapıştır)

```
AŞAMA: T0 / T1 / … (madde numarası)
CİHAZ: iOS 18 / Android 15 · model · dev-client / preview
HESAP: guest | member(plan=…) | staff(role=…) | admin
ADIMLAR:
1. …
2. …
BEKLENEN: …
GERÇEK: …
EKRAN / LOG: (screenshot veya kırmızı hata metni)
```

---

## Önkoşullar (T0) — başlamadan önce

### T0.1 Ortam

| # | Kontrol | Nasıl | OK? |
|---|---------|-------|-----|
| 1 | `.env.local` dolu | `EXPO_PUBLIC_SUPABASE_*`, `EXPO_PUBLIC_API_BASE_URL`, `EXPO_PUBLIC_YENIFORM_MOBILE_API_SECRET`, Daily (varsa) | ☐ |
| 2 | `UI_ONLY_MODE === false` | `src/config/runtime.ts` | ☐ |
| 3 | Dev client yüklü | `npm run build:dev:ios` veya android (veya mevcut build) | ☐ |
| 4 | Metro | `npm start` → cihazdan bağlan | ☐ |
| 5 | Native push dosyaları | `SETUP_REQUIRED.md` — yoksa T7 push’u “beklenen eksik” işaretle | ☐ |
| 6 | Test hesapları hazır | 1 guest yolu, 1 paid/free member, 1 coach, 1 dietitian, 1 doctor, 1 admin | ☐ |

### T0.2 Test hesap matrisi (sen doldur)

| Rol | Email | Plan/Not |
|-----|-------|----------|
| Yeni üye (kayıt) | | her testte yeni veya silinmiş |
| Free member | | |
| Paid member (eko/diyet/spor/…) | | |
| Coach | | |
| Dietitian | | |
| Doctor | | |
| Admin | | |

### T0.3 Smoke (opsiyonel ama iyi)

```bash
npx tsc --noEmit
npx expo start --dev-client
```

Uygulama açılır, kırmızı box yok → T1’e geç.

---

## T1 — Public / misafir (oturumsuz)

**Amaç:** Mağaza öncesi pazarlama + SEO/WebView yüzeyleri ayakta.

| # | Adım | Beklenen | Pass |
|---|------|----------|------|
| 1 | Soğuk açılış (logout) | Landing veya public home; panel chrome yok | ☐ |
| 2 | Landing scroll | Marka, CTA, TR copy; crash yok | ☐ |
| 3 | Üyelik / planlar | Plan kartları (free→vip sırası); fiyat/CTA | ☐ |
| 4 | Blog listesi | Published postlar (anon); boşsa “içerik yok” UX | ☐ |
| 5 | Blog detay | Başlık, gövde, tarih; geri navigasyon | ☐ |
| 6 | Hikayeler | Liste/detay açılır | ☐ |
| 7 | Hakkımızda | WebView veya native; yüklenir | ☐ |
| 8 | Ekip listesi + profil | Açılır; apply formu | ☐ |
| 9 | Kurumsal + başvuru | Form validation + submit (veya API hata mesajı net) | ☐ |
| 10 | Legal slug’lar | gizlilik, kvkk, vs. (`D-legal-slugs`) | ☐ |
| 11 | “Giriş” CTA | Login ekranı | ☐ |
| 12 | “Üye ol” CTA | Onboarding (`?plan=` varsa korunur) | ☐ |

**Bilinen dikkat:** Guest blog daha önce `useData().posts` boşalıyordu — düzeltilmiş olmalı; boşsa bug.

---

## T2 — Auth (email)

**Flow:** F01, F03 · Screen: login, forgot, reset, onboarding · Skill: `yeniform-auth-onboarding`

| # | Adım | Beklenen | Pass |
|---|------|----------|------|
| 1 | Yanlış şifre | Inline/API hata; session yok | ☐ |
| 2 | Boş alan validation | TR hata; submit engelli | ☐ |
| 3 | Doğru login (member) | Dashboard / panel; isim chrome’da | ☐ |
| 4 | Kill app → reopen | Session restore; tekrar login istemez | ☐ |
| 5 | Çıkış | Public/landing; geri tuşuyla panel’e sızma yok | ☐ |
| 6 | Forgot password | Email gönderildi mesajı | ☐ |
| 7 | Reset link (mümkünse) | Yeni şifre → login | ☐ |
| 8 | Turnstile (açıksa) | Fail → “Bot doğrulaması…”; pass → devam | ☐ |
| 9 | Production path | Login `/api/auth` üzerinden (raw supabase password yok) | ☐ |

### T2b — OAuth (F02)

| # | Adım | Beklenen | Pass |
|---|------|----------|------|
| 1 | Google (veya desteklenen) | Browser → callback → session | ☐ |
| 2 | Profil eksik | Onboarding `oauth=1` | ☐ |
| 3 | Profil tamam | Panel | ☐ |

---

## T3 — Onboarding + üyelik (F01 + F15)

| # | Adım | Beklenen | Pass |
|---|------|----------|------|
| 1 | Step 0: ad, email, tel, cinsiyet, şifre, legal | Validation; disposable email hata | ☐ |
| 2 | Step 1: plan + süre | free / eko / diyet / spor / doktor / vip | ☐ |
| 3 | Free kayıt | IAP yok; `members` free; Dashboard | ☐ |
| 4 | Paid → panel Ödemeler CTA | Web `/plans` (login’li Stripe); IAP/Paywall yok | ☐ |
| 5 | Web’de paket al → uygulamaya dön | `members` satırı yenilenir; paid özellikler | ☐ |
| 6 | Feature gate | Paid özellik üyelik satırına göre | ☐ |
| 7 | Restore / Customer Center | Yok — IAP iptal (2026-08-08) | — |
| 8 | — | — | — |
| 9 | Web Stripe üye → mobile login | Paid özellikler açık (F15) | ☐ |

**Not:** Native IAP yok. Ücretli paket = web Stripe `/plans`. T3.7–8 uygulanmaz.

---

## T4 — Üye paneli (chrome + drawer)

**Nav sırası (LOCK):** Profil → Panel → Sağlık Testleri → Takvim → Kalori → Mesajlar → Randevularım → Programlarım → Kütüphane → Bildirimler → Destek → Ödeme Yönetimi · (free: Planları İncele)

| # | Adım | Beklenen | Pass |
|---|------|----------|------|
| 1 | TopBar hamburger + logo | Açılır | ☐ |
| 2 | Drawer sıra | Yukarıdaki sıra birebir | ☐ |
| 3 | Badge’ler | unread chat / bildirim / destek / sağlık testi | ☐ |
| 4 | Her menü öğesi | Doğru ekran; header `PanelScaffold` | ☐ |
| 5 | Overlay tap / geri | Drawer kapanır | ☐ |
| 6 | free: Planları İncele | `/(public)/membership` | ☐ |
| 7 | Staff/admin URL denemesi | Redirect member home/profile | ☐ |

---

## T5 — Üye özellik ekranları

Her satır için: açılır · loading · empty · hata · ana CTA.

| # | Ekran | Kritik aksiyon | Pass |
|---|-------|----------------|------|
| 1 | Dashboard | Skor kartı, blog snippet, deep link’ler | ☐ |
| 2 | Sağlık hub | 6 kategori | ☐ |
| 3 | Sağlık section | Cevap kaydet, ilerleme | ☐ |
| 4 | Sağlık finish | Tamamlama → skor güncellenir (F04) | ☐ |
| 5 | Takvim | Öğün / antrenman complete (F05) | ☐ |
| 6 | Programlarım | Liste + detay | ☐ |
| 7 | Kütüphane | Filtre, thumb, video play (signed URL) | ☐ |
| 8 | Kalori metin AI | Sonuç / kota hata (F08) | ☐ |
| 9 | Kalori foto | ImagePicker + vision | ☐ |
| 10 | Randevular | Book / reschedule / cancel | ☐ |
| 11 | Session booker | Slot seçimi | ☐ |
| 12 | Video call | İzin → join → leave (F06) | ☐ |
| 13 | Mesajlar inbox | Unread-first; realtime + ~8s poll | ☐ |
| 14 | Mesaj thread | Gönder, kendi mesajda ses mute | ☐ |
| 15 | Bildirimler | Liste, okundu | ☐ |
| 16 | Destek | Ticket oluştur (F09) | ☐ |
| 17 | Profil | Alanlar kaydet | ☐ |
| 18 | Ödeme yönetimi | Plan durumu + Customer Center | ☐ |

---

## T6 — Staff paneli

**Drawer:** Genel Bakış, Profil, Danışanlar, Mesajlar + role’e göre Collab / Admin msg / Listeler / Programlar / Kütüphane / Ödeme

| # | Rol | Adım | Beklenen | Pass |
|---|-----|------|----------|------|
| 1 | Her staff | Login → `/staff` overview | ☐ |
| 2 | Her staff | Danışan listesi → detay | ☐ |
| 3 | Her staff | Client health görüntüle | ☐ |
| 4 | Coach | Program builder + gönder (F11) | ☐ |
| 5 | Coach | Kütüphane | ☐ |
| 6 | Dietitian | Listeler / nutrition (F12) | ☐ |
| 7 | Doctor | Programlar erişimi | ☐ |
| 8 | Coach/Diet | Collab messages | ☐ |
| 9 | Her staff | Admin messages | ☐ |
| 10 | Her staff | Member messages + reply → üye bildirimi | ☐ |
| 11 | Her staff | Video call | ☐ |
| 12 | Her staff | Force password (F10) varsa | ☐ |
| 13 | Her staff | Payments ekranı (Demo badge LOCK ise OK) | ☐ |
| 14 | Member URL | Staff → redirect staff home | ☐ |

---

## T7 — Admin paneli

| # | Ekran | Kritik | Pass |
|---|-------|--------|------|
| 1 | Overview | KPI/özet yüklenir | ☐ |
| 2 | Üyeler list + pagination | Arama / sayfa | ☐ |
| 3 | Üye detay + health | Açılır | ☐ |
| 4 | Paketler | Liste / düzen | ☐ |
| 5 | Premium assign | F13 — üye plan/expiry | ☐ |
| 6 | Başvurular | İncele + staff create | ☐ |
| 7 | Kütüphane CRUD | Upload / edit / pending | ☐ |
| 8 | Kadro (staff) | Liste | ☐ |
| 9 | Finans / payments | Liste | ☐ |
| 10 | Seanslar | Liste | ☐ |
| 11 | Mesajlar | Staff chat | ☐ |
| 12 | Messages audit | Thread audit sekmesi | ☐ |
| 13 | Destek | Ticket yanıt | ☐ |
| 14 | Blog list + `[id]` | CRUD | ☐ |
| 15 | İçerik | site_content | ☐ |
| 16 | Analitik / AI costs / Aktivite | Lite view | ☐ |
| 17 | Hesap / Abonelikler | Açılır | ☐ |

---

## T8 — Realtime, push, presence

| # | Adım | Beklenen | Pass |
|---|------|----------|------|
| 1 | 2 cihaz: üye↔staff mesaj | Anında veya ≤8s | ☐ |
| 2 | Presence | Online göstergesi (GAP olabilir — not et) | ☐ |
| 3 | Push permission | İlk açılışta prompt | ☐ |
| 4 | Expo push token log | Console / DB `device_push_tokens` | ☐ |
| 5 | Remote push (FCM hazırsa) | Banner + tap → doğru ekran | ☐ |
| 6 | Açık thread’de kendi mesaj | Bildirim sesi yok | ☐ |

---

## T9 — Deep link & güvenlik

| # | Adım | Beklenen | Pass |
|---|------|----------|------|
| 1 | `yeniform://auth/callback` | Callback handle | ☐ |
| 2 | `yeniform://call/…` | Call ekranı (auth’lu) | ☐ |
| 3 | `yeniform://messages/…` | Inbox/thread | ☐ |
| 4 | Oturumsuz protected deep link | Login → `from` geri | ☐ |
| 5 | Rol karışımı URL | Redirect doğru panel | ☐ |
| 6 | 404 / unknown route | not-found | ☐ |

---

## T10 — Performans / stabilite (kısa)

| # | Adım | Beklenen | Pass |
|---|------|----------|------|
| 1 | Library uzun liste | Scroll jank yok (virtualized) | ☐ |
| 2 | Admin members uzun | Pagination çalışır | ☐ |
| 3 | Background 5 dk → foreground | Session sağ; crash yok | ☐ |
| 4 | Airplane mode → aksiyon | Anlamlı TR hata | ☐ |
| 5 | Hızlı drawer spam | Crash / stuck overlay yok | ☐ |

---

## Önerilen günlük sıra (ilk tur)

1. **Bugün:** T0 → T1 → T2 → T4 (public + auth + chrome)  
2. **Sonra:** T5 (üye features) — en uzun  
3. **Sonra:** T3 (ödeme — web `/plans` CTA; IAP yok)  
4. **Sonra:** T6 staff → T7 admin  
5. **Son:** T8–T10  

Her aşama bitince buraya işaret koy veya bana “T1 bitti, şunlar fail” de.

---

## Hızlı referans — Flow ↔ Test

| Flow | Test |
|------|------|
| F01 register-pay | T3 |
| F02 oauth | T2b |
| F03 password reset | T2 |
| F04 health test | T5.2–4 |
| F05 calendar | T5.5 |
| F06 book+Daily | T5.10–12 |
| F07 chat | T5.13–14, T6.10, T8 |
| F08 calorie | T5.8–9 |
| F09 support | T5.16 |
| F10 force password | T6.12 |
| F11 coach program | T6.4 |
| F12 dietitian | T6.6 |
| F13 premium | T7.5 |
| F14 expiry | T3 + admin (manuel expiry) |
| F15 entitlement | T3.6–9 |

---

## Şimdi ne yap?

1. T0 checklist’i doldur (özellikle cihaz + hesaplar).  
2. **T1.1** ile başla — soğuk açılış misafir.  
3. İlk fail’i yukarıdaki bug formatında yapıştır.
