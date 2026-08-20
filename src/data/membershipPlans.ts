/** Plan ids — web parity: free|eko|eko_diyet|eko_spor|diyet|spor|doktor|vip */

export const PLAN_IDS = [
  'free',
  'eko',
  'eko_diyet',
  'eko_spor',
  'diyet',
  'spor',
  'doktor',
  'vip',
] as const;
export type PlanId = (typeof PLAN_IDS)[number];

/** Satışa açık sıra (eski tek `eko` kapalı) */
export const PLAN_DISPLAY_ORDER = [
  'eko_diyet',
  'diyet',
  'eko_spor',
  'spor',
  'doktor',
  'vip',
] as const;

export const SELLABLE_PLAN_IDS = [
  'eko_diyet',
  'diyet',
  'eko_spor',
  'spor',
  'doktor',
  'vip',
] as const;

export const PLAN_LABELS: Record<string, string> = {
  free: 'Basic',
  eko: 'Eko Paket (eski)',
  eko_diyet: 'Eko Diyet Paketi',
  eko_spor: 'Eko Spor Paketi',
  diyet: 'Diyet Paketi',
  spor: 'Spor Paketi',
  doktor: 'Doktor Paketi',
  vip: 'Vip Paket',
  kurucu: '100 Kurucu Üye',
  gumus: 'Gümüş',
  altin: 'Altın',
  platinum: 'Platinum',
  premium: 'Premium',
};

export const PAID_MEMBERSHIPS = [
  'eko',
  'eko_diyet',
  'eko_spor',
  'diyet',
  'spor',
  'doktor',
  'vip',
  'kurucu',
  'gumus',
  'altin',
  'platinum',
  'premium',
];

export const ADMIN_ASSIGNABLE_PLAN_IDS = [
  'free',
  'eko_diyet',
  'diyet',
  'eko_spor',
  'spor',
  'doktor',
  'vip',
];

export type PlanEntitlements = {
  coachMeetingsPerMonth: number;
  dietitianMeetingsPerMonth: number;
  doctorMeetingsPerMonth: number;
  doctorSessionsTotal: number;
  photoCalorie: boolean;
  manualCalorie: boolean;
  fullVideo?: boolean;
};

export type PlanCatalogEntry = {
  id: string;
  name?: string;
  price?: number;
  period?: string;
  isActive?: boolean;
  isSellable?: boolean;
  billingType?: string;
  entitlements?: Partial<PlanEntitlements> | null;
  pricingTiers?: { months?: number; price?: number; label?: string }[];
  sortOrder?: number;
  badge?: string | null;
  features?: unknown[];
  limits?: unknown[];
  color?: string;
  icon?: string | null;
  emoji?: string | null;
};

/** Runtime plan kataloğu — web AppContext `setPlanCatalog` parity (DB `plans`) */
let _planCatalog = new Map<string, PlanCatalogEntry>();

export function emptyEntitlements(): PlanEntitlements {
  return {
    coachMeetingsPerMonth: 0,
    dietitianMeetingsPerMonth: 0,
    doctorMeetingsPerMonth: 0,
    doctorSessionsTotal: 0,
    photoCalorie: false,
    manualCalorie: false,
  };
}

export function normalizeEntitlements(raw: Record<string, unknown> = {}): PlanEntitlements {
  const e = emptyEntitlements();
  if (!raw || typeof raw !== 'object') return e;
  e.coachMeetingsPerMonth = Math.max(0, Number(raw.coachMeetingsPerMonth) || 0);
  e.dietitianMeetingsPerMonth = Math.max(0, Number(raw.dietitianMeetingsPerMonth) || 0);
  e.doctorMeetingsPerMonth = Math.max(0, Number(raw.doctorMeetingsPerMonth) || 0);
  e.doctorSessionsTotal = Math.max(0, Number(raw.doctorSessionsTotal) || 0);
  e.photoCalorie = Boolean(raw.photoCalorie);
  e.manualCalorie = Boolean(raw.manualCalorie);
  if (typeof raw.fullVideo === 'boolean') e.fullVideo = raw.fullVideo;
  return e;
}

