# P3 Push — test kapısı

## Kod (bu faz)

- [x] `device_push_tokens` migration (Supabase)
- [x] Client token upsert (`registerForPushNotifications(userId)`)
- [x] `/api/application-notify` → Expo Push (`_expoPush.js`)
- [x] `pushNotifs === false` skip
- [x] Navigate map data: chat / program / availability / support
- [x] Program create + support admin reply → notify + push
- [x] Foreground yerel OS banner (`presentSystemNotification` — in-app notif gelince)
- [x] iOS `UIBackgroundModes: audio + voip + remote-notification`

## Kritik

**Tarayıcı / Expo web’de OS push yok.** Fiziksel telefonda **native** (Expo Go veya development/production build).

`device_push_tokens` boşsa arka planda remote push gelmez — üye login sonrası satır görünmeli.

## Cihaz smoke (sen)

1. Üye login (native) → bildirim izni **İzin Ver**
2. Supabase: `device_push_tokens` satırı var mı? (`ExponentPushToken[...]`)
3. Uygulama **açık** → staff mesaj → telefon üstünden banner
4. Uygulama **arka planda** → staff mesaj → OS push (token + deploy şart)
5. Tap → `/(member)/messages/{role}`
6. Profilde push kapalı → remote gitmez

Deploy: web `api/application-notify.js` + `_expoPush.js` production’da olmalı.
