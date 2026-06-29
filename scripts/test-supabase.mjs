/**
 * CLI bağlantı testi — `node scripts/test-supabase.mjs` (mobile/.env gerekir)
 */
import { readFileSync, existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createClient } from '@supabase/supabase-js';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const envPath = resolve(root, '.env');

if (!existsSync(envPath)) {
  console.error('❌ mobile/.env bulunamadı. cp .env.example .env ile oluşturun.');
  process.exit(1);
}

const env = Object.fromEntries(
  readFileSync(envPath, 'utf8')
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line && !line.startsWith('#'))
    .map((line) => {
      const idx = line.indexOf('=');
      return [line.slice(0, idx), line.slice(idx + 1)];
    }),
);

const url = env.EXPO_PUBLIC_SUPABASE_URL;
const key =
  env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY || env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!url || !key) {
  console.error('❌ EXPO_PUBLIC_SUPABASE_URL ve anahtar tanımlı değil.');
  process.exit(1);
}

const supabase = createClient(url, key);
const started = Date.now();

const { count, error } = await supabase
  .from('plans')
  .select('id', { count: 'exact', head: true });

if (error) {
  console.error('❌ Supabase sorgu hatası:', error.message);
  process.exit(1);
}

console.log(`✅ Supabase bağlantı OK — ${Date.now() - started}ms, plans: ${count ?? 0}`);
