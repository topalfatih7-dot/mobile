# Mobil Telegram bildirimleri — senin yapman gerekenler

Kaynak: `Serenova-F-t/docs/setup/TELEGRAM_SETUP.md`  
Mobil istemci: `src/services/telegramNotify.ts` → `POST {SITE}/api/telegram-notify`

Bot token **asla** mobil `.env` içine konmaz. Token yalnızca Vercel’de.

## Mimari

```
Mobil / Web  →  https://www.yeniform.com/api/telegram-notify  →  Telegram Bot API
                         ↑
              TELEGRAM_BOT_TOKEN + CHAT_ID (Vercel, gizli)
```

Mobil yalnızca opsiyonel `X-Notify-Secret` gönderir.

## Zaten Vercel’de olması gerekenler (web ile aynı)

Production (ve gerekirse Preview) için:

| Değişken | Nerede | Not |
|----------|--------|-----|
| `TELEGRAM_BOT_TOKEN` | Vercel | `VITE_` / `EXPO_PUBLIC_` yok |
| `TELEGRAM_CHAT_ID` | Vercel | Giriş/kayıt sohbeti |
| `TELEGRAM_NOTIFY_SECRET` | Vercel | Sunucu secret (opsiyonel ama önerilir) |
| `VITE_TELEGRAM_NOTIFY_SECRET` | Vercel (web build) | **Aynı** değer |

Bunlar web’de çalışıyorsa bot + chat ID tamamdır; mobilde yeniden bot kurmana gerek yok.

## Mobilde senin yapman gereken (tek kritik adım)

`mobile/.env` içine **web ile aynı** client secret’ı koy:

```env
EXPO_PUBLIC_TELEGRAM_NOTIFY_SECRET=<Vercel'deki VITE_TELEGRAM_NOTIFY_SECRET ile birebir aynı>
```

Kontrol:

1. [Vercel](https://vercel.com) → proje → Settings → Environment Variables  
2. `VITE_TELEGRAM_NOTIFY_SECRET` değerini kopyala  
3. Mobil `.env`’e `EXPO_PUBLIC_TELEGRAM_NOTIFY_SECRET=...` olarak yapıştır  
4. Expo’yu yeniden başlat (`npx expo start --clear`) — env build anında gömülür

Lokal web `.env` / `.env.local` içinde secret boş olabilir. Vercel kopyalamaya izin vermezse:
`Serenova-F-t/.env.example` içindeki `VITE_TELEGRAM_NOTIFY_SECRET` değerini kullan
(production ile aynı olduğu API testiyle doğrulandı: `{"ok":true}`).

## Secret yoksa ne olur?

- Vercel’de `TELEGRAM_NOTIFY_SECRET` **yoksa**: secret’siz istek de kabul edilebilir (dokümandaki kurulum).
- Vercel’de secret **var**, mobilde **yok/yanlış**: `401 Yetkisiz` → bildirim gitmez; giriş/kayıt yine çalışır (best-effort).

## Ne zaman bildirim gider? (mobil kod)

| Olay | Event (web ile aynı sözleşme) |
|------|-------------------------------|
| Üye/staff girişi | login event’leri |
| Çıkış | logout |
| Kayıt | signup |

Detay tablo: web `TELEGRAM_SETUP.md` § “Ne zaman bildirim gider?”

## Hızlı test (curl)

```bash
curl -X POST "https://www.yeniform.com/api/telegram-notify" \
  -H "Content-Type: application/json" \
  -H "X-Notify-Secret: SIZIN-SECRET" \
  -d "{\"event\":\"member_signup\",\"name\":\"Test\",\"email\":\"test@ornek.com\",\"membership\":\"free\"}"
```

`{"ok":true}` + Telegram mesajı → sunucu tamam; sonra mobil `.env` secret’ını doğrula ve uygulamadan giriş dene.

## Yapmana gerek olmayanlar

- BotFather’dan yeni bot (Vercel’de zaten varsa)
- Supabase Edge Function
- Mobil bundle’a `TELEGRAM_BOT_TOKEN` koymak
