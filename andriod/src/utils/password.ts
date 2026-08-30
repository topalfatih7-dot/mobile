/** docs/mobile/05-auth-onboarding.md PASSWORD_RULES */
export function isPasswordValid(password: string): boolean {
  if (password.length < 8) return false;
  if (!/[a-z]/.test(password)) return false;
  if (!/[A-Z]/.test(password)) return false;
  if (!/[0-9]/.test(password)) return false;
  if (!/[^A-Za-z0-9]/.test(password)) return false;
  return true;
}

export const PASSWORD_RULES = [
  { id: 'len', label: 'En az 8 karakter', test: (p: string) => p.length >= 8 },
  { id: 'lower', label: 'Bir küçük harf', test: (p: string) => /[a-z]/.test(p) },
  { id: 'upper', label: 'Bir büyük harf', test: (p: string) => /[A-Z]/.test(p) },
  { id: 'num', label: 'Bir rakam', test: (p: string) => /[0-9]/.test(p) },
  { id: 'special', label: 'Bir özel karakter', test: (p: string) => /[^A-Za-z0-9]/.test(p) },
] as const;
