# Yeni Form — Mobil

Expo (**SDK 56**) React Native uygulaması. Kaynak: web `Serenova-F-t/Adsız` + (varsa) blueprint `docs/rn-migration/`.

## AI / yazılımcı — nereden bakılır?

| Sıra | Dosya | İçerik |
|------|--------|--------|
| 1 | [`docs/README.md`](./docs/README.md) | Doküman indeksi |
| 2 | [`docs/AI_MOBILE_PROGRESS.md`](./docs/AI_MOBILE_PROGRESS.md) | Durum, P0/P1, env, tuzaklar |
| 3 | [`docs/CODEMAP.md`](./docs/CODEMAP.md) | “X hangi dosyada?” |
| 4 | [`docs/ARCHITECTURE.md`](./docs/ARCHITECTURE.md) | Stack, auth, chat, realtime |

Kural: belgelenmeyen davranışı uydurma; web `src/services` ile parity.

## Çalıştırma

```bash
cp .env.example .env
# EXPO_PUBLIC_SUPABASE_* ve EXPO_PUBLIC_SITE_URL doldur
npm install
npm run start:go
```

- Metro: http://localhost:8081  
- Dev client: `npm start` (`--dev-client`)  
- Ops: [`docs/MOBILE_OAUTH_SETUP.md`](./docs/MOBILE_OAUTH_SETUP.md), [`docs/MOBILE_TELEGRAM_SETUP.md`](./docs/MOBILE_TELEGRAM_SETUP.md)

## Dizin özeti

```
app/           Expo Router (auth | app | staff | admin)
src/context/   AppContext, Toast
src/services/  Auth, realtime, presence, telegram, db/*
docs/          Progress + CODEMAP + ARCHITECTURE + ops
```