export function setPlanCatalog(plans: PlanCatalogEntry[] = []) {
  const next = new Map<string, PlanCatalogEntry>();
  for (const p of plans || []) {
    if (p?.id) next.set(String(p.id), p);
  }
  _planCatalog = next;
}

export function getPlanFromCatalog(id?: string | null): PlanCatalogEntry | null {
  if (!id) return null;
  if (_planCatalog.has(id)) return _planCatalog.get(id) || null;
  try {
    const found = ALL_PLANS.find((p) => p.id === id);
    if (found) return found as PlanCatalogEntry;
  } catch {
    /* TDZ */
  }
  return null;
}

export const DURATION_OPTIONS = [
  { months: 1, label: 'Aylık' },
  { months: 3, label: '3 Aylık' },
  { months: 6, label: '6 Aylık' },
] as const;

export const PLAN_PRICING: Record<string, Record<number, number>> = {
  eko: { 1: 1299, 3: 2999, 6: 3999 },
  eko_diyet: { 1: 1299, 3: 2999, 6: 3999 },
  eko_spor: { 1: 1299, 3: 2999, 6: 3999 },
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
  isSellable?: boolean;
  billingType?: string;
  entitlements?: PlanEntitlements;
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
    id: 'eko_diyet',
    name: 'Eko Diyet Paketi',
    price: 1299,
    period: 'Aylık',
    blurb: 'Ayda 1 diyetisyen görüşmesi + kalori takibi.',
    color: 'sage',
    isSellable: true,
    entitlements: {
      coachMeetingsPerMonth: 0,
      dietitianMeetingsPerMonth: 1,
      doctorMeetingsPerMonth: 0,
      doctorSessionsTotal: 0,
      photoCalorie: true,
      manualCalorie: true,
    },
  },
  {
    id: 'diyet',
    name: 'Diyet Paketi',
    price: 2499,
    period: 'Aylık',
    blurb: 'Ayda 2 diyetisyen görüşmesi + özel beslenme.',
    color: 'mint',
    isSellable: true,
    entitlements: {
      coachMeetingsPerMonth: 0,
      dietitianMeetingsPerMonth: 2,
      doctorMeetingsPerMonth: 0,
      doctorSessionsTotal: 0,
      photoCalorie: true,
      manualCalorie: true,
    },
  },
  {
    id: 'eko_spor',
    name: 'Eko Spor Paketi',
    price: 1299,
    period: 'Aylık',
    blurb: 'Ayda 1 koç görüşmesi + tam video kütüphanesi.',
    color: 'brand',
    isSellable: true,
    entitlements: {
      coachMeetingsPerMonth: 1,
      dietitianMeetingsPerMonth: 0,
      doctorMeetingsPerMonth: 0,
      doctorSessionsTotal: 0,
      photoCalorie: true,
      manualCalorie: true,
      fullVideo: true,
    },
  },
  {
    id: 'spor',
    name: 'Spor Paketi',
    price: 2499,
    period: 'Aylık',
    blurb: 'Ayda 2 koç görüşmesi + özel antrenman.',
    color: 'warm',
    isSellable: true,
    entitlements: {
      coachMeetingsPerMonth: 2,
      dietitianMeetingsPerMonth: 0,
      doctorMeetingsPerMonth: 0,
      doctorSessionsTotal: 0,
      photoCalorie: true,
      manualCalorie: true,
      fullVideo: true,
    },
  },
  {
    id: 'doktor',
    name: 'Doktor Paketi',
    price: 1500,
    period: 'Tek Seferlik',
    blurb: '1 online doktor görüşmesi.',
    color: 'gold',
    isSellable: true,
    billingType: 'one_time',
    entitlements: {
      coachMeetingsPerMonth: 0,
      dietitianMeetingsPerMonth: 0,
      doctorMeetingsPerMonth: 0,
      doctorSessionsTotal: 1,
      photoCalorie: false,
      manualCalorie: false,
    },
  },
  {
    id: 'vip',
    name: 'Vip Paket',
    price: 4999,
    period: 'Aylık',
    blurb: 'Koç + diyetisyen + doktor desteği tek planda.',
    color: 'brand',
    isSellable: true,
    entitlements: {
      coachMeetingsPerMonth: 2,
      dietitianMeetingsPerMonth: 2,
      doctorMeetingsPerMonth: 0,
      doctorSessionsTotal: 0,
      photoCalorie: true,
      manualCalorie: true,
      fullVideo: true,
    },
  },
];

