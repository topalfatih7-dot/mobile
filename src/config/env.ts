/**
 * Expo ortam değişkenleri — yalnızca EXPO_PUBLIC_* prefix'li anahtarlar istemciye gider.
 * Web `VITE_SUPABASE_*` ile aynı Supabase projesine bağlanır.
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
} as const;

export const isSupabaseConfigured = Boolean(env.supabaseUrl && env.supabaseAnonKey);

export const missingEnvKeys = (): string[] => {
  const missing: string[] = [];
  if (!env.supabaseUrl) missing.push('EXPO_PUBLIC_SUPABASE_URL');
  if (!env.supabaseAnonKey) {
    missing.push('EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY (veya EXPO_PUBLIC_SUPABASE_ANON_KEY)');
  }
  return missing;
};
