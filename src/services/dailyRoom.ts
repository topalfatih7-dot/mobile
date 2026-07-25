/**
 * LOCK: docs/mobile/contracts/api-daily-room.md + screens/member/video-call.md
 */
import { env } from '@/config/env';
import { isUiOnly } from '@/config/runtime';
import { postJson } from '@/services/api';

export function buildDailyRoomName(sessionType: string, sessionId: string): string {
  const prefix = env.dailyRoomPrefix || 'donusum';
  const safeId = String(sessionId || '').replace(/[^a-zA-Z0-9-_]/g, '');
  return `${prefix}-${sessionType}-${safeId}`.toLowerCase();
}

export type DailyRoomResult =
  | { ok: true; token: string; roomUrl: string | null }
  | { ok: false; error: string };

export async function getDailyRoomToken(opts: {
  roomName: string;
  userName: string;
  isOwner: boolean;
}): Promise<DailyRoomResult> {
  if (isUiOnly()) {
    return { ok: false, error: 'Görüşme demo modda kullanılamaz.' };
  }

  const { ok, json, status } = await postJson<{
    ok?: boolean;
    error?: string;
    token?: string;
    roomUrl?: string | null;
  }>('/api/daily-room', {
    roomName: opts.roomName,
    userName: opts.userName || 'Katılımcı',
    isOwner: opts.isOwner,
  });

  if (!ok || json?.ok !== true || !json?.token) {
    let err = String(json?.error || 'Görüşme odası oluşturulamadı.');
    if (status === 0) {
      err = 'Görüşme servisine ulaşılamadı. Lütfen tekrar deneyin.';
    } else if (status === 401) {
      err = String(json?.error || 'Oturum doğrulanamadı. Lütfen tekrar giriş yapın.');
    } else if (status === 503) {
      err = String(json?.error || 'DAILY_API_KEY tanımlı değil (opsiyonel)');
    }
    return { ok: false, error: err };
  }

  return {
    ok: true,
    token: String(json.token),
    roomUrl: json.roomUrl != null ? String(json.roomUrl) : null,
  };
}
