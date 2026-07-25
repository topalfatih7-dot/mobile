import type { MemberSession, SessionType } from '@/utils/sessionBooking';

export const VIDEO_JOIN_MINUTES_BEFORE = 15;
export const VIDEO_JOIN_MINUTES_AFTER = 30;
export const DEFAULT_VIDEO_SESSION_DURATION = 30;

export type VideoCallTiming = {
  start: Date;
  sessionEnd: Date;
  windowStart: Date;
  windowEnd: Date;
  isExpired: boolean;
  isBeforeWindow: boolean;
  isInJoinWindow: boolean;
  isLive: boolean;
  untilWindowOpensMs: number;
  untilStartMs: number;
  untilSessionEndMs: number;
  untilWindowEndMs: number;
};

export type VideoCallAccess = {
  ok: boolean;
  reason?: string;
  statusLabel?: string;
  timing?: VideoCallTiming;
};

export type MemberCallContext = {
  session: MemberSession;
  sessionType: SessionType;
  displayName: string;
  remoteLabel: string;
  roomAccess: VideoCallAccess;
  joinCheck: VideoCallAccess;
};

function formatDurationTr(ms: number): string {
  if (ms <= 0) return '0 dakika';

  let totalMinutes = Math.ceil(ms / 60_000);
  const days = Math.floor(totalMinutes / (24 * 60));
  totalMinutes -= days * 24 * 60;
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes - hours * 60;
  const parts: string[] = [];

  if (days > 0) parts.push(`${days} gün`);
  if (hours > 0) parts.push(`${hours} saat`);
  if (minutes > 0 || parts.length === 0) parts.push(`${minutes} dakika`);
  return parts.join(' ');
}

export function normalizeVideoSessionType(value: string): SessionType {
  if (value === 'dietitian' || value === 'doctor') return value;
  return 'coach';
}

function sessionsKey(type: SessionType) {
  if (type === 'dietitian') return 'dietitianSessions';
  if (type === 'doctor') return 'doctorSessions';
  return 'coachSessions';
}

function remoteStaffLabel(type: SessionType) {
  if (type === 'dietitian') return 'Diyetisyeniniz';
  if (type === 'doctor') return 'Doktorunuz';
  return 'Koçunuz';
}

export function getVideoCallTiming(
  session: MemberSession,
  now = new Date(),
): VideoCallTiming {
  const start = new Date(String(session.date || ''));
  const durationMinutes = Number(session.duration) || DEFAULT_VIDEO_SESSION_DURATION;
  const windowStart = new Date(
    start.getTime() - VIDEO_JOIN_MINUTES_BEFORE * 60_000,
  );
  const sessionEnd = new Date(start.getTime() + durationMinutes * 60_000);
  const windowEnd = new Date(
    start.getTime() + (durationMinutes + VIDEO_JOIN_MINUTES_AFTER) * 60_000,
  );

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

export function canAccessVideoCall(
  session: MemberSession | null | undefined,
  now = new Date(),
): VideoCallAccess {
  if (
    !session ||
    !['scheduled', 'rescheduled'].includes(session.status || 'scheduled')
  ) {
    return { ok: false, reason: 'Bu randevu aktif değil veya iptal edilmiş.' };
  }

  const start = new Date(String(session.date || ''));
  if (Number.isNaN(start.getTime())) {
    return { ok: false, reason: 'Randevu tarihi geçersiz.' };
  }

  const timing = getVideoCallTiming(session, now);
  if (timing.isExpired) {
    return { ok: false, reason: 'Görüşme süresi doldu.', timing };
  }
  return { ok: true, timing };
}

export function canJoinVideoCall(
  session: MemberSession | null | undefined,
  now = new Date(),
): VideoCallAccess {
  const access = canAccessVideoCall(session, now);
  if (!access.ok || !access.timing) return access;

  const { timing } = access;
  if (timing.isBeforeWindow) {
    return {
      ok: false,
      timing,
      reason: `Görüşme ${formatDurationTr(timing.untilWindowOpensMs)} sonra açılacak.`,
      statusLabel: `Açılışa ${formatDurationTr(timing.untilWindowOpensMs)} kaldı`,
    };
  }
  if (timing.isLive) {
    return {
      ok: true,
      timing,
      statusLabel: `Canlı · Kalan ${formatDurationTr(timing.untilSessionEndMs)}`,
    };
  }
  if (timing.isInJoinWindow && timing.untilStartMs > 0) {
    return {
      ok: true,
      timing,
      statusLabel: `Randevu ${formatDurationTr(timing.untilStartMs)} sonra başlayacak`,
    };
  }
  return {
    ok: true,
    timing,
    statusLabel: `Oda kapanmasına ${formatDurationTr(timing.untilWindowEndMs)} kaldı`,
  };
}

/** Compatibility exports for existing staff/member call consumers. */
export const getSessionTiming = getVideoCallTiming;
export const canAccessCallRoom = canAccessVideoCall;
export const canJoinSession = canJoinVideoCall;

export function findMemberSession(
  member: Record<string, unknown> | null,
  sessionType: string,
  sessionId: string,
) {
  const type = normalizeVideoSessionType(sessionType);
  const list = member?.[sessionsKey(type)];
  const session = Array.isArray(list)
    ? (list as MemberSession[]).find((item) => String(item?.id || '') === sessionId)
    : null;
  return session ? { session, sessionType: type } : null;
}

export function findStaffSession(
  members: Record<string, unknown>[],
  staffId: string,
  staffRole: string | undefined,
  sessionType: string,
  sessionId: string,
) {
  const type = normalizeVideoSessionType(sessionType);
  if (normalizeVideoSessionType(String(staffRole || '')) !== type) return null;

  const assignmentKey =
    type === 'dietitian'
      ? 'assignedDietitianId'
      : type === 'doctor'
        ? 'assignedDoctorId'
        : 'assignedCoachId';

  for (const member of members) {
    if (String(member[assignmentKey] || '') !== String(staffId)) continue;
    const found = findMemberSession(member, type, sessionId);
    if (found) return { ...found, member };
  }
  return null;
}

export function resolveMemberCallContext(opts: {
  member: Record<string, unknown> | null;
  userId: string | null;
  sessionType: string;
  sessionId: string;
  now?: Date;
}): { context: MemberCallContext | null; error: string | null } {
  const { member, userId, sessionId } = opts;
  if (!member || !userId || String(member.id || '') !== String(userId)) {
    return {
      context: null,
      error: 'Randevu bulunamadı veya bu görüşmeye erişiminiz yok.',
    };
  }

  const sessionType = normalizeVideoSessionType(opts.sessionType);
  const list = member[sessionsKey(sessionType)];
  const session = Array.isArray(list)
    ? (list as MemberSession[]).find((item) => String(item?.id || '') === sessionId)
    : null;

  if (!session) return { context: null, error: 'Randevu bulunamadı.' };

  const roomAccess = canAccessVideoCall(session, opts.now);
  const joinCheck = canJoinVideoCall(session, opts.now);
  return {
    context: {
      session,
      sessionType,
      displayName: String(member.name || 'Danışan'),
      remoteLabel: String(session.coach || remoteStaffLabel(sessionType)),
      roomAccess,
      joinCheck,
    },
    error: roomAccess.ok ? null : roomAccess.reason || 'Randevu bulunamadı.',
  };
}
