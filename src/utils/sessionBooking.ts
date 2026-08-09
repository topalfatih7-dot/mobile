/** Schedule / book-session helpers — LOCK: schedule.md + api-book-session.md */

export type SessionType = 'coach' | 'dietitian' | 'doctor';

export const JOIN_MINUTES_BEFORE = 15;
export const JOIN_MINUTES_AFTER = 30;
export const BOOK_WINDOW_DAYS = 28;
export const DEFAULT_SESSION_DURATION = 30;

export const SESSION_TABS: {
  id: SessionType;
  label: string;
  title: string;
  subtitle: string;
  lockedTitle: string;
  lockedDescription: string;
  icon: 'barbell' | 'nutrition' | 'medkit';
}[] = [
  {
    id: 'coach',
    label: 'Koç',
    title: 'Koç Randevuları',
    subtitle: 'Birebir antrenman görüşmeleriniz',
    lockedTitle: 'Koç randevuları paketinizde yok',
    lockedDescription: 'Birebir koç görüşmeleri için koç içeren bir pakete geçin.',
    icon: 'barbell',
  },
  {
    id: 'dietitian',
    label: 'Diyetisyen',
    title: 'Diyetisyen Randevuları',
    subtitle: 'Beslenme rehberliği — tıbbi tedavi değildir',
    lockedTitle: 'Diyetisyen randevuları paketinizde yok',
    lockedDescription: 'Beslenme rehberliği için diyetisyen içeren bir pakete geçin.',
    icon: 'nutrition',
  },
  {
    id: 'doctor',
    label: 'Doktor',
    title: 'Doktor Randevuları',
    subtitle: 'Online sağlık görüşmeleriniz',
    lockedTitle: 'Doktor randevuları paketinizde yok',
    lockedDescription: 'Online doktor görüşmesi için Doktor Paketi veya VIP pakete geçin.',
    icon: 'medkit',
  },
];

export function coachMonthlyLimit(packageConfig: Record<string, unknown> = {}) {
  return (
    Number(packageConfig.coachMeetingsPerMonth) ||
    Number(packageConfig.coachMeetingsPerWeek) ||
    0
  );
}

export function dietitianMonthlyLimit(packageConfig: Record<string, unknown> = {}) {
  return Number(packageConfig.dietitianMeetingsPerMonth) || 0;
}

export function doctorMonthlyLimit() {
  return 1;
}

export function sessionsKey(type: SessionType): 'coachSessions' | 'dietitianSessions' | 'doctorSessions' {
  if (type === 'dietitian') return 'dietitianSessions';
  if (type === 'doctor') return 'doctorSessions';
  return 'coachSessions';
}

export function sessionTitle(type: SessionType) {
  if (type === 'dietitian') return 'Diyetisyen Görüşmesi';
  if (type === 'doctor') return 'Doktor Görüşmesi';
  return 'Koç Görüşmesi';
}

export function memberCallPath(type: SessionType, sessionId: string) {
  return `/(member)/call/${type}/${sessionId}` as const;
}

export function assignedStaffIdKey(type: SessionType) {
  if (type === 'dietitian') return 'assignedDietitianId';
  if (type === 'doctor') return 'assignedDoctorId';
  return 'assignedCoachId';
}

export type MemberSession = {
  id: string;
  type?: string;
  title?: string;
  date?: string;
  duration?: number;
  status?: string;
  coach?: string;
  bookedBy?: string;
  createdAt?: string;
  cancelledReason?: string;
  cancelledAt?: string;
  cancelRequestedAt?: string;
  cancelRequestedBy?: string;
  statusBeforeCancel?: string;
  memberId?: string;
  memberName?: string;
};

const SLOT_ACTIVE = [
  'pending',
  'scheduled',
  'rescheduled',
  'cancel_pending',
  'admin_cancel_pending',
];

export function countSessionsThisMonth(sessions: MemberSession[] = [], now = new Date()) {
  const y = now.getFullYear();
  const m = now.getMonth();
  return sessions.filter((s) => {
    if (!s?.date || !SLOT_ACTIVE.includes(s.status || 'scheduled')) {
      return false;
    }
    const d = new Date(s.date);
    return d.getFullYear() === y && d.getMonth() === m;
  }).length;
}

/**
 * @deprecated Prefer canJoinSession from videoCallSession (sektör penceresi + duration).
 * Sabit 15/30 — yalnızca geriye dönük uyumluluk.
 */
export function isJoinWindowOpen(sessionDateIso: string, now = new Date()) {
  const start = new Date(sessionDateIso).getTime();
  if (!start || Number.isNaN(start)) return false;
  const open = start - JOIN_MINUTES_BEFORE * 60_000;
  const close = start + JOIN_MINUTES_AFTER * 60_000;
  const t = now.getTime();
  return t >= open && t <= close;
}

/** staff.availability[dow] hour keys → 30-min slots */
export function expandAvailabilitySlots(
  availability: Record<string, string[]> | null | undefined,
  day: Date,
): Date[] {
  const dow = String(day.getDay()); // 0=Sun
  const hours = availability?.[dow] || [];
  const slots: Date[] = [];
  for (const h of hours) {
    const [hh] = h.split(':').map(Number);
    if (Number.isNaN(hh)) continue;
    for (const mm of [0, 30]) {
      const dt = new Date(day);
      dt.setHours(hh, mm, 0, 0);
      slots.push(dt);
    }
  }
  return slots;
}

export function parseTabParam(raw?: string | string[] | null): SessionType {
  const v = Array.isArray(raw) ? raw[0] : raw;
  if (v === 'dietitian' || v === 'doctor' || v === 'coach') return v;
  return 'coach';
}
