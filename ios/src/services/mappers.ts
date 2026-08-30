/**
 * Row mappers — docs/mobile/contracts/row-mappers.md
 */
import { normalizeEntitlements, type PlanCatalogEntry } from '@/data/membershipPlans';
import { syncMemberPackages } from '@/utils/memberPackages';

const MEMBER_COLUMN_KEYS = [
  'id',
  'email',
  'name',
  'phone',
  'membership',
  'membershipStatus',
  'assignedCoachId',
  'assignedDietitianId',
  'assignedDoctorId',
  'role',
  'password',
];

export type MemberRecord = Record<string, unknown> & {
  id: string;
  email?: string;
  name?: string;
  phone?: string;
  membership?: string;
  membershipStatus?: string;
  photo?: string | null;
  city?: string;
  district?: string;
  weight?: string | number;
  height?: string | number;
  waist?: string | number;
  birthDate?: string;
  gender?: string;
  goals?: string[];
  fitnessLevel?: string;
  nutritionPrefs?: string[];
  phoneCountry?: string;
  emailVerifiedAt?: string | null;
  phoneVerifiedAt?: string | null;
  pendingPhoneVerify?: unknown;
  settings?: Record<string, unknown>;
  assignedCoachId?: string | null;
  assignedDietitianId?: string | null;
  assignedDoctorId?: string | null;
  freeTrialExpiresAt?: string | null;
  premiumExpiresAt?: string | null;
  healthTest?: Record<string, unknown>;
};

export function memberData(member: Record<string, unknown>) {
  const data: Record<string, unknown> = {};
  Object.keys(member).forEach((k) => {
    if (!MEMBER_COLUMN_KEYS.includes(k)) data[k] = member[k];
  });
  return data;
}

export function memberToRow(member: Record<string, unknown>) {
  return {
    id: member.id,
    email: member.email,
    name: member.name || '',
    phone: member.phone || '',
    role: member.role === 'admin' ? 'admin' : 'member',
    membership: member.membership || 'free',
    membership_status: member.membershipStatus || 'active',
    assigned_coach_id: member.assignedCoachId || null,
    assigned_dietitian_id: member.assignedDietitianId || null,
    assigned_doctor_id: member.assignedDoctorId || null,
    data: memberData(member),
    updated_at: new Date().toISOString(),
  };
}

export function rowToMember(row: Record<string, unknown>): MemberRecord {
  const data = (row.data && typeof row.data === 'object' ? row.data : {}) as Record<
    string,
    unknown
  >;
  const {
    assignedCoachId: _c,
    assignedDietitianId: _d,
    assignedDoctorId: _doc,
    ...dataRest
  } = data;
  const raw = {
    ...dataRest,
    id: row.id as string,
    email: row.email as string,
    name: row.name as string,
    phone: (row.phone as string) || (dataRest.phone as string) || '',
    membership: row.membership as string,
    membershipStatus: (row.membership_status as string) || (row.membershipStatus as string),
    assignedCoachId: (row.assigned_coach_id as string) ?? null,
    assignedDietitianId: (row.assigned_dietitian_id as string) ?? null,
    assignedDoctorId: (row.assigned_doctor_id as string) ?? null,
    role: (row.role as string) || (dataRest.role as string) || 'member',
  };
  return syncMemberPackages(raw) as MemberRecord;
}

export function rowToProgram(row: Record<string, unknown>) {
  const data =
    row.data && typeof row.data === 'object'
      ? (row.data as Record<string, unknown>)
      : {};
  return {
    ...data,
    id: row.id,
    memberId: row.member_id || data.memberId,
    staffId: row.staff_id || data.staffId,
  };
}

export function rowToPost(row: Record<string, unknown>) {
  const data = (row.data && typeof row.data === 'object' ? row.data : {}) as Record<
    string,
    unknown
  >;
  return {
    ...data,
    id: row.id,
    published: row.published,
    createdAt: data.createdAt || row.created_at || null,
  };
}

export function rowToStaff(row: Record<string, unknown>) {
  const data = (row.data && typeof row.data === 'object' ? row.data : {}) as Record<
    string,
    unknown
  >;
  return {
    ...data,
    id: row.id,
    email: row.email,
    name: row.name,
    role: row.role || data.role || 'coach',
    active: row.active,
  };
}

