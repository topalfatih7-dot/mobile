# Yeni Form Mobile — Dokümantasyon İndeksi

> **İlk okuma sırası (AI / yeni yazılımcı):**
> 1. Bu dosya  
> 2. [`AI_MOBILE_PROGRESS.md`](./AI_MOBILE_PROGRESS.md) — durum  
> 3. [`ROADMAP.md`](./ROADMAP.md) — yapılacaklar (Lumina + parity)  
> 4. [`FEATURE_PARITY.md`](./FEATURE_PARITY.md) — web × mobil eksikler  
> 5. [`DESIGN_SYSTEM.md`](./DESIGN_SYSTEM.md) — Lumina görsel dil  
> 6. [`CODEMAP.md`](./CODEMAP.md) — dosya haritası  
> 7. [`ARCHITECTURE.md`](./ARCHITECTURE.md) — stack / auth / realtime  
> 8. Ops: [`MOBILE_OAUTH_SETUP.md`](./MOBILE_OAUTH_SETUP.md), [`MOBILE_TELEGRAM_SETUP.md`](./MOBILE_TELEGRAM_SETUP.md)

---

## Kurallar (zorunlu)

| Kural | Açıklama |
|-------|----------|
| Belgelenmeyen davranışı uydurma | Web / bu dokümanlarda yoksa tahmin etme |
| Web otorite | `Serenova-F-t/Adsız/src/*` (+ `docs/rn-migration/`) |
| Expo | **SDK 56** — https://docs.expo.dev/versions/v56.0.0/ |
| Tasarım | **Lumina** — `DESIGN_SYSTEM.md`; web mavi/sage kopyalama |
| Parity | Tüm web özellikleri; ekstra yok; sormadan silme yok |
| Progress | İş bitince `AI_MOBILE_PROGRESS.md` + `ROADMAP.md` + `FEATURE_PARITY.md` |

---

## Repo yolları

| Ortam | Yol |
|-------|-----|
| Mobil | Desktop / OneDrive `mobile` |
| Web | `../Serenova-F-t/Adsız` |
| Blueprint | `../Serenova-F-t/docs/rn-migration/` |

---

## Doküman listesi

| Dosya | Ne için |
|-------|---------|
| `AI_MOBILE_PROGRESS.md` | Tur durumu, sonraki iş, env, tuzaklar |
| `ROADMAP.md` | Faz 0–5 checklist |
| `FEATURE_PARITY.md` | Rota bazlı ✅/🟡/❌ matrix |
| `DESIGN_SYSTEM.md` | Lumina token, tipografi, motion, kit |
| `CODEMAP.md` | Dosya → sorumluluk |
| `ARCHITECTURE.md` | Provider, auth, chat, realtime |
| `MOBILE_OAUTH_SETUP.md` | Supabase Redirect URLs |
| `MOBILE_TELEGRAM_SETUP.md` | Telegram secret |

---

## Hızlı komutlar

```bash
cp .env.example .env
npm install
npm run start:go
```
