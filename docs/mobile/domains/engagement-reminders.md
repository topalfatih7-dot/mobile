# Domain — Günlük alışkanlık hatırlatmaları (LOCK)

MOBILE DIFF. Web tarayıcıya bu ziller yok. Spec’te yokken uydurma ekran / su sayacı / yeni `members.data` kolonu yok.

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
| 10:30 | `habit_water` | Su → dashboard | Aynı |
| 12:30 | `habit_meal` / `habit_health` / `habit_upsell` | Öğün eksikse meal → takvim | Test eksikse health; değilse upsell |
| 16:00 | `habit_water` | Su | Aynı |
| 18:30 | `habit_workout` / `habit_health` / `habit_upsell` | Antrenman eksikse workout → takvim | 12:30 health ise atla; değilse health/upsell |
| 21:00 | `habit_streak` | Bugün görev kaldıysa → takvim | Atla (ücretsiz) |

En fazla 6; atlamalarla çoğu gün 4–5.

## Atlama

- Öğün: o gün beslenme girdisi yok veya öğünler tamam.
- Antrenman: o gün hareket yok veya tamam.
- Seri: bugünkü öğün+antrenman tamam (veya hiç görev yok).
- `now + 20dk` içindeki slot kurulmaz (uygulama açıkken rahatsız etme).
- Uygulama önde iken habit OS banner gösterilmez (`setNotificationHandler`).
- Geçmiş saatler kurulmaz. 7 gün ileri DATE trigger; her açılışta iptal + yeniden kur.

## Tap haritası

| action | route |
|--------|--------|
| `habit_motivation`, `habit_water`, `habit_winback` | `/(member)/dashboard` |
| `habit_meal`, `habit_workout`, `habit_streak` | `/(member)/calendar` |
| `habit_health` | `/(member)/health-test` |
| `habit_upsell` | `/(member)/profile/payments` |
| `reminder` (hoş geldin, action yok) | `/(member)/dashboard` |
| `appointment` | `/(member)/schedule` |
| `assignment` | `/(member)/profile` |

## Metin

[`src/data/engagementReminderCopy.ts`](../../src/data/engagementReminderCopy.ts) — gün tarihine göre döner. Başlıkta tek emoji; gövde Türkçe. İngilizce yok.

## Sunucu geri kazanım

24s+ açılmama → isteğe bağlı `habit_winback` Expo push (FCM + cron). FCM yokken yerel 7 günlük saatler yeter; winback bekler.
