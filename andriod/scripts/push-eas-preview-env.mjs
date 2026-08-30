/**
 * Push EXPO_PUBLIC_* from local .env into EAS preview environment.
 * Does not print values. Preview APK has no Metro — vars must be on EAS.
 * EXPO_PUBLIC_* are inlined into the client bundle — store as plaintext
 * so we never upsert the Vercel/EAS `[SENSITIVE]` pull placeholder.
 */
import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');

function isPlaceholder(value) {
  const v = String(value ?? '').trim();
  return !v || v === '[SENSITIVE]' || v === '*****' || v === 'undefined';
}

function loadEnvFile(filePath) {
  if (!existsSync(filePath)) return {};
  const out = {};
  for (const line of readFileSync(filePath, 'utf8').split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eq = trimmed.indexOf('=');
    if (eq < 1) continue;
    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
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

const env = {
  ...loadEnvFile(join(root, '.env')),
  ...loadEnvFile(join(root, '.env.local')),
};

const keys = [
  'EXPO_PUBLIC_SUPABASE_URL',
  'EXPO_PUBLIC_SUPABASE_ANON_KEY',
  'EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY',
  'EXPO_PUBLIC_API_BASE_URL',
  'EXPO_PUBLIC_SITE_URL',
  'EXPO_PUBLIC_YENIFORM_MOBILE_API_SECRET',
  'EXPO_PUBLIC_DAILY_DOMAIN',
  'EXPO_PUBLIC_DAILY_ROOM_PREFIX',
  'EXPO_PUBLIC_ADMIN_EMAIL',
];

const present = keys.filter((key) => env[key] && !isPlaceholder(env[key]));
if (!present.length) {
  console.error('No EXPO_PUBLIC_* values found in .env / .env.local');
  process.exit(1);
}

if (!env.EXPO_PUBLIC_YENIFORM_MOBILE_API_SECRET) {
  console.error('Missing EXPO_PUBLIC_YENIFORM_MOBILE_API_SECRET — aborting EAS push.');
  process.exit(1);
}

if (env.EXPO_PUBLIC_SUPABASE_URL && !env.EXPO_PUBLIC_SUPABASE_URL.startsWith('https://')) {
  console.error('EXPO_PUBLIC_SUPABASE_URL is not an https URL — aborting EAS push.');
  process.exit(1);
}

const npx = process.platform === 'win32' ? 'npx.cmd' : 'npx';

for (const key of present) {
  try {
    execFileSync(
      npx,
      [
        '--yes',
        'eas-cli',
        'env:create',
        '--name',
        key,
        '--value',
        env[key],
        '--environment',
        'preview',
        '--visibility',
        'plaintext',
        '--force',
        '--non-interactive',
      ],
      { cwd: root, stdio: ['ignore', 'pipe', 'pipe'], shell: process.platform === 'win32' },
    );
    console.log(`EAS preview env upserted: ${key} (plaintext len=${env[key].length})`);
  } catch (err) {
    const stderr = String(err.stderr || err.message || err);
    console.error(`Failed ${key}:`, stderr.slice(0, 400));
    process.exitCode = 1;
  }
}