export function sortPlansForDisplay<T extends { id: string }>(plans: T[] = []): T[] {
  return [...plans].sort((a, b) => {
    const ia = (PLAN_DISPLAY_ORDER as readonly string[]).indexOf(a.id);
    const ib = (PLAN_DISPLAY_ORDER as readonly string[]).indexOf(b.id);
    return (ia === -1 ? 99 : ia) - (ib === -1 ? 99 : ib);
  });
}

export function getTierPrice(planId: string, months = 1, planRow: PlanCatalogEntry | null = null): number {
  if (planId === 'free') return 0;
  const m = Number(months) || 1;
  const plan = planRow || (_planCatalog.size ? _planCatalog.get(planId) || null : null);
  if (plan) {
    const tiers = plan.pricingTiers || [];
    if (Array.isArray(tiers) && tiers.length) {
      const tier = tiers.find((t) => Number(t.months) === m);
      if (tier != null && tier.price != null && Number(tier.price) > 0) return Number(tier.price);
      if (m === 1) {
        const first = tiers.find((t) => Number(t.price) > 0);
        if (first) return Number(first.price);
      }
    }
    if (Number(plan.price) > 0 && (m === 1 || !tiers.length)) return Number(plan.price);
  }
  const hardcoded = PLAN_PRICING[planId];
  if (!hardcoded) return 0;
  return hardcoded[m] || hardcoded[1] || 0;
}

export function formatTry(amount: number): string {
  if (!amount) return 'Ücretsiz';
  return `${Number(amount).toLocaleString('tr-TR')}₺`;
}

export function isPaidMembership(id?: string | null) {
  if (!id || id === 'free') return false;
  if (PAID_MEMBERSHIPS.includes(id)) return true;
  const plan = getPlanFromCatalog(id);
  if (plan) return Number(plan.price) > 0 || plan.isSellable === true;
  return true;
}

export function getPlanLabel(id?: string | null) {
  const plan = getPlanFromCatalog(id);
  if (plan?.name) return plan.name;
  return PLAN_LABELS[id || ''] || id || 'Basic';
}

export function getMembershipBadgeTier(membership?: string | null) {
  if (
    membership === 'eko' ||
    membership === 'eko_diyet' ||
    membership === 'eko_spor' ||
    membership === 'gumus'
  ) {
    return 'silver';
  }
  if (membership === 'doktor' || membership === 'kurucu') return 'silver';
  if (membership === 'diyet' || membership === 'spor' || membership === 'altin') return 'gold';
  if (membership === 'vip' || membership === 'platinum' || membership === 'premium') {
    return 'platinum';
  }
  return 'free';
}

