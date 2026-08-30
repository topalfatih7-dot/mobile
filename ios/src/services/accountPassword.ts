import { postJson } from '@/services/api';

export async function changeAccountPassword(opts: {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}): Promise<{ ok: true } | { ok: false; error: string; code?: string }> {
  const { ok, json } = await postJson<{
    ok?: boolean;
    error?: string;
    code?: string;
  }>('/api/auth', {
    action: 'password-change',
    currentPassword: opts.currentPassword,
    newPassword: opts.newPassword,
    confirmPassword: opts.confirmPassword,
  });
  if (!ok || !json?.ok) {
    return {
      ok: false,
      error: json?.error || 'Şifre güncellenemedi.',
      code: json?.code,
    };
  }
  return { ok: true };
}
