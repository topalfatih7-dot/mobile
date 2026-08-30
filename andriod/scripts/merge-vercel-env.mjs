/**
 * Merge Vercel production env into gitignored mobile .env.
 * Copies only EXPO_PUBLIC-safe keys. Never writes service role / Stripe.
 *
 * Preferred: `npx vercel env run -e production -- node scripts/merge-vercel-env.mjs`
 * (`vercel env pull` redacts Sensitive values as [SENSITIVE] — do not use that dump.)
 */
import { existsSync, readFileSync, unlinkSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');

function isPlaceholder(value) {
  const v = String(value ?? '').trim();
  return !v || v === '[SENSITIVE]' || v === '*****' || v === 'undefined';
}

function parseEnv(text) {
  const out = {};
  for (const line of text.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eq = trimmed.indexOf('=');
    if (eq < 1) continue;
    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1);
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (!isPlaceholder(value)) out[key] = value;
  }
  return out;
}

function loadEnvFile(filePath) {
  if (!existsSync(filePath)) return {};
  return parseEnv(readFileSync(filePath, 'utf8'));
}

/** Vercel / web name → Expo public name. First real hit wins per dest key. */
const map = [
  ['YENIFORM_MOBILE_API_SECRET', 'EXPO_PUBLIC_YENIFORM_MOBILE_API_SECRET'],
  ['VITE_DAILY_DOMAIN', 'EXPO_PUBLIC_DAILY_DOMAIN'],
  ['VITE_DAILY_ROOM_PREFIX', 'EXPO_PUBLIC_DAILY_ROOM_PREFIX'],
  ['VITE_ADMIN_EMAIL', 'EXPO_PUBLIC_ADMIN_EMAIL'],
  ['ADMIN_EMAIL', 'EXPO_PUBLIC_ADMIN_EMAIL'],
  ['VITE_PHONE_VERIFY_ENABLED', 'EXPO_PUBLIC_PHONE_VERIFY_ENABLED'],
  ['VITE_PHONE_VERIFY_VIA_EMAIL', 'EXPO_PUBLIC_PHONE_VERIFY_VIA_EMAIL'],
  ['VITE_AI_CHAT_ENABLED', 'EXPO_PUBLIC_AI_CHAT_ENABLED'],
  ['VITE_AI_VISION_ENABLED', 'EXPO_PUBLIC_AI_VISION_ENABLED'],
  ['VITE_SITE_URL', 'EXPO_PUBLIC_SITE_URL'],
  ['APP_URL', 'EXPO_PUBLIC_API_BASE_URL'],
  ['VITE_SUPABASE_URL', 'EXPO_PUBLIC_SUPABASE_URL'],
  ['SUPABASE_URL', 'EXPO_PUBLIC_SUPABASE_URL'],
  ['VITE_SUPABASE_PUBLISHABLE_KEY', 'EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY'],
  ['VITE_SUPABASE_ANON_KEY', 'EXPO_PUBLIC_SUPABASE_ANON_KEY'],
];

const dumpPath = join(root, '.env.vercel.production.local');
const destPath = join(root, '.env');
const webLocal = join(root, '..', 'Serenova-F-t', '.env.local');

function assignIfReal(target, from) {
  for (const [key, value] of Object.entries(from || {})) {
    if (!isPlaceholder(value)) target[key] = String(value).trim();
  }
}

const sources = {};
assignIfReal(sources, loadEnvFile(webLocal));
assignIfReal(sources, loadEnvFile(dumpPath));
assignIfReal(sources, process.env);

const current = existsSync(destPath) ? loadEnvFile(destPath) : {};
const filled = new Set();
const added = [];
const updated = [];

for (const [from, to] of map) {
  if (filled.has(to)) continue;
  const value = sources[from];
  if (isPlaceholder(value)) continue;
  filled.add(to);
  if (current[to] === value) continue;
  if (current[to] && !isPlaceholder(current[to])) updated.push(to);
  else added.push(to);
  current[to] = value;
}

if (!current.EXPO_PUBLIC_API_BASE_URL && current.EXPO_PUBLIC_SITE_URL) {
  current.EXPO_PUBLIC_API_BASE_URL = current.EXPO_PUBLIC_SITE_URL;
  added.push('EXPO_PUBLIC_API_BASE_URL');
}

for (const key of Object.keys(current)) {
  if (isPlaceholder(current[key])) delete current[key];
}

const order = [
  'EXPO_PUBLIC_SUPABASE_URL',
  'EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY',
  'EXPO_PUBLIC_SUPABASE_ANON_KEY',
  'EXPO_PUBLIC_SITE_URL',
  'EXPO_PUBLIC_API_BASE_URL',
  'EXPO_PUBLIC_ADMIN_EMAIL',
  'EXPO_PUBLIC_YENIFORM_MOBILE_API_SECRET',
  'EXPO_PUBLIC_DAILY_DOMAIN',
  'EXPO_PUBLIC_DAILY_ROOM_PREFIX',
  'EXPO_PUBLIC_TURNSTILE_SITE_KEY',
  'EXPO_PUBLIC_PHONE_VERIFY_ENABLED',
  'EXPO_PUBLIC_PHONE_VERIFY_VIA_EMAIL',
  'EXPO_PUBLIC_AI_CHAT_ENABLED',
  'EXPO_PUBLIC_AI_VISION_ENABLED',
];

const lines = ['# Synced from Vercel production (serenova-f-t). Do not commit.'];
const written = new Set();
for (const key of order) {
  if (current[key]) {
    lines.push(`${key}=${current[key]}`);
    written.add(key);
  }
}
for (const key of Object.keys(current).sort()) {
  if (!written.has(key) && current[key]?.startsWith('EXPO_PUBLIC_')) {
    lines.push(`${key}=${current[key]}`);
  }
}

writeFileSync(destPath, `${lines.join('\n')}\n`);
if (existsSync(dumpPath)) unlinkSync(dumpPath);

function shape(value) {
  if (!value) return 'MISSING';
  if (isPlaceholder(value)) return 'placeholder';
  if (value.startsWith('https://')) return `https len=${value.length}`;
  if (value.startsWith('eyJ')) return `jwtish len=${value.length}`;
  return `set len=${value.length}`;
}

console.log('ADDED', added.join(', ') || '(none)');
console.log('UPDATED', updated.join(', ') || '(none)');
console.log('SUPABASE_URL', shape(current.EXPO_PUBLIC_SUPABASE_URL));
console.log('PUBLISHABLE_KEY', shape(current.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY));
console.log('SITE_URL', shape(current.EXPO_PUBLIC_SITE_URL));
console.log('MOBILE_SECRET', shape(current.EXPO_PUBLIC_YENIFORM_MOBILE_API_SECRET));
console.log('DAILY_DOMAIN', shape(current.EXPO_PUBLIC_DAILY_DOMAIN));
console.log(
  'FINAL_KEYS',
  Object.keys(current)
    .filter((k) => current[k])
    .join(', '),
);
