# Domain — Günlük alışkanlık hatırlatmaları (LOCK)

Spec’te yokken uydurma ekran / yeni `members.data` kolonu yok. **Su takibi (2026-08-25) lock:** [`water-tracking.md`](water-tracking.md) — sayaç + karaf spec’te var; bardak sayacı hâlâ yasak.

## Amaç

Üye uygulamayı günde birkaç kez açsın. Koç mesajı gibi anlık sunucu zili değil; telefonda kurulmuş saatli OS bildirimi.

## Kim

Herkes (ücretsiz dahil). `members.data.settings.reminderNotifs === false` → hiçbir habit kurulmaz. Sistem izni yoksa kurulmaz.

## Kanal

- Yalnız OS (kilit ekranı / üst şerit). **Bildirimler listesine yazılmaz.**
- `type: reminder` + `action: habit_*` (yeni kolon yok).
- Profil **Hatırlatıcılar** anahtarı bu sistemi de keser.

## Saatler (cihaz saati, 22:00–08:00 sessiz)

| Saat | action | Ücretli + o gün içerik | Ücretsiz / içerik yok |
|------|--------|------------------------|------------------------|
| 08:30 | `habit_motivation` | Motivasyon → dashboard | Aynı |
| 09:00 | `habit_daily_tip` | Günün ipucu (günde 1) → dashboard | Aynı |
| 10:30 | `habit_water` | Su → dashboard. Hedef dolduysa (`todayMl >= goal`, default 2000) **kurulmaz**. Gövde kalan ml. | Aynı skip kuralı |
| 12:30 | `habit_meal` / `habit_health` / `habit_upsell` | Öğün eksikse meal → takvim. **Program saati öğünü varsa atla** | Test eksikse health; değilse upsell |
| 14:00 | `habit_water` | Su → dashboard. Hedef dolduysa kurulmaz. | Aynı |
| 16:00 | `habit_water` | Su. Hedef dolduysa kurulmaz. | Aynı |
| 18:30 | `habit_workout` / `habit_health` / `habit_upsell` | Antrenman eksikse workout → takvim. **Program saati antrenmanı varsa atla** | 12:30 health ise atla; değilse health/upsell |
| 20:00 | `habit_no_activity` / `habit_motivation` | Ücretli + program var + o gün hiç öğün/antrenman işaretlenmediyse `habit_no_activity` → takvim; değilse motivasyon | Motivasyon |
| 21:00 | `habit_streak` | Bugün görev kaldıysa → takvim | Atla (ücretsiz) |

En fazla 9 habit slot + program saati zilleri. Atlamalarla çoğu gün 6–8 habit. Günün ipucu **günde bir** (09:00); listeye yazılmaz. Bugünün gövdesi API ipucu, sonraki günler yedek havuz.

## Program saati (Tip 1) — `habit_program_meal` / `habit_program_workout`

MOBILE DIFF. Girdi: `programs.data.entries[].start` (`HH:MM`). Yeni kolon yok.

- Beslenme: öğün grubu başına 1 zil (en erken `start`). Tamamlanan öğün atlanır.
- Antrenman: aynı `start` saatindeki egzersizler tek zil. Tamamlanan hareket atlanır.
- `start` yoksa Tip 1 kurulmaz (generic 12:30 / 18:30 kalır).
- 22:00–08:00 sessiz (`isQuietLocalHour`). 08:00 dahil.
- ID: `yf-prog-meal-{mealType}-{YYYY-MM-DD}` / `yf-prog-wo-{HHmm}-{YYYY-MM-DD}`.
- Generic `habit_meal` / `habit_workout` o gün Tip 1 kurulduysa **kurulmaz** (replace).
- Tap → takvim. Listeye yazılmaz.

## Başlanmama (Tip 2) — `habit_no_activity`

20:00 slot. Ücretli + o gün öğün veya antrenman var + **hiçbir öğün grubu ve hiçbir antrenman işaretlenmemiş** (`mealNoneStarted` ve `workoutNoneStarted` — olmayan tür muaf). Aksi halde `habit_motivation`. Tap → takvim.

## Atlama

- Öğün: o gün beslenme girdisi yok veya öğünler tamam.
- Antrenman: o gün hareket yok veya tamam.
- Seri: bugünkü öğün+antrenman tamam (veya hiç görev yok).
- `now + 20dk` içindeki slot kurulmaz (uygulama açıkken rahatsız etme).
- Uygulama önde iken habit OS banner gösterilmez (`setNotificationHandler`).
- Geçmiş saatler kurulmaz. 7 gün ileri DATE trigger; her açılışta iptal + yeniden kur. iOS 64 tavan: ateşleme zamanına göre en yakın **60** slot kurulur.
- **MOBILE DIFF (2026-08-21):** Ses OS `default` (`yeniform-alerts-v3`). `BOOT_COMPLETED` yok — reboot sonrası yerel DATE slot’ları uygulama açılana kadar kurulmaz; FCM `habit_winback` + açılışta sync durur.
- **MOBILE DIFF (2026-08-22) iOS:** `habit_upsell` slot’u kurulmaz (`canOfferWebPurchase`). 12:30/18:30 ücretsiz + test tamam → atla.

## Tap haritası

| action | route |
|--------|--------|
| `habit_motivation`, `habit_water`, `habit_winback`, `habit_daily_tip` | `/(member)/dashboard` |
| `habit_meal`, `habit_workout`, `habit_streak`, `habit_program_meal`, `habit_program_workout`, `habit_no_activity` | `/(member)/calendar` |
| `habit_health` | `/(member)/health-test` |
| `habit_upsell` | `/(member)/profile/payments` (**iOS MOBILE DIFF 2026-08-22:** kurulmaz; eski/FCM tap → dashboard) |
| `reminder` (hoş geldin, action yok) | `/(member)/dashboard` |
| `appointment` | `/(member)/schedule` |
| `assignment` | `/(member)/profile` |

## Metin

[`src/data/engagementReminderCopy.ts`](../../src/data/engagementReminderCopy.ts) — gün tarihine göre döner. Başlıkta tek emoji; gövde Türkçe. İngilizce yok.

## Sunucu geri kazanım

24s+ açılmama → isteğe bağlı `habit_winback` Expo push (FCM + cron). FCM yokken yerel 7 günlük saatler yeter; winback bekler.
