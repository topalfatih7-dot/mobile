# Yeni Form — Mobile

Expo SDK **56** native uygulama iskeleti. Ürün spesifikasyonu self-contained: `docs/mobile/`.

## Başlangıç (AI / yazılımcı)

| Sıra | Dosya |
|------|--------|
| 1 | [`docs/mobile/IMPLEMENTATION-LOCK.md`](./docs/mobile/IMPLEMENTATION-LOCK.md) |
| 2 | [`.cursor/skills/README.md`](./.cursor/skills/README.md) |
| 3 | [`docs/README.md`](./docs/README.md) |
| 4 | [`docs/AI_MOBILE_PROGRESS.md`](./docs/AI_MOBILE_PROGRESS.md) |

## Çalıştırma

```bash
cp .env.example .env   # değerleri doldur (Faz 0’da servisler bağlı değil)
npm install
npm run start:go
```

Metro: http://localhost:8081

## Yapı

```
app/           Expo Router — (public|auth|member|staff|admin) stub’lar
src/context/   Auth / Data / Actions dilimleri
src/theme/     Design token stub (02-design-system)
src/services/  Kabuk (unimplemented)
docs/mobile/   Tam spesifikasyon (screens, flows, contracts)
.cursor/skills Cursor agent skill’leri
```
