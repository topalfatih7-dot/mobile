/**
 * Web parity: Adsız `src/services/sessionAttendanceApi.js`
 * POST /api/auth { action: 'session-attendance', sessionId, sessionType, event }
 */
import { postJson } from '@/services/api';
import { isUiOnly } from '@/config/runtime';

export async function reportSessionAttendance(opts: {
  sessionId: string;
  sessionType: string;
  event: 'join' | 'leave';
}): Promise<{ ok: boolean }> {
  if (isUiOnly()) return { ok: false };
  const sessionId = String(opts.sessionId || '').trim();
  const sessionType = String(opts.sessionType || '').trim();
  const event = opts.event;
  if (!sessionId || !event) return { ok: false };

  try {
    const { ok, json } = await postJson<{ ok?: boolean }>('/api/auth', {
      action: 'session-attendance',
      sessionId,
      sessionType,
      event,
    });
    return { ok: ok && json?.ok !== false };
  } catch {
    return { ok: false };
  }
}
