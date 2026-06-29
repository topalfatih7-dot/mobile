import { readEnv } from '@/config/envHelpers';

export const VIDEO_CALL_CONFIG = {
  domain: readEnv('EXPO_PUBLIC_DAILY_DOMAIN').replace(/^https?:\/\//, '').replace(/\/$/, ''),
  roomPrefix: readEnv('EXPO_PUBLIC_DAILY_ROOM_PREFIX') || 'donusum',
  joinMinutesBefore: Number(readEnv('EXPO_PUBLIC_VIDEO_JOIN_MINUTES_BEFORE') || '15') || 15,
  joinMinutesAfter: Number(readEnv('EXPO_PUBLIC_VIDEO_JOIN_MINUTES_AFTER') || '30') || 30,
  apiBaseUrl: readEnv('EXPO_PUBLIC_API_BASE_URL').replace(/\/$/, ''),
} as const;

export function isVideoCallConfigured() {
  return Boolean(VIDEO_CALL_CONFIG.domain);
}

export function buildRoomName(sessionType: string, sessionId: string) {
  const safeId = String(sessionId || '').replace(/[^a-zA-Z0-9-_]/g, '');
  return `${VIDEO_CALL_CONFIG.roomPrefix}-${sessionType}-${safeId}`.toLowerCase();
}

export function buildRoomUrl(sessionType: string, sessionId: string) {
  if (!isVideoCallConfigured()) return null;
  return `https://${VIDEO_CALL_CONFIG.domain}/${buildRoomName(sessionType, sessionId)}`;
}

export const SESSION_TYPE_META = {
  coach: {
    label: 'Koç Görüşmesi',
    roleLabel: 'Koç',
    gradientKey: 'brand' as const,
  },
  dietitian: {
    label: 'Diyetisyen Görüşmesi',
    roleLabel: 'Diyetisyen',
    gradientKey: 'forest' as const,
  },
};

export function memberCallPath(sessionType: string, sessionId: string) {
  return `/call/${sessionType}/${sessionId}`;
}

export function staffCallPath(sessionType: string, sessionId: string) {
  return `/call/${sessionType}/${sessionId}`;
}