/** Query legacy map — web OnboardingPage LEGACY_PLAN_MAP */
export function resolvePlanFromQuery(raw?: string | null): string {
  const v = (raw || 'free').toLowerCase().trim();
  if (v === 'free') return 'free';
  const legacy: Record<string, string> = {
    eko: 'eko_diyet',
    gumus: 'eko_diyet',
    altin: 'doktor',
    platinum: 'vip',
    premium: 'vip',
    kurucu: 'doktor',
  };
  const mapped = legacy[v] || v;
  if ((PLAN_IDS as readonly string[]).includes(mapped)) return mapped;
  if ((SELLABLE_PLAN_IDS as readonly string[]).includes(mapped)) return mapped;
  return 'free';
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
  eko_diyet: { coachMeetingsPerMonth: 0, dietitianMeetingsPerMonth: 1, doctorMeetingsPerMonth: 0 },
  eko_spor: { coachMeetingsPerMonth: 1, dietitianMeetingsPerMonth: 0, doctorMeetingsPerMonth: 0 },
  diyet: { coachMeetingsPerMonth: 0, dietitianMeetingsPerMonth: 2, doctorMeetingsPerMonth: 0 },
  spor: { coachMeetingsPerMonth: 2, dietitianMeetingsPerMonth: 0, doctorMeetingsPerMonth: 0 },
  doktor: {
    coachMeetingsPerMonth: 0,
    dietitianMeetingsPerMonth: 0,
    doctorMeetingsPerMonth: 0,
    doctorSessionsTotal: 1,
    billingType: 'one_time',
  },
  vip: { coachMeetingsPerMonth: 2, dietitianMeetingsPerMonth: 2, doctorMeetingsPerMonth: 0 },
  kurucu: { coachMeetingsPerMonth: 2, dietitianMeetingsPerMonth: 2, doctorMeetingsPerMonth: 0 },
  gumus: {
    coachMeetingsPerMonth: 0,
    dietitianMeetingsPerMonth: 1,
    doctorMeetingsPerMonth: 0,
    coachMeetingsPerWeek: 1,
  },
  altin: {
    coachMeetingsPerMonth: 2,
    dietitianMeetingsPerMonth: 2,
    doctorMeetingsPerMonth: 0,
    coachMeetingsPerWeek: 2,
  },
  platinum: {
    coachMeetingsPerMonth: 4,
    dietitianMeetingsPerMonth: 4,
    doctorMeetingsPerMonth: 0,
    coachMeetingsPerWeek: 3,
  },
  premium: {
    coachMeetingsPerMonth: 2,
    dietitianMeetingsPerMonth: 2,
    doctorMeetingsPerMonth: 0,
    coachMeetingsPerWeek: 2,
  },
};

const PHOTO_CALORIE_PLANS = new Set([
  'eko_diyet',
  'eko_spor',
  'diyet',
  'spor',
  'vip',
  'platinum',
  'premium',
]);
const MANUAL_CALORIE_EXCLUDE = new Set(['free', 'doktor', 'kurucu']);
const FULL_VIDEO_PLANS = new Set(['eko_spor', 'spor', 'vip', 'platinum', 'premium']);

function planHasEntitlementFlags(plan?: PlanCatalogEntry | null) {
  const e = plan?.entitlements;
  if (!e || typeof e !== 'object') return false;
  return (
    Number(e.coachMeetingsPerMonth) > 0 ||
    Number(e.dietitianMeetingsPerMonth) > 0 ||
    Number(e.doctorMeetingsPerMonth) > 0 ||
    Number(e.doctorSessionsTotal) > 0 ||
    e.photoCalorie === true ||
    e.manualCalorie === true
  );
}

export function entitlementsToPackageConfig(
  entitlements: Partial<PlanEntitlements> = {},
  billingType = 'recurring',
  durationMonths = 1,
) {
  const e = normalizeEntitlements(entitlements as Record<string, unknown>);
  const oneTime = billingType === 'one_time';
  const months = Number(durationMonths) || 1;
  return {
    ...DEFAULT_PACKAGE,
    coachMeetingsPerMonth: e.coachMeetingsPerMonth,
    dietitianMeetingsPerMonth: e.dietitianMeetingsPerMonth,
    doctorMeetingsPerMonth: e.doctorMeetingsPerMonth,
    ...(e.doctorSessionsTotal > 0 ? { doctorSessionsTotal: e.doctorSessionsTotal } : {}),
    ...(oneTime
      ? { billingType: 'one_time', durationMonths: 0, durationWeeks: 0 }
      : { durationMonths: months, durationWeeks: months * 4 }),
    addOns: [] as unknown[],
  };
}

