import { VIDEO_CALL_CONFIG } from '@/config/videoCall';
import { formatDurationTr } from '@/utils/formatDuration';
import type { MemberProfile } from '@/types/session';

export type VideoSession = {
  id: string;
  date: string;
  time?: string;
  status?: string;
  duration?: number;
  durationMin?: number;
  type?: string;
  coach?: string;
  coachName?: string;
};

export function getSessionTiming(session: VideoSession, now = new Date()) {
  const start = new Date(`${session.date}T${session.time || '12:00'}`);
  const durationMin = Number(session.durationMin ?? session.duration) || 30;
  const windowStart = new Date(start.getTime() - VIDEO_CALL_CONFIG.joinMinutesBefore * 60_000);
  const sessionEnd = new Date(start.getTime() + durationMin * 60_000);
  const windowEnd = new Date(start.getTime() + (durationMin + VIDEO_CALL_CONFIG.joinMinutesAfter) * 60_000);

  return {
    start,
    sessionEnd,
    windowStart,
    windowEnd,
    isExpired: now > windowEnd,
    isBeforeWindow: now < windowStart,
    isInJoinWindow: now >= windowStart && now <= windowEnd,
    isLive: now >= start && now <= sessionEnd,
    untilWindowOpensMs: Math.max(0, windowStart.getTime() - now.getTime()),
    untilStartMs: Math.max(0, start.getTime() - now.getTime()),
    untilSessionEndMs: Math.max(0, sessionEnd.getTime() - now.getTime()),
    untilWindowEndMs: Math.max(0, windowEnd.getTime() - now.getTime()),
  };
}

export function canAccessCallRoom(session: VideoSession | null | undefined, now = new Date()) {
  if (!session || session.status !== 'scheduled') {
    return { ok: false as const, reason: 'Bu randevu aktif değil veya iptal edilmiş.' };
  }
  const start = new Date(`${session.date}T${session.time || '12:00'}`);
  if (Number.isNaN(start.getTime())) {
    return { ok: false as const, reason: 'Randevu tarihi geçersiz.' };
  }
  const timing = getSessionTiming(session, now);
  if (timing.isExpired) {
    return { ok: false as const, reason: 'Görüşme süresi doldu.', timing };
  }
  return { ok: true as const, timing };
}

export function canJoinSession(session: VideoSession | null | undefined, now = new Date()) {
  const access = canAccessCallRoom(session, now);
  if (!access.ok) return access;

  const { timing } = access;

  if (timing.isBeforeWindow) {
    return {
      ok: false as const,
      canEnterRoom: true,
      timing,
      reason: `Görüşme ${formatDurationTr(timing.untilWindowOpensMs)} sonra açılacak.`,
      statusLabel: `Açılışa ${formatDurationTr(timing.untilWindowOpensMs)} kaldı`,
    };
  }

  if (timing.isLive) {
    return {
      ok: true as const,
      canEnterRoom: true,
      timing,
      reason: null,
      statusLabel: `Canlı · Kalan ${formatDurationTr(timing.untilSessionEndMs)}`,
    };
  }

  if (timing.isInJoinWindow && timing.untilStartMs > 0) {
    return {
      ok: true as const,
      canEnterRoom: true,
      timing,
      reason: null,
      statusLabel: `Randevu ${formatDurationTr(timing.untilStartMs)} sonra başlayacak`,
    };
  }

  return {
    ok: true as const,
    canEnterRoom: true,
    timing,
    reason: null,
    statusLabel: `Oda kapanmasına ${formatDurationTr(timing.untilWindowEndMs)} kaldı`,
  };
}

export function findMemberSession(
  member: MemberProfile | null,
  sessionType: string,
  sessionId: string,
) {
  const type = sessionType === 'dietitian' ? 'dietitian' : 'coach';
  const list =
    type === 'coach'
      ? (member?.coachSessions as VideoSession[] | undefined)
      : (member?.dietitianSessions as VideoSession[] | undefined);
  const session = (list || []).find((item) => item.id === sessionId);
  if (!session) return null;
  return { session, sessionType: type as 'coach' | 'dietitian' };
}

export function findStaffSession(
  members: MemberProfile[],
  staffId: string,
  staffRole: string | undefined,
  sessionType: string,
  sessionId: string,
) {
  const type = sessionType === 'dietitian' ? 'dietitian' : 'coach';
  if (normalizeStaffRole(staffRole) !== type) return null;

  const assignKey = type === 'coach' ? 'assignedCoachId' : 'assignedDietitianId';
  const sessionKey = type === 'coach' ? 'coachSessions' : 'dietitianSessions';

  for (const member of members) {
    if (String(member[assignKey] || '') !== String(staffId)) continue;
    const session = ((member[sessionKey] as VideoSession[] | undefined) || []).find(
      (item) => item.id === sessionId,
    );
    if (session) return { session, sessionType: type, member };
  }
  return null;
}

function normalizeStaffRole(role?: string | null) {
  if (role === 'dietitian' || role === 'doctor') return role;
  return 'coach';
}
