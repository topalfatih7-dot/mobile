# 06 — Daily.co React Native

**Paketler:**  
- `@daily-co/react-native-daily-js` ^0.86.0  
- `@daily-co/react-native-webrtc` ^124.0.6-daily.2  

**Docs:** https://docs.daily.co/reference/rn-daily-js  
**Contract:** `docs/mobile/contracts/api-daily-room.md`  
**UI:** `src/components/call/VideoCallShell.tsx`

## Call client

```ts
import Daily, { DailyCall } from '@daily-co/react-native-daily-js';
const call: DailyCall = Daily.createCallObject();
await call.join({ url, token, startVideoOff?: boolean });
```

- Headless: Daily UI render etmez → custom shell
- Events: `joined-meeting`, `participant-joined`, `left-meeting` → `destroy()`
- Token: backend `/api/daily-room` (veya eşdeğer); client’ta Daily secret yok

## İzinler

- Camera + Microphone (expo-camera / native permission gate)
- İzin reddi → net TR hata; call’a zorla girme

## Fallback

Native Daily başarısız / web → WebView fallback (projede mevcut pattern). Testte her iki yolu da dene.

## Test (F06)

1. Üye randevu book → join window içinde “Katıl”
2. Kamera/mic prompt
3. Staff aynı odaya girer
4. Ayrıl → `destroy`, kaynak sızıntısı yok
5. Deep link `yeniform://call/:type/:id`