export function getDefaultPackageForPlan(
  planId: string,
  durationMonths = 1,
  planRow: PlanCatalogEntry | null = null,
) {
  const plan = planRow || getPlanFromCatalog(planId);
  if (plan && planHasEntitlementFlags(plan)) {
    const billing =
      plan.billingType ||
      (planId === 'doktor' || plan.period === 'Tek Seferlik' ? 'one_time' : 'recurring');
    return entitlementsToPackageConfig(plan.entitlements || {}, billing, durationMonths);
  }
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

/** Pakette doktor görüşmesi var mı (tek seferlik veya aylık). Remaining kota için kullanılmaz. */
export function packageIncludesDoctor(packageConfig: Record<string, unknown> = {}) {
  return (
    (Number(packageConfig.doctorSessionsTotal) || 0) > 0 ||
    (Number(packageConfig.doctorMeetingsPerMonth) || 0) > 0
  );
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

export function hasPhotoCalorieAccess(membership?: string | null) {
  const plan = getPlanFromCatalog(membership);
  if (plan && typeof plan.entitlements?.photoCalorie === 'boolean') {
    return plan.entitlements.photoCalorie;
  }
  return PHOTO_CALORIE_PLANS.has(membership || '');
}

export function hasManualCalorieAccess(membership?: string | null) {
  const plan = getPlanFromCatalog(membership);
  if (plan && typeof plan.entitlements?.manualCalorie === 'boolean') {
    return plan.entitlements.manualCalorie;
  }
  const id = membership || '';
  if (!id || MANUAL_CALORIE_EXCLUDE.has(id)) return false;
  return id !== 'free';
}

export function hasFullVideoAccess(membership?: string | null) {
  const plan = getPlanFromCatalog(membership);
  if (plan && typeof plan.entitlements?.fullVideo === 'boolean') {
    return plan.entitlements.fullVideo;
  }
  return FULL_VIDEO_PLANS.has(membership || '');
}

export function memberNeedsStaffAssignment(member?: {
  packageConfig?: Record<string, unknown>;
  assignedCoachId?: string | null;
  assignedDietitianId?: string | null;
  assignedDoctorId?: string | null;
} | null) {
  const pkg = member?.packageConfig || {};
  const needsCoach = packageIncludesCoach(pkg) && !member?.assignedCoachId;
  const needsDiet = packageIncludesDietitian(pkg) && !member?.assignedDietitianId;
  const needsDoctor = packageIncludesDoctor(pkg) && !member?.assignedDoctorId;
  return needsCoach || needsDiet || needsDoctor;
}

const KEEP_SESSION_STATUSES = new Set([
  'completed',
  'cancelled',
  'rejected',
  'no_show',
]);

/** Rol kaybında geçmiş seanslar kalır; gelecekteki scheduled/rescheduled iptal edilir. */
export function sanitizeSessionsForRole(
  sessions: unknown[] = [],
  keepRole: boolean,
  { keepPending = false }: { keepPending?: boolean } = {},
) {
  if (keepRole) return Array.isArray(sessions) ? sessions : [];
  const now = Date.now();
  return (Array.isArray(sessions) ? sessions : []).map((s) => {
    if (!s || typeof s !== 'object') return s;
    const session = s as Record<string, unknown>;
    const status = (session.status as string) || 'scheduled';
    if (KEEP_SESSION_STATUSES.has(status)) return s;
    if (keepPending && status === 'pending') return s;
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

/** Paket kapsamı dışındaki koç/diyet atamalarını temizler. Doktor ataması yalnız admin ile kalkar. */
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
    assignedDoctorId: data.assignedDoctorId ?? null,
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
      { keepPending: true },
    ),
  };
}
