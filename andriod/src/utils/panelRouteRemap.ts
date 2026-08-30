import type { SessionRole } from '@/services/authHydrate';

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const STAFF_ROLES = new Set(['coach', 'dietitian', 'doctor']);

export function normalizePathname(pathname: string): string {
  const p = String(pathname || '').split('?')[0].split('#')[0];
  if (!p || p === '/') return '/';
  return p.replace(/\/+$/, '') || '/';
}

/** Web full-load: router pathname ilk karede `/` olabilir; tarayıcı URL kaynak. */
export function browserLocationPathname(): string | null {
  if (typeof window === 'undefined') return null;
  try {
    const p = window.location?.pathname;
    return p ? normalizePathname(p) : null;
  } catch {
    return null;
  }
}

export function resolvePanelPathname(routerPathname: string): string {
  const browser = browserLocationPathname();
  if (browser) return browser;
  return normalizePathname(routerPathname);
}

/** Open-redirect koruması — yalnız aynı origin path. */
export function safeInternalPath(raw: unknown): string | null {
  let s = String(raw || '').trim();
  if (!s) return null;
  try {
    s = decodeURIComponent(s);
  } catch {
    /* keep raw */
  }
  if (!s.startsWith('/') || s.startsWith('//')) return null;
  if (/^[a-z][a-z0-9+.-]*:/i.test(s)) return null;
  if (s.length > 400) return null;
  if (normalizePathname(s).startsWith('/login')) return null;
  return s;
}

function pathParts(pathname: string): string[] {
  return normalizePathname(pathname)
    .split('/')
    .filter(Boolean)
    .filter((p) => !(p.startsWith('(') && p.endsWith(')')));
}

/**
 * Android personel grubu `/(staff)/…`. Eski `/staff/…` ve gruplu path’ler
 * aynı hedefe çevrilir.
 */
export function staffHrefForPath(pathname: string): string {
  const parts = pathParts(pathname);
  const a = parts[0] || '';
  const b = parts[1] || '';
  const c = parts[2] || '';

  if (a === 'staff') {
    const rest = parts.slice(1).join('/');
    return rest ? `/(staff)/${rest}` : '/(staff)';
  }
  if (!a || a === 'dashboard') return '/(staff)';
  if (a === 'notifications') return '/(staff)/notifications';
  if (a === 'library') return '/(staff)/library';
  if (a === 'profile') return '/(staff)/profile';
  if (a === 'programs') return '/(staff)/programs';
  if (a === 'payments') return '/(staff)/payments';
  if (a === 'lists') return '/(staff)/lists';
  if (a === 'clients') return `/(staff)/${parts.join('/')}`;
  if (a === 'call' && b && c) return `/(staff)/call/${b}/${c}`;
  if (a === 'messages') {
    if (!b) return '/(staff)/messages';
    if (b === 'admin') {
      return c ? `/(staff)/messages/admin/${c}` : '/(staff)/messages/admin';
    }
    if (b === 'collab') {
      return c ? `/(staff)/messages/collab/${c}` : '/(staff)/messages/collab';
    }
    if (STAFF_ROLES.has(b) && !UUID_RE.test(b)) return '/(staff)/messages';
    return `/(staff)/messages/${b}`;
  }
  return '/(staff)';
}

export function memberHrefForPath(pathname: string): string {
  const parts = pathParts(pathname);
  const a = parts[0] || '';
  const b = parts[1] || '';
  const c = parts[2] || '';

  if (a === 'staff') return '/(member)/dashboard';
  if (!a) return '/(member)/dashboard';
  if (a === 'notifications') return '/(member)/notifications';
  if (a === 'library') return '/(member)/library';
  if (a === 'profile') {
    return parts.length > 1
      ? `/(member)/profile/${parts.slice(1).join('/')}`
      : '/(member)/profile';
  }
  if (a === 'programs') return '/(member)/programs';
  if (a === 'dashboard') return '/(member)/dashboard';
  if (a === 'calendar') return '/(member)/calendar';
  if (a === 'schedule') return '/(member)/schedule';
  if (a === 'calorie') return '/(member)/calorie';
  if (a === 'support') return '/(member)/support';
  if (a === 'health-test') return `/(member)/${parts.join('/')}`;
  if (a === 'call' && b && c) return `/(member)/call/${b}/${c}`;
  if (a === 'messages') {
    if (!b) return '/(member)/messages';
    if (STAFF_ROLES.has(b)) return `/(member)/messages/${b}`;
    return '/(member)/messages';
  }
  return '/(member)/dashboard';
}

export function hrefForRoleMismatch(opts: {
  role: SessionRole | null;
  allow: SessionRole;
  pathname: string;
  fallback: string;
}): string {
  if (opts.role === 'staff' && opts.allow === 'member') {
    return staffHrefForPath(opts.pathname);
  }
  if (opts.role === 'member' && opts.allow === 'staff') {
    return memberHrefForPath(opts.pathname);
  }
  return opts.fallback;
}

/** login.md: `from` varsa ve /login değilse oraya; rol çakışan path’i doğru gruba çevir. */
export function resolvePostAuthHref(
  from: unknown,
  role: SessionRole | null,
  fallback: string,
): string {
  const path = safeInternalPath(from);
  if (!path) return fallback;
  if (role === 'staff') return staffHrefForPath(path);
  if (role === 'member') return memberHrefForPath(path);
  if (role === 'admin') return '/(auth)/admin-web';
  return fallback;
}
