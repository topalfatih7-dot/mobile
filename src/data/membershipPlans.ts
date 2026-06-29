export const PLAN_LABELS: Record<string, string> = {
  free: 'Basic',
  eko: 'Eko Paket',
  diyet: 'Diyet Paketi',
  spor: 'Spor Paketi',
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
  'kurucu',
  'vip',
  'gumus',
  'altin',
  'platinum',
  'premium',
];

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
