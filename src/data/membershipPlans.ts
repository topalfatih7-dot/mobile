export const PLAN_LABELS: Record<string, string> = {
  free: 'Basic',
  eko: 'Eko Paket',
  diyet: 'Diyet Paketi',
  spor: 'Spor Paketi',
  doktor: 'Doktor Paketi',
  kurucu: '100 Kurucu Üye',
  vip: 'Vip Paket',
  gumus: 'Gümüş',
  altin: 'Altın',
  platinum: 'Platinum',
  premium: 'Premium',
};

export const PAID_MEMBERSHIPS = [
  'eko',
  'diyet',
  'spor',
  'doktor',
  'kurucu',
  'vip',
  'gumus',
  'altin',
  'platinum',
  'premium',
];

export const PLAN_DISPLAY_ORDER = ['free', 'eko', 'diyet', 'spor', 'doktor', 'vip'];

export const DURATION_OPTIONS = [
  { months: 1, label: 'Aylık' },
  { months: 3, label: '3 Aylık' },
  { months: 6, label: '6 Aylık' },
] as const;

/** Web `PLAN_PRICING` — API de aynı fallback’i kullanır. */
export const PLAN_PRICING: Record<string, Record<number, number>> = {
  eko: { 1: 1299, 3: 2999, 6: 3999 },
  diyet: { 1: 2499, 3: 6499, 6: 9999 },
  spor: { 1: 2499, 3: 6499, 6: 9999 },
  doktor: { 1: 1500 },
  vip: { 1: 4999, 3: 12999, 6: 19999 },
};

export const RECOMMENDED_PLAN = 'vip';
export const RECOMMENDED_DURATION_MONTHS = 6;

export function sortPlansForDisplay<T extends { id: string }>(plans: T[] = []): T[] {
  return [...plans].sort((a, b) => {
    const ia = PLAN_DISPLAY_ORDER.indexOf(a.id);
    const ib = PLAN_DISPLAY_ORDER.indexOf(b.id);
    return (ia === -1 ? 99 : ia) - (ib === -1 ? 99 : ib);
  });
}

export function getTierPrice(planId: string, months = 1): number {
  const m = Number(months) || 1;
  const tiers = PLAN_PRICING[planId];
  if (!tiers) return 0;
  return tiers[m] || tiers[1] || 0;
}

export function formatTry(amount: number): string {
  return `${Number(amount || 0).toLocaleString('tr-TR')}₺`;
}

export function isOneTimeBillingPlan(planId?: string | null): boolean {
  return planId === 'doktor';
}

export type PackageConfig = {
  coachMeetingsPerMonth?: number;
  dietitianMeetingsPerMonth?: number;
  coachMeetingsPerWeek?: number;
  durationMonths?: number;
  durationWeeks?: number;
  planId?: string;
  addOns?: string[];
};

const PACKAGE_BY_PLAN: Record<string, Pick<PackageConfig, 'coachMeetingsPerMonth' | 'dietitianMeetingsPerMonth' | 'coachMeetingsPerWeek'>> = {
  eko: { coachMeetingsPerMonth: 0, dietitianMeetingsPerMonth: 0 },
  diyet: { coachMeetingsPerMonth: 0, dietitianMeetingsPerMonth: 2 },
  spor: { coachMeetingsPerMonth: 2, dietitianMeetingsPerMonth: 0 },
  kurucu: { coachMeetingsPerMonth: 2, dietitianMeetingsPerMonth: 2 },
  vip: { coachMeetingsPerMonth: 2, dietitianMeetingsPerMonth: 2 },
  gumus: { coachMeetingsPerMonth: 0, dietitianMeetingsPerMonth: 1, coachMeetingsPerWeek: 1 },
  altin: { coachMeetingsPerMonth: 2, dietitianMeetingsPerMonth: 2, coachMeetingsPerWeek: 2 },
  platinum: { coachMeetingsPerMonth: 4, dietitianMeetingsPerMonth: 4, coachMeetingsPerWeek: 3 },
  premium: { coachMeetingsPerMonth: 2, dietitianMeetingsPerMonth: 2, coachMeetingsPerWeek: 2 },
};

export function getPlanLabel(id?: string | null) {
  if (!id) return 'Basic';
  return PLAN_LABELS[id] || id;
}

export function isPaidMembership(membership?: string | null) {
  return PAID_MEMBERSHIPS.includes(membership || '');
}

export function getDefaultPackageForPlan(planId: string, durationMonths = 1): PackageConfig {
  const months = Number(durationMonths) || 1;
  const base = PACKAGE_BY_PLAN[planId] || { coachMeetingsPerMonth: 0, dietitianMeetingsPerMonth: 0 };
  return {
    coachMeetingsPerMonth: 0,
    dietitianMeetingsPerMonth: 0,
    coachMeetingsPerWeek: 0,
    durationMonths: months,
    durationWeeks: months * 4,
    addOns: [],
    ...base,
  };
}

export function packageIncludesCoach(packageConfig: PackageConfig = {}) {
  return (Number(packageConfig.coachMeetingsPerMonth) || Number(packageConfig.coachMeetingsPerWeek) || 0) > 0;
}

export function packageIncludesDietitian(packageConfig: PackageConfig = {}) {
  return (Number(packageConfig.dietitianMeetingsPerMonth) || 0) > 0;
}

export function getCoachMeetingsPerMonth(packageConfig: PackageConfig = {}) {
  return Number(packageConfig.coachMeetingsPerMonth) || (Number(packageConfig.coachMeetingsPerWeek) || 0) * 4;
}

export const MEMBERSHIP_STATUS_LABELS: Record<string, string> = {
  active: 'Aktif',
  paused: 'Duraklatıldı',
  cancelled: 'İptal edildi',
  expired: 'Süresi doldu',
};
