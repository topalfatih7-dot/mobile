export function firstNameFrom(fullName?: string | null) {
  const part = String(fullName || '')
    .trim()
    .split(/\s+/)[0];
  return part || null;
}

/** Görünen ad — isim, e-posta öneki veya rol bazlı yedek */
export function resolveFirstName({
  name,
  email,
  fallback = 'Üye',
}: {
  name?: string | null;
  email?: string | null;
  fallback?: string;
} = {}) {
  return firstNameFrom(name) || firstNameFrom(email?.split('@')[0]) || fallback;
}
