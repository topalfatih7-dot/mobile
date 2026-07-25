# Expo HAS CHANGED

Read the exact versioned docs at https://docs.expo.dev/versions/v56.0.0/ before writing any code.

## Her işte zorunlu (asla atlama)

1. **Önce** [`docs/mobile/IMPLEMENTATION-LOCK.md`](docs/mobile/IMPLEMENTATION-LOCK.md) oku ve uygula.  
2. Sonra [`.cursor/skills/yeniform-mobile-router/SKILL.md`](.cursor/skills/yeniform-mobile-router/SKILL.md) → ilgili domain skill.  
3. İlgili `docs/mobile/screens|flows|contracts|domains` — sonra kod.  
4. **Web kaynak:** `/Users/mac/Desktop/Serenova-F-t/Adsız` (`donusum-programi`) — ilgili `src/pages|components|services|context` dosyasını oku, birebir doğrula.  
5. Spec’te yoksa **ekleme**; gap protokolü.

**Otorite:** Web projesi (`/Users/mac/Desktop/Serenova-F-t/Adsız`) + `docs/mobile/` + `.cursor/skills/`. Web parity zorunlu; sapma yalnızca “MOBILE DIFF” ile yazılıysa. Uydurma alan/ekran/endpoint yasak.

## UX / UI kalite çubuğu (LOCK içinde)

- Renk, radius, font: **yalnız** [`02-design-system.md`](docs/mobile/02-design-system.md) tokenları.  
- Layout sırası: ilgili **screen LOCK** dosyası. Copy: screen + `C-copy-strings.md`.  
- İzinli: mesh/gradient atmosfer, Reanimated (fade/slide), net hiyerarşi, bol marka rengi (brand/sage/warm/mint/gold).  
- Yasak: yeni mor tema, uydurma ekran/alan, “daha modern” diye LOCK dışı kart/hero, İngilizce UI.

## Stack

Expo SDK **56** + Expo Router · Auth/Data/Actions Context · Ödeme: RevenueCat IAP (Stripe Checkout yok)

## Progress

[`docs/AI_MOBILE_PROGRESS.md`](docs/AI_MOBILE_PROGRESS.md)
