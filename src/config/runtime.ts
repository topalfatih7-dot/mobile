/**
 * UI-ONLY MODE — şimdilik kapalı; gerçek Supabase / API yolları aktif.
 *
 * Demo gezintisine dönmek için:
 * 1. `UI_ONLY_MODE = true`
 * 2. Metro’yu `--clear` ile yeniden başlat
 *
 * Detay: docs/UI_ONLY_MODE.md
 */
export const UI_ONLY_MODE = false;

export function isUiOnly(): boolean {
  return UI_ONLY_MODE;
}
