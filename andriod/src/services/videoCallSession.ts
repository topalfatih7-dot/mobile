import type { MemberSession, SessionType } from '@/utils/sessionBooking';

/** Web / api/_videoJoinWindows.js parity */
const JOIN_WINDOW_DEFAULTS: Record<SessionType, { before: number; after: number }> = {
  coach: { before: 10, after: 20 },
  dietitian: { before: 15, after: 30 },
  doctor: { before: 15, after: 30 },
};

export const DEFAULT_VIDEO_SESSION_DURATION = 30;

export type VideoCallTiming = {
  start: Date;
  sessionEnd: Date;
  windowStart: Date;
  windowEnd: Date;
  before: number;
  after: number;
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
  memberId: string;
  staffId: string;
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

/** Sektöre göre katılma penceresi (dk önce / süre bitiminden sonra) — web parity */
export function getJoinWindowMinutes(sessionType: string): { before: number; after: number } {
  const type = normalizeVideoSessionType(sessionType);
  return JOIN_WINDOW_DEFAULTS[type] || JOIN_WINDOW_DEFAULTS.coach;
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

function assignedStaffIdFromMember(
  member: Record<string, unknown>,
  type: SessionType,
): string {
  const key =
    type === 'dietitian'
      ? 'assignedDietitianId'
      : type === 'doctor'
        ? 'assignedDoctorId'
        : 'assignedCoachId';
  return String(member[key] || '').trim();
}

export function getVideoCallTiming(
  session: MemberSession,
  sessionType: string = 'coach',
  now = new Date(),
): VideoCallTiming {
  const start = new Date(String(session.date || ''));
  const durationMinutes = Number(session.duration) || DEFAULT_VIDEO_SESSION_DURATION;
  const { before, after } = getJoinWindowMinutes(sessionType);
  const windowStart = new Date(start.getTime() - before * 60_000);
  const sessionEnd = new Date(start.getTime() + durationMinutes * 60_000);
  const windowEnd = new Date(start.getTime() + (durationMinutes + after) * 60_000);

  return {
    start,
    sessionEnd,
    windowStart,
    windowEnd,
    before,
    after,
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

/** API daily-room: scheduled + iptal onayı bekleyen (henüz kesin iptal değil) */
export function canAccessVideoCall(
  session: MemberSession | null | undefined,
  sessionType: string = 'coach',
  now = new Date(),
): VideoCallAccess {
  const st = session?.status || 'scheduled';
  if (!session || !['scheduled', 'cancel_pending', 'admin_cancel_pending'].includes(st)) {
    return { ok: false, reason: 'Bu randevu aktif değil veya iptal edilmiş.' };
  }

  const start = new Date(String(session.date || ''));
  if (Number.isNaN(start.getTime())) {
    return { ok: false, reason: 'Randevu tarihi geçersiz.' };
  }

  const timing = getVideoCallTiming(session, sessionType, now);
  if (timing.isExpired) {
    return { ok: false, reason: 'Görüşme süresi doldu.', timing };
  }
  return { ok: true, timing };
}

export function canJoinVideoCall(
  session: MemberSession | null | undefined,
  sessionType: string = 'coach',
  now = new Date(),
): VideoCallAccess {
  const access = canAccessVideoCall(session, sessionType, now);
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

  const roomAccess = canAccessVideoCall(session, sessionType, opts.now);
  const joinCheck = canJoinVideoCall(session, sessionType, opts.now);
  return {
    context: {
      session,
      sessionType,
      displayName: String(member.name || 'Danışan'),
      remoteLabel: String(session.coach || remoteStaffLabel(sessionType)),
      roomAccess,
      joinCheck,
      memberId: String(member.id || userId),
      staffId: assignedStaffIdFromMember(member, sessionType),
    },
    error: roomAccess.ok ? null : roomAccess.reason || 'Randevu bulunamadı.',
  };
}

/** Web `resolveCallContext` staff branch parity */
export function resolveStaffCallContext(opts: {
  staff: Record<string, unknown> | null;
  members: Record<string, unknown>[];
  sessionType: string;
  sessionId: string;
  now?: Date;
}): { context: MemberCallContext | null; error: string | null } {
  const { staff, members, sessionId } = opts;
  if (!staff?.id) {
    return {
      context: null,
      error: 'Randevu bulunamadı veya bu görüşmeye erişiminiz yok.',
    };
  }

  const sessionType = normalizeVideoSessionType(opts.sessionType);
  const found = findStaffSession(
    members,
    String(staff.id),
    staff.role ? String(staff.role) : undefined,
    sessionType,
    sessionId,
  );

  if (!found) {
    return {
      context: null,
      error: 'Randevu bulunamadı veya bu görüşmeye erişiminiz yok.',
    };
  }

  const roomAccess = canAccessVideoCall(found.session, sessionType, opts.now);
  const joinCheck = canJoinVideoCall(found.session, sessionType, opts.now);
  return {
    context: {
      session: found.session,
      sessionType,
      displayName: String(staff.name || 'Uzman'),
      remoteLabel: String(
        (found.member as { name?: string } | undefined)?.name || 'Danışan',
      ),
      roomAccess,
      joinCheck,
      memberId: String((found.member as { id?: string } | undefined)?.id || ''),
      staffId: String(staff.id),
    },
    error: roomAccess.ok ? null : roomAccess.reason || 'Randevu bulunamadı.',
  };
}
