/** Plan ids LOCK: free|eko|diyet|spor|doktor|vip */

export const PLAN_IDS = ['free', 'eko', 'diyet', 'spor', 'doktor', 'vip'] as const;
export type PlanId = (typeof PLAN_IDS)[number];

export const PLAN_DISPLAY_ORDER = [...PLAN_IDS];

export const PLAN_LABELS: Record<string, string> = {
  free: 'Basic',
  eko: 'Eko Paket',
  diyet: 'Diyet Paketi',
  spor: 'Spor Paketi',
  doktor: 'Doktor Paketi',
  vip: 'Vip Paket',
};

export const PAID_MEMBERSHIPS = ['eko', 'diyet', 'spor', 'doktor', 'vip'];

export const DURATION_OPTIONS = [
  { months: 1, label: 'Aylık' },
  { months: 3, label: '3 Aylık' },
  { months: 6, label: '6 Aylık' },
] as const;

export const PLAN_PRICING: Record<string, Record<number, number>> = {
  eko: { 1: 1299, 3: 2999, 6: 3999 },
  diyet: { 1: 2499, 3: 6499, 6: 9999 },
  spor: { 1: 2499, 3: 6499, 6: 9999 },
  doktor: { 1: 1500 },
  vip: { 1: 4999, 3: 12999, 6: 19999 },
};

export const RECOMMENDED_PLAN = 'vip';
export const RECOMMENDED_DURATION_MONTHS = 6;

export type PlanCard = {
  id: string;
  name: string;
  price: number;
  period: string;
  blurb: string;
  color: 'sage' | 'brand' | 'warm' | 'gold' | 'mint';
};

export const ALL_PLANS: PlanCard[] = [
  {
    id: 'free',
    name: 'Basic',
    price: 0,
    period: 'Süresiz',
    blurb: 'Sağlık analizi ve temel takip ile ücretsiz başla.',
    color: 'sage',
  },
  {
    id: 'eko',
    name: 'Eko Paket',
    price: 1299,
    period: 'Aylık',
    blurb: 'Kalori, diyet ve spor programı güncellemeleri.',
    color: 'brand',
  },
  {
    id: 'diyet',
    name: 'Diyet Paketi',
    price: 2499,
    period: 'Aylık',
    blurb: 'Ayda 2 diyetisyen görüşmesi + özel beslenme.',
    color: 'mint',
  },
  {
    id: 'spor',
    name: 'Spor Paketi',
    price: 2499,
    period: 'Aylık',
    blurb: 'Ayda 2 koç görüşmesi + özel antrenman.',
    color: 'warm',
  },
  {
    id: 'doktor',
    name: 'Doktor Paketi',
    price: 1500,
    period: 'Tek Seferlik',
    blurb: '1 online doktor görüşmesi.',
    color: 'gold',
  },
  {
    id: 'vip',
    name: 'Vip Paket',
    price: 4999,
    period: 'Aylık',
    blurb: 'Koç + diyetisyen + doktor desteği tek planda.',
    color: 'brand',
  },
];

export function sortPlansForDisplay<T extends { id: string }>(plans: T[] = []): T[] {
  return [...plans].sort((a, b) => {
    const ia = PLAN_DISPLAY_ORDER.indexOf(a.id as PlanId);
    const ib = PLAN_DISPLAY_ORDER.indexOf(b.id as PlanId);
    return (ia === -1 ? 99 : ia) - (ib === -1 ? 99 : ib);
  });
}

export function getTierPrice(planId: string, months = 1): number {
  if (planId === 'free') return 0;
  const tiers = PLAN_PRICING[planId];
  if (!tiers) return 0;
  const m = Number(months) || 1;
  return tiers[m] || tiers[1] || 0;
}

export function formatTry(amount: number): string {
  if (!amount) return 'Ücretsiz';
  return `${Number(amount).toLocaleString('tr-TR')}₺`;
}

export function isPaidMembership(id?: string | null) {
  return PAID_MEMBERSHIPS.includes(id || '');
}

export function getPlanLabel(id?: string | null) {
  return PLAN_LABELS[id || ''] || id || 'Basic';
}

/** Query legacy map — LOCK onboarding */
export function resolvePlanFromQuery(raw?: string | null): string {
  const v = (raw || 'free').toLowerCase().trim();
  const legacy: Record<string, string> = {
    gumus: 'eko',
    altin: 'doktor',
    platinum: 'vip',
    premium: 'vip',
    kurucu: 'doktor',
  };
  const mapped = legacy[v] || v;
  return PLAN_IDS.includes(mapped as PlanId) ? mapped : 'free';
}

