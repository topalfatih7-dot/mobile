/**
 * Personel hakediş iş kuralları — web `src/data/staffPayouts.js` parity.
 */

/** Tamamlanan ve faturalandırılabilir video görüşme başına net hakediş (TRY) */
export const STAFF_SESSION_RATE_TRY = 500;

/** Minimum eşzamanlı görüşme süresi (dakika) — altında hakediş oluşmaz */
export const STAFF_MIN_OVERLAP_MINUTES = 15;

export const STAFF_PAYOUT_TIMEZONE = 'Europe/Istanbul';

export const STAFF_EARNING_STATUS: Record<string, string> = {
  pending: 'Onay bekliyor',
  approved: 'Onaylandı',
  paid: 'Ödendi',
  reversed: 'İptal / iade',
  rejected: 'Reddedildi',
};

export const STAFF_SESSION_TYPE_LABELS: Record<string, string> = {
  coach_session: 'Koç görüşmesi',
  dietitian_session: 'Diyetisyen görüşmesi',
  doctor_session: 'Doktor görüşmesi',
};

const DOW: Record<string, number> = {
  Sun: 0,
  Mon: 1,
  Tue: 2,
  Wed: 3,
  Thu: 4,
  Fri: 5,
  Sat: 6,
};
const YMD_RE = /^(\d{4})-(\d{2})-(\d{2})$/;
const ISO_WEEK_RE = /^(\d{4})-W(\d{2})$/;

type CivilDate = { year: number; month: number; day: number; weekday?: number };

export function formatStaffTry(amount: number): string {
  return new Intl.NumberFormat('tr-TR', {
    style: 'currency',
    currency: 'TRY',
    maximumFractionDigits: 0,
  }).format(amount || 0);
}

export function staffSessionTypeLabel(sessionType: string | null | undefined): string {
  return STAFF_SESSION_TYPE_LABELS[String(sessionType || '')] || 'Görüşme';
}

function pad2(n: number) {
  return String(n).padStart(2, '0');
}

export function ymdKey({ year, month, day }: { year: number; month: number; day: number }) {
  return `${year}-${pad2(month)}-${pad2(day)}`;
}

export function parseYmdKey(periodKey: string | null | undefined): CivilDate | null {
  const m = String(periodKey || '').match(YMD_RE);
  if (!m) return null;
  return { year: Number(m[1]), month: Number(m[2]), day: Number(m[3]) };
}

export function addCalendarDays(civil: CivilDate, days: number): CivilDate {
  const utc = Date.UTC(civil.year, civil.month - 1, civil.day + days);
  const d = new Date(utc);
  return { year: d.getUTCFullYear(), month: d.getUTCMonth() + 1, day: d.getUTCDate() };
}

export function istanbulCivilDate(dateInput: Date | string | number): CivilDate | null {
  const date = dateInput instanceof Date ? dateInput : new Date(dateInput);
  if (Number.isNaN(date.getTime())) return null;
  const fmt = new Intl.DateTimeFormat('en-GB', {
    timeZone: STAFF_PAYOUT_TIMEZONE,
    weekday: 'short',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
  const parts = Object.fromEntries(fmt.formatToParts(date).map((p) => [p.type, p.value]));
  return {
    year: Number(parts.year),
    month: Number(parts.month),
    day: Number(parts.day),
    weekday: DOW[parts.weekday] ?? 0,
  };
}

export function staffPayoutPeriodKey(sessionStartsAt: Date | string | number): string {
  const civil = istanbulCivilDate(sessionStartsAt);
  if (!civil) return '';
  const weekday = civil.weekday ?? 0;
  const daysToAdd = weekday === 5 ? 7 : (5 - weekday + 7) % 7;
  return ymdKey(addCalendarDays(civil, daysToAdd));
}

export function staffPayoutAccrualWindow(periodKey: string | null | undefined) {
  const friday = parseYmdKey(periodKey);
  if (!friday) return null;
  return {
    start: addCalendarDays(friday, -7),
    end: addCalendarDays(friday, -1),
    payout: friday,
  };
}

function formatYmdTr(civil: CivilDate | null, options: Intl.DateTimeFormatOptions) {
  if (!civil) return '—';
  const utc = new Date(Date.UTC(civil.year, civil.month - 1, civil.day, 12));
  return new Intl.DateTimeFormat('tr-TR', { timeZone: 'UTC', ...options }).format(utc);
}

export function formatStaffPayoutPeriodLabel(periodKey: string | null | undefined): string {
  if (!periodKey) return '—';
  const isoWeek = String(periodKey).match(ISO_WEEK_RE);
  if (isoWeek) return `${isoWeek[1]} · Hafta ${isoWeek[2]}`;
  const ymd = parseYmdKey(periodKey);
  if (ymd) {
    return formatYmdTr(ymd, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
  }
  return periodKey;
}

export function formatStaffPayoutWindowLabel(periodKey: string | null | undefined): string {
  const window = staffPayoutAccrualWindow(periodKey);
  if (!window) return '';
  const start = formatYmdTr(window.start, { day: 'numeric', month: 'short' });
  const end = formatYmdTr(window.end, { day: 'numeric', month: 'short' });
  return `${start} – ${end}`;
}

export function formatIstanbulDateTime(iso: Date | string | number | null | undefined): string {
  const date = iso instanceof Date ? iso : new Date(iso || '');
  if (Number.isNaN(date.getTime())) return '—';
  return new Intl.DateTimeFormat('tr-TR', {
    timeZone: STAFF_PAYOUT_TIMEZONE,
    weekday: 'short',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}

const SESSION_LIST_KEYS = ['coachSessions', 'dietitianSessions', 'doctorSessions'] as const;

export function findMemberSession(
  member: Record<string, unknown> | null | undefined,
  sessionId: string | null | undefined,
) {
  if (!member || !sessionId) return null;
  for (const key of SESSION_LIST_KEYS) {
    const list = member[key];
    if (!Array.isArray(list)) continue;
    const hit = list.find((s) => s && typeof s === 'object' && (s as { id?: string }).id === sessionId);
    if (hit) return hit as { id?: string; date?: string };
  }
  return null;
}

export function earningMeetingMeta(
  row: {
    member_id?: string;
    member_name?: string | null;
    session_id?: string;
    session_started_at?: string | null;
    created_at?: string;
    overlap_minutes?: number;
    session_type?: string;
  },
  members: Record<string, unknown>[] = [],
) {
  const member = (members || []).find((m) => String(m.id) === String(row?.member_id));
  const session = findMemberSession(member, row?.session_id);
  return {
    memberName: String(row?.member_name || member?.name || 'Danışan'),
    startedAt: row?.session_started_at || session?.date || row?.created_at || null,
    overlapMinutes: Number(row?.overlap_minutes || 0),
    sessionType: row?.session_type || '',
    sessionTypeLabel: staffSessionTypeLabel(row?.session_type),
  };
}

export function nextStaffPayoutPeriodKey(
  now: Date = new Date(),
  pendingPeriodKeys: (string | null | undefined)[] = [],
): string {
  const ymd = (pendingPeriodKeys || []).filter((k) => YMD_RE.test(String(k || ''))).sort() as string[];
  if (ymd.length) return ymd[0];
  const rest = (pendingPeriodKeys || []).filter(Boolean) as string[];
  if (rest.length) return rest[0];
  return staffPayoutPeriodKey(now);
}
