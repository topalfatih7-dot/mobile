/**
 * Expo ortam değişkenleri — yalnızca EXPO_PUBLIC_* prefix'li anahtarlar istemciye gider.
 * Web `VITE_*` ile aynı Supabase / site değerlerine bağlanır (docs/rn-migration/01).
 */
function readEnv(key: string): string {
  const value = process.env[key];
  return typeof value === 'string' ? value.trim() : '';
}

export const env = {
  supabaseUrl: readEnv('EXPO_PUBLIC_SUPABASE_URL'),
  /** Yeni publishable anahtar veya eski anon key — web ile aynı mantık. */
  supabaseAnonKey:
    readEnv('EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY') ||
    readEnv('EXPO_PUBLIC_SUPABASE_ANON_KEY'),
  /** Canonical site — Vercel API (`/api/*`) ve deep-link redirect tabanı. */
  siteUrl: (readEnv('EXPO_PUBLIC_SITE_URL') || 'https://www.yeniform.com').replace(/\/$/, ''),
  /** Admin e-posta override — web `VITE_ADMIN_EMAIL` karşılığı. */
  adminEmail: (readEnv('EXPO_PUBLIC_ADMIN_EMAIL') || 'admin@yeniform.com').trim().toLowerCase(),
} as const;

export const isSupabaseConfigured = Boolean(env.supabaseUrl && env.supabaseAnonKey);

export function apiUrl(path: string): string {
  const normalized = path.startsWith('/') ? path : `/${path}`;
  return `${env.siteUrl}${normalized}`;
}

export const missingEnvKeys = (): string[] => {
  const missing: string[] = [];
  if (!env.supabaseUrl) missing.push('EXPO_PUBLIC_SUPABASE_URL');
  if (!env.supabaseAnonKey) {
    missing.push('EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY (veya EXPO_PUBLIC_SUPABASE_ANON_KEY)');
  }
  return missing;
};
