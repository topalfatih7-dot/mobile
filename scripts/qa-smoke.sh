#!/usr/bin/env bash
set -euo pipefail
export PATH="/usr/bin:/bin:/usr/sbin:/sbin:/usr/local/bin:/opt/homebrew/bin:$PATH"
cd /Users/mac/Desktop/mobile
set -a
# shellcheck disable=SC1091
source .env.local
set +a

echo "=== members anon body ==="
curl -s --max-time 20 \
  "${EXPO_PUBLIC_SUPABASE_URL}/rest/v1/members?select=id,email,membership&limit=5" \
  -H "apikey: ${EXPO_PUBLIC_SUPABASE_ANON_KEY}" \
  -H "Authorization: Bearer ${EXPO_PUBLIC_SUPABASE_ANON_KEY}"
echo

echo "=== posts sample ==="
curl -s --max-time 20 \
  "${EXPO_PUBLIC_SUPABASE_URL}/rest/v1/posts?select=id,title,published&limit=3" \
  -H "apikey: ${EXPO_PUBLIC_SUPABASE_ANON_KEY}" \
  -H "Authorization: Bearer ${EXPO_PUBLIC_SUPABASE_ANON_KEY}"
echo

echo "=== chat_threads anon ==="
curl -s -w "\nHTTP %{http_code}\n" --max-time 20 \
  "${EXPO_PUBLIC_SUPABASE_URL}/rest/v1/chat_threads?select=id&limit=3" \
  -H "apikey: ${EXPO_PUBLIC_SUPABASE_ANON_KEY}" \
  -H "Authorization: Bearer ${EXPO_PUBLIC_SUPABASE_ANON_KEY}"

echo "=== import resolve ==="
node <<'NODE'
const fs = require('fs');
const path = require('path');
const files = [];
function walk(d) {
  for (const f of fs.readdirSync(d)) {
    const p = path.join(d, f);
    const s = fs.statSync(p);
    if (s.isDirectory()) walk(p);
    else if (/\.tsx?$/.test(f)) files.push(p);
  }
}
walk('app');
let missing = 0;
let checked = 0;
const miss = [];
for (const file of files) {
  const txt = fs.readFileSync(file, 'utf8');
  const re = /from ['"]@\/([^'"]+)['"]/g;
  let m;
  while ((m = re.exec(txt))) {
    checked++;
    const rel = m[1];
    const cands = [
      `src/${rel}.ts`,
      `src/${rel}.tsx`,
      `src/${rel}/index.ts`,
      `src/${rel}/index.tsx`,
    ];
    if (!cands.some((c) => fs.existsSync(c))) {
      missing++;
      if (miss.length < 20) miss.push(`${file} -> @/${rel}`);
    }
  }
}
console.log(JSON.stringify({ files: files.length, checked, missing, miss }, null, 2));
NODE

echo "=== metro ERROR tally ==="
rg -c "ERROR" /Users/mac/.cursor/projects/Users-mac-Desktop-mobile/terminals/*.txt || true
rg "ERROR|TypeError|RedBox" /Users/mac/.cursor/projects/Users-mac-Desktop-mobile/terminals/*.txt | tail -40 || true
