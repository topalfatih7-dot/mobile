/**
 * Admin mutations / reads — web supabaseDb admin surface (minimal port).
 */
import { isUiOnly } from '@/config/runtime';
import {
  DEFAULT_PACKAGE,
  getDefaultPackageForPlan,
  isPaidMembership,
  sanitizeStaffForPackage,
} from '@/data/membershipPlans';
import { rowToMember, rowToStaff, type MemberRecord } from '@/services/mappers';
import { updateMemberRemote } from '@/services/memberDb';
import {
  extendPremiumExpiry,
  getDurationMonths,
  syncMembershipExpiryStatus,
} from '@/services/premiumMembership';
import { requireSupabase, supabase } from '@/services/supabase';
import { hydratePlatform } from '@/services/platformDb';
import { applyStaffAssignments } from '@/utils/staffAssignment';
import {
  isOneTimePlan,
  isPackageEntryActive,
  migrateLegacyToPackages,
  resolvePackagePurchase,
  syncMemberPackages,
} from '@/utils/memberPackages';

export { hydratePlatform };

/** Paginated member list for admin screen. Returns `items` and `hasMore`. */
export async function getMembers(
  page = 0,
  pageSize = 20,
): Promise<{ items: MemberRecord[]; hasMore: boolean }> {
  if (isUiOnly() || !supabase) return { items: [], hasMore: false };
  const client = requireSupabase();
  const from = page * pageSize;
  const to = from + pageSize - 1;
  const { data, error } = await client
    .from('members')
    .select('*')
    .range(from, to + 1)
    .order('created_at', { ascending: false });
  if (error || !data) return { items: [], hasMore: false };
  const hasMore = data.length > pageSize;
  const items = data
    .slice(0, pageSize)
    .map((r) => rowToMember(r as Record<string, unknown>));
  return { items, hasMore };
}

const today = () => new Date().toISOString().split('T')[0];
const nowISO = () => new Date().toISOString();
const AI_EKO_SOURCE = 'ai_eko';

async function deleteMemberProgramsBySource(memberId: string, source: string) {
  if (!supabase) return 0;
  const client = requireSupabase();
  const { data: rows, error } = await client
    .from('programs')
    .select('id, data')
    .eq('member_id', memberId);
  if (error) throw error;
  const ids = (rows || [])
    .filter((r) => (r.data as { source?: string } | null)?.source === source)
    .map((r) => r.id);
  if (!ids.length) return 0;
  const { error: delErr } = await client.from('programs').delete().in('id', ids);
  if (delErr) throw delErr;
  return ids.length;
}

