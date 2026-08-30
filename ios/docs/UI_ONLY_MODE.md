# UI-Only Mode — kaldırıldı

> **Durum:** Demo / `UI_ONLY_MODE` yığını silindi (2026-08-22).  
> Uygulama yalnız gerçek Supabase / API yollarını kullanır.

Önceki demo oturumu (`src/data/uiDemo.ts`, `demoAuthStorage`, `isUiOnly()` dalları) kodda yok. Geri açmak için git geçmişine bakın — runtime bayrağı tutulmuyor.

Bağlama: `.env` / `.env.local` içinde `EXPO_PUBLIC_SUPABASE_*` + API_BASE + Daily.