export function rowToTicket(row: Record<string, unknown>) {
  return {
    ...((row.data as object) || {}),
    id: row.id,
    memberId: row.member_id,
    status: row.status,
  };
}

export function rowToPayment(row: Record<string, unknown>) {
  return {
    ...((row.data as object) || {}),
    id: row.id,
    memberId: row.member_id,
    amount: row.amount,
    createdAt: row.created_at,
  };
}

export function rowToActivity(row: Record<string, unknown>) {
  return {
    ...((row.data as object) || {}),
    id: row.id,
    memberId: row.member_id,
    createdAt: row.created_at,
  };
}

export function rowToPlan(row: Record<string, unknown>): PlanCatalogEntry {
  const knownSellable = ['eko_diyet', 'diyet', 'eko_spor', 'spor', 'doktor', 'vip'];
  const id = String(row.id || '');
  const isSellable =
    row.is_sellable == null
      ? knownSellable.includes(id) || (id !== 'free' && Number(row.price) > 0)
      : row.is_sellable === true;
  const entRaw =
    row.entitlements && typeof row.entitlements === 'object' && !Array.isArray(row.entitlements)
      ? (row.entitlements as Record<string, unknown>)
      : {};
  const hasEnt = Object.keys(entRaw).length > 0;
  const tiers = Array.isArray(row.pricing_tiers)
    ? (row.pricing_tiers as PlanCatalogEntry['pricingTiers'])
    : [];
  return {
    id,
    name: row.name != null ? String(row.name) : undefined,
    price: Number(row.price) || 0,
    period: row.period != null ? String(row.period) : undefined,
    isActive: row.is_active !== false,
    badge: (row.badge as string | null) || null,
    features: Array.isArray(row.features) ? row.features : [],
    limits: Array.isArray(row.limits) ? row.limits : [],
    pricingTiers: tiers,
    color: row.color != null ? String(row.color) : 'sage',
    icon: (row.icon as string | null) || null,
    emoji: (row.emoji as string | null) || null,
    isSellable,
    billingType:
      row.billing_type === 'one_time' || id === 'doktor' ? 'one_time' : 'recurring',
    entitlements: hasEnt ? normalizeEntitlements(entRaw) : normalizeEntitlements({}),
    sortOrder: Number(row.sort_order) || 0,
  };
}

export function rowToApplication(row: Record<string, unknown>, kind: string) {
  return {
    ...((row.data as object) || {}),
    id: row.id,
    kind,
    status: row.status,
    createdAt: row.created_at,
    name: row.name || (row.data as Record<string, unknown>)?.name,
    email: row.email || (row.data as Record<string, unknown>)?.email,
  };
}

export function normalizeExerciseVideoRef(value: unknown): string {
  if (!value) return '';
  const trimmed = String(value).trim();
  if (!/^https?:\/\//.test(trimmed)) return trimmed.split('?')[0];
  const markers = [
    '/object/public/exercise-videos/',
    '/object/sign/exercise-videos/',
    '/object/authenticated/exercise-videos/',
  ];
  for (const marker of markers) {
    const idx = trimmed.indexOf(marker);
    if (idx !== -1) return trimmed.slice(idx + marker.length).split('?')[0];
  }
  if (trimmed.includes('/exercise-videos/')) {
    return trimmed.split('/exercise-videos/').pop()!.split('?')[0];
  }
  return trimmed;
}

export function rowToExercise(row: Record<string, unknown>) {
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    category: row.body_part || row.category || 'Tüm Vücut',
    sportType: row.sport_type || 'Fitness',
    bodyPart: row.body_part || row.category || 'Tüm Vücut',
    videoUrl: normalizeExerciseVideoRef(row.video_url),
    videoPending: row.video_pending === true,
    sourcePack: row.source_pack || '',
    sourceId: row.source_id || '',
    equipment: row.equipment || '',
    targetMuscle: row.target_muscle || '',
    secondaryMuscles: row.secondary_muscles || [],
    difficulty: row.difficulty || 'beginner',
    movementCategory: row.movement_category || '',
    instructions: Array.isArray(row.instructions) ? row.instructions : [],
    locations: Array.isArray(row.locations) ? row.locations : [],
    requiresMachine: row.requires_machine === true,
    metadata: row.metadata || {},
    createdAt: row.created_at,
  };
}