/** Web parity: adminUpdatePremiumMembership (Eko AI sync AppContext tarafında — mobil GAP) */
export async function adminUpdatePremiumMembership(
  memberId: string,
  options: {
    membership?: string;
    durationMonths?: number;
    addPackage?: boolean;
    extendDays?: number;
    setRemainingDays?: number;
    premiumExpiresAt?: string;
    supportSchedule?: unknown;
    assignedCoachId?: string | null;
    assignedDietitianId?: string | null;
    assignedDoctorId?: string | null;
    coachSessions?: unknown[];
    dietitianSessions?: unknown[];
    doctorSessions?: unknown[];
    autoAssign?: boolean;
  } = {},
): Promise<{ success: boolean; member?: MemberRecord; error?: string }> {
  if (isUiOnly() || !supabase) {
    return { success: false, error: 'Demo modda kayıt yok.' };
  }
  const client = requireSupabase();
  const { data: memberRows } = await client.from('members').select('*').eq('id', memberId).limit(1);
  const member = memberRows?.[0]
    ? rowToMember(memberRows[0] as Record<string, unknown>)
    : null;
  if (!member) return { success: false, error: 'Üye bulunamadı.' };

  const { data: staffRows } = await client.from('staff').select('*');
  const staffList = (staffRows || []).map((r) => rowToStaff(r as Record<string, unknown>));
  const { data: allMemberRows } = await client.from('members').select('*');
  const members = (allMemberRows || []).map((r) =>
    rowToMember(r as Record<string, unknown>),
  );

  const prevCoachId = member.assignedCoachId;
  const prevDietitianId = member.assignedDietitianId;
  const prevDoctorId = member.assignedDoctorId;
  const prevMembership = member.membership;
  const schedule = options.supportSchedule ?? member.supportSchedule;

  let activePackages = migrateLegacyToPackages(member);
  const targetingFree = Boolean(
    options.membership && !isPaidMembership(options.membership),
  );

  if (options.membership) {
    const planId = options.membership;
    const months =
      Number(options.durationMonths) || getDurationMonths(member.packageConfig as object) || 1;
    const cfg = getDefaultPackageForPlan(planId, months);

    if (targetingFree) {
      activePackages = activePackages.filter(
        (p: { planId: string }) =>
          isOneTimePlan(p.planId) && isPackageEntryActive(p),
      );
    } else {
      activePackages = resolvePackagePurchase(activePackages, planId, cfg, {}, {
        addPackage: options.addPackage,
      });
    }
  }

  if (!targetingFree) {
    if (options.extendDays != null && Number(options.extendDays) !== 0) {
      activePackages = activePackages.map((p: { planId: string; expiresAt?: string }) => {
        if (isOneTimePlan(p.planId)) return p;
        return { ...p, expiresAt: extendPremiumExpiry(p.expiresAt, options.extendDays) };
      });
    } else if (options.setRemainingDays != null && Number(options.setRemainingDays) >= 0) {
      const d = new Date();
      d.setHours(0, 0, 0, 0);
      d.setDate(d.getDate() + Number(options.setRemainingDays));
      const newExpiry = d.toISOString().split('T')[0];
      let touched = false;
      activePackages = activePackages.map((p: { planId: string }) => {
        if (isOneTimePlan(p.planId)) return p;
        if (!touched) {
          touched = true;
          return { ...p, expiresAt: newExpiry };
        }
        return p;
      });
    }

    if (options.premiumExpiresAt) {
      activePackages = activePackages.map(
        (p: { planId: string }, i: number) =>
          isOneTimePlan(p.planId) ? p : i === 0 ? { ...p, expiresAt: options.premiumExpiresAt } : p,
      );
    }
  }

  let draft: Record<string, unknown> = {
    ...member,
    activePackages,
    supportSchedule: schedule,
    assignedCoachId:
      options.assignedCoachId !== undefined ? options.assignedCoachId : member.assignedCoachId,
    assignedDietitianId:
      options.assignedDietitianId !== undefined
        ? options.assignedDietitianId
        : member.assignedDietitianId,
    assignedDoctorId:
      options.assignedDoctorId !== undefined ? options.assignedDoctorId : member.assignedDoctorId,
    coachSessions:
      options.coachSessions !== undefined ? options.coachSessions : member.coachSessions || [],
    dietitianSessions:
      options.dietitianSessions !== undefined
        ? options.dietitianSessions
        : member.dietitianSessions || [],
    doctorSessions:
      options.doctorSessions !== undefined ? options.doctorSessions : member.doctorSessions || [],
  };

  if (targetingFree) {
    if (!activePackages.length) {
      draft = {
        ...draft,
        membership: 'free',
        membershipStatus: 'active',
        packageConfig: DEFAULT_PACKAGE,
        premiumExpiresAt: null,
        premiumStartedAt: null,
        freeTrialExpiresAt: null,
      };
    } else {
      draft = {
        ...draft,
        membershipStatus: 'active',
        premiumExpiresAt: null,
        freeTrialExpiresAt: null,
      };
    }
  }

  draft = syncMemberPackages(draft);

  if (isPaidMembership(String(draft.membership || ''))) {
    draft.freeTrialExpiresAt = null;
  }

  if (options.membership && options.membership !== prevMembership) {
    draft = sanitizeStaffForPackage(
      draft.packageConfig as Record<string, unknown>,
      draft,
    ) as Record<string, unknown>;
  }

  const assignments = applyStaffAssignments(draft, staffList, members, {
    autoAssign: Boolean(options.autoAssign),
    manualCoachId: draft.assignedCoachId as string | null,
    manualDietitianId: draft.assignedDietitianId as string | null,
    coachSessions: draft.coachSessions as unknown[],
    dietitianSessions: draft.dietitianSessions as unknown[],
  });

  let updated: Record<string, unknown> = {
    ...draft,
    assignedCoachId: assignments.assignedCoachId,
    assignedDietitianId: assignments.assignedDietitianId,
    coachSessions: assignments.coachSessions,
    dietitianSessions: assignments.dietitianSessions,
    lastActiveAt: today(),
  };
  updated = syncMembershipExpiryStatus(updated);

  const notifications = [...((updated.notifications as Record<string, unknown>[]) || [])];
  if (updated.assignedCoachId && updated.assignedCoachId !== prevCoachId) {
    const coach = staffList.find((s) => s.id === updated.assignedCoachId);
    notifications.unshift({
      id: `n-${Date.now()}-coach`,
      type: 'assignment',
      title: 'Koçunuz atandı',
      message: `${coach?.name || 'Koçunuz'} artık sizinle çalışacak. Profilinizden detayları görebilirsiniz.`,
      read: false,
      createdAt: nowISO(),
    });
  }
  if (updated.assignedDietitianId && updated.assignedDietitianId !== prevDietitianId) {
    const dietitian = staffList.find((s) => s.id === updated.assignedDietitianId);
    notifications.unshift({
      id: `n-${Date.now()}-diet`,
      type: 'assignment',
      title: 'Diyetisyeniniz atandı',
      message: `${dietitian?.name || 'Diyetisyeniniz'} artık sizinle çalışacak.`,
      read: false,
      createdAt: nowISO(),
    });
  }
  if (updated.assignedDoctorId && updated.assignedDoctorId !== prevDoctorId) {
    const doctor = staffList.find((s) => s.id === updated.assignedDoctorId);
    notifications.unshift({
      id: `n-${Date.now()}-doc`,
      type: 'assignment',
      title: 'Doktorunuz atandı',
      message: `${doctor?.name || 'Doktorunuz'} ile görüşme planlayabilirsiniz.`,
      read: false,
      createdAt: nowISO(),
    });
  }
  updated.notifications = notifications;

  try {
    await updateMemberRemote(updated);
  } catch (e) {
    return {
      success: false,
      error: e instanceof Error ? e.message : 'Kaydedilemedi',
    };
  }

  if (prevMembership === 'eko' && updated.membership !== 'eko') {
    try {
      await deleteMemberProgramsBySource(String(updated.id), AI_EKO_SOURCE);
    } catch {
      /* ignore cleanup errors */
    }
  }

  return { success: true, member: updated as MemberRecord };
}