export const DEFAULT_PACKAGE = {
  coachMeetingsPerMonth: 0,
  dietitianMeetingsPerMonth: 0,
  doctorMeetingsPerMonth: 0,
  coachMeetingsPerWeek: 0,
  durationMonths: 1,
  durationWeeks: 4,
  addOns: [] as unknown[],
};

const PACKAGE_BY_PLAN: Record<string, Record<string, number | string>> = {
  eko: { coachMeetingsPerMonth: 0, dietitianMeetingsPerMonth: 0, doctorMeetingsPerMonth: 0 },
  diyet: { coachMeetingsPerMonth: 0, dietitianMeetingsPerMonth: 2, doctorMeetingsPerMonth: 1 },
  spor: { coachMeetingsPerMonth: 2, dietitianMeetingsPerMonth: 0, doctorMeetingsPerMonth: 1 },
  doktor: {
    coachMeetingsPerMonth: 0,
    dietitianMeetingsPerMonth: 0,
    doctorMeetingsPerMonth: 0,
    doctorSessionsTotal: 1,
    billingType: 'one_time',
  },
  vip: { coachMeetingsPerMonth: 2, dietitianMeetingsPerMonth: 2, doctorMeetingsPerMonth: 1 },
};

export function getDefaultPackageForPlan(planId: string, durationMonths = 1) {
  if (planId === 'doktor') {
    return {
      ...DEFAULT_PACKAGE,
      ...PACKAGE_BY_PLAN.doktor,
      durationMonths: 0,
      durationWeeks: 0,
      addOns: [],
    };
  }
  const months = Number(durationMonths) || 1;
  const base = PACKAGE_BY_PLAN[planId] || {
    coachMeetingsPerMonth: 0,
    dietitianMeetingsPerMonth: 0,
    doctorMeetingsPerMonth: 0,
  };
  return {
    ...DEFAULT_PACKAGE,
    ...base,
    durationMonths: months,
    durationWeeks: months * 4,
    addOns: [],
  };
}

export function packageIncludesCoach(packageConfig: Record<string, unknown> = {}) {
  return (
    (Number(packageConfig.coachMeetingsPerMonth) ||
      Number(packageConfig.coachMeetingsPerWeek) ||
      0) > 0
  );
}

export function packageIncludesDietitian(packageConfig: Record<string, unknown> = {}) {
  return (Number(packageConfig.dietitianMeetingsPerMonth) || 0) > 0;
}

export function packageIncludesDoctor(packageConfig: Record<string, unknown> = {}) {
  const total = Number(packageConfig.doctorSessionsTotal) || 0;
  if (total > 0) {
    const remaining = packageConfig.doctorSessionsRemaining;
    if (remaining != null && !Number.isNaN(Number(remaining))) return Number(remaining) > 0;
    return true;
  }
  return (Number(packageConfig.doctorMeetingsPerMonth) || 0) > 0;
}

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

export function hasFullVideoAccess(membership?: string | null) {
  return ['spor', 'vip', 'platinum', 'premium'].includes(membership || '');
}

export function sanitizeSessionsForRole(sessions: unknown[] = [], keepRole: boolean) {
  if (keepRole) return Array.isArray(sessions) ? sessions : [];
  const now = Date.now();
  return (Array.isArray(sessions) ? sessions : []).map((s) => {
    if (!s || typeof s !== 'object') return s;
    const session = s as Record<string, unknown>;
    const status = (session.status as string) || 'scheduled';
    if (status === 'completed' || status === 'cancelled') return s;
    const t = new Date(String(session.date || session.start || 0)).getTime();
    if (!t || Number.isNaN(t) || t < now) return s;
    return {
      ...session,
      status: 'cancelled',
      cancelledReason: session.cancelledReason || 'package_ended',
      cancelledAt: session.cancelledAt || new Date().toISOString(),
    };
  });
}

export function sanitizeStaffForPackage(
  packageConfig: Record<string, unknown>,
  data: Record<string, unknown> = {},
) {
  const includeCoach = packageIncludesCoach(packageConfig);
  const includeDiet = packageIncludesDietitian(packageConfig);
  const includeDoctor = packageIncludesDoctor(packageConfig);
  return {
    ...data,
    assignedCoachId: includeCoach ? (data.assignedCoachId ?? null) : null,
    assignedDietitianId: includeDiet ? (data.assignedDietitianId ?? null) : null,
    assignedDoctorId: includeDoctor ? (data.assignedDoctorId ?? null) : null,
    coachSessions: sanitizeSessionsForRole(
      (data.coachSessions as unknown[]) || [],
      includeCoach,
    ),
    dietitianSessions: sanitizeSessionsForRole(
      (data.dietitianSessions as unknown[]) || [],
      includeDiet,
    ),
    doctorSessions: sanitizeSessionsForRole(
      (data.doctorSessions as unknown[]) || [],
      includeDoctor,
    ),
  };
}
