/**
 * LOCK: docs/mobile/contracts/api-daily-room.md + screens/member/video-call.md
 * Web parity: Adsız `src/config/videoCall.js` → getDailyToken(sessionType, sessionId, userName)
 */
import { env } from '@/config/env';
import { postJson } from '@/services/api';

export function buildDailyRoomName(sessionType: string, sessionId: string): string {
  const prefix = env.dailyRoomPrefix || 'donusum';
  const safeId = String(sessionId || '').replace(/[^a-zA-Z0-9-_]/g, '');
  return `${prefix}-${sessionType}-${safeId}`.toLowerCase();
}

export type DailyRoomResult =
  | {
      ok: true;
      token: string;
      roomUrl: string | null;
      roomName?: string | null;
      isOwner?: boolean;
    }
  | { ok: false; error: string; code?: string };

/**
 * POST /api/daily-room — body must be sessionType + sessionId (not roomName).
 * Server builds room name, validates auth/join window, sets is_owner.
 */
export async function getDailyRoomToken(opts: {
  sessionType: string;
  sessionId: string;
  userName?: string;
}): Promise<DailyRoomResult> {

  const sessionId = String(opts.sessionId || '').trim();
  if (!sessionId) {
    return { ok: false, error: 'Randevu bulunamadı.', code: 'bad_request' };
  }

  const sessionType = String(opts.sessionType || 'coach').trim() || 'coach';
  const userName = String(opts.userName || '').trim() || 'Katılımcı';

  const { ok, json, status } = await postJson<{
    ok?: boolean;
    error?: string;
    code?: string;
    token?: string;
    roomUrl?: string | null;
    roomName?: string | null;
    isOwner?: boolean;
  }>('/api/daily-room', {
    sessionType,
    sessionId,
    userName,
  });

  if (!ok || json?.ok !== true || !json?.token) {
    let err = String(json?.error || 'Görüşme odası oluşturulamadı.');
    if (status === 0) {
      err = 'Görüşme servisine ulaşılamadı. Lütfen tekrar deneyin.';
    } else if (status === 401) {
      err = String(json?.error || 'Oturum doğrulanamadı. Lütfen tekrar giriş yapın.');
    } else if (status === 503) {
      err = String(json?.error || 'DAILY_API_KEY tanımlı değil');
    }
    return { ok: false, error: err, code: json?.code };
  }

  return {
    ok: true,
    token: String(json.token),
    roomUrl: json.roomUrl != null ? String(json.roomUrl) : null,
    roomName: json.roomName != null ? String(json.roomName) : null,
    isOwner: Boolean(json.isOwner),
  };
}