export async function fetchAdminSessionSummaries(): Promise<
  {
    memberId: string;
    memberName: string;
    sessionType: string;
    startsAt?: string;
  }[]
> {
  if (isUiOnly() || !supabase) return [];
  const client = requireSupabase();
  const { data, error } = await client
    .from('members')
    .select('id, name, membership, membership_status, data');
  if (error || !data) return [];

  const out: {
    memberId: string;
    memberName: string;
    sessionType: string;
    startsAt?: string;
  }[] = [];

  for (const row of data) {
    const m = rowToMember(row as Record<string, unknown>);
    const name = String(m.name || m.email || 'Üye');
    (
      [
        ['coachSessions', 'Koç'],
        ['dietitianSessions', 'Diyetisyen'],
        ['doctorSessions', 'Doktor'],
      ] as const
    ).forEach(([key, label]) => {
      const sessions = (m[key] as { startsAt?: string; id?: string }[]) || [];
      sessions.forEach((s) => {
        out.push({
          memberId: String(m.id),
          memberName: name,
          sessionType: label,
          startsAt: s.startsAt,
        });
      });
    });
  }
  return out;
}

export async function adminSetMembershipStatus(
  memberId: string,
  status: string,
): Promise<{ success: boolean; member?: MemberRecord; error?: string }> {
  if (isUiOnly() || !supabase) {
    return { success: false, error: 'Demo modda kayıt yok.' };
  }
  const client = requireSupabase();
  const { data, error } = await client
    .from('members')
    .update({ membership_status: status, updated_at: new Date().toISOString() })
    .eq('id', memberId)
    .select('*')
    .maybeSingle();
  if (error || !data) return { success: false, error: error?.message || 'Güncellenemedi' };
  return { success: true, member: rowToMember(data as Record<string, unknown>) };
}

/** Web parity: upsertPlan */
export async function upsertPlan(plan: {
  id: string;
  name: string;
  price: number;
  period?: string;
  isActive?: boolean;
  badge?: string | null;
  features?: unknown[];
  limits?: unknown[];
  pricingTiers?: unknown[];
  color?: string;
  sortOrder?: number;
}): Promise<{ success: boolean; error?: string }> {
  if (isUiOnly() || !supabase) {
    return { success: false, error: 'Demo modda kayıt yok.' };
  }
  const client = requireSupabase();
  const { error } = await client.from('plans').upsert(
    {
      id: plan.id,
      name: plan.name,
      price: plan.price,
      period: plan.period || 'ay',
      is_active: plan.isActive !== false,
      badge: plan.badge || null,
      features: plan.features || [],
      limits: plan.limits || [],
      pricing_tiers: plan.pricingTiers || [],
      color: plan.color || 'sage',
      sort_order: plan.sortOrder || 0,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'id' },
  );
  if (error) return { success: false, error: error.message };
  return { success: true };
}

/** Web parity: resolveStaffApplication (reject always; approve updates status — staff account creation via web for complex path) */
export async function resolveStaffApplication(
  application: { id: string; name?: string; data?: Record<string, unknown> },
  approve: boolean,
  adminNote = '',
): Promise<{ success: boolean; error?: string }> {
  if (isUiOnly() || !supabase) {
    return { success: false, error: 'Demo modda kayıt yok.' };
  }
  const client = requireSupabase();
  const { error } = await client
    .from('staff_applications')
    .update({
      status: approve ? 'approved' : 'rejected',
      admin_note: adminNote || '',
      reviewed_at: new Date().toISOString(),
    })
    .eq('id', application.id);
  if (error) return { success: false, error: error.message };
  return { success: true };
}
