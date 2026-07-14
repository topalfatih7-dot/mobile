# Yeni Form Mobile — Dokümantasyon İndeksi

> **İlk okuma sırası (AI / yeni yazılımcı):**
> 1. Bu dosya  
> 2. [`AI_MOBILE_PROGRESS.md`](./AI_MOBILE_PROGRESS.md) — durum + sonraki iş  
> 3. [`CODEMAP.md`](./CODEMAP.md) — dosya → sorumluluk haritası  
> 4. [`ARCHITECTURE.md`](./ARCHITECTURE.md) — stack, auth, realtime, chat  
> 5. Ops: [`MOBILE_OAUTH_SETUP.md`](./MOBILE_OAUTH_SETUP.md), [`MOBILE_TELEGRAM_SETUP.md`](./MOBILE_TELEGRAM_SETUP.md)

---

## Kurallar (zorunlu)

| Kural | Açıklama |
|-------|----------|
| Belgelenmeyen davranışı uydurma | Web’de / bu dokümanlarda yoksa tahmin etme; sor veya önce kaynağı oku |
| Web otorite | Parity için `Serenova-F-t/Adsız/src/services/*` (ve varsa `docs/rn-migration/`) |
| Expo sürümü | **SDK 56** — https://docs.expo.dev/versions/v56.0.0/ |
| Progress güncelle | İş bitince `AI_MOBILE_PROGRESS.md` güncelle |

---

## Repo yolları

| Ortam | Yol |
|-------|-----|
| Mobil (bu repo) | `/Users/mac/Desktop/mobile` (veya Windows OneDrive `mobile`) |
| Web kaynak | `../Serenova-F-t/Adsız` |
| Blueprint (opsiyonel) | `../Serenova-F-t/docs/rn-migration/` — **bazı makinelerde yok**; yoksa web `src/services` otorite |

---

## Doküman listesi

| Dosya | Ne için |
|-------|---------|
| `AI_MOBILE_PROGRESS.md` | Tamamlanan turlar, P0/P1 sırası, env, runtime notları, handoff checklist |
| `CODEMAP.md` | “X’i nerede bulurum?” — rota, servis, context haritası |
| `ARCHITECTURE.md` | Provider ağacı, auth akışı, realtime, chat türleri, env |
| `MOBILE_OAUTH_SETUP.md` | Supabase Redirect URLs (mobil) |
| `MOBILE_TELEGRAM_SETUP.md` | Telegram notify secret |

---

## Hızlı komutlar

```bash
cp .env.example .env   # değerleri doldur
npm install
npm run start:go       # Expo Go
# veya: npx expo start -c
```

Metro: `http://localhost:8081`
