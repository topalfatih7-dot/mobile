/**
 * Staff platform hydrate — web supabaseDb fetchAuthenticatedBundle parity.
 * MOBILE DIFF: admin paneli yok; bu bundle yalnız personel için.
 * LOCK: docs/mobile/contracts/supabase-tables.md + row-mappers.md
 */
import { isUiOnly } from '@/config/runtime';
import {
  rowToActivity,
  rowToApplication,
  rowToMember,
  rowToPayment,
  rowToPlan,
  rowToPost,
  rowToProgram,
  rowToTicket,
  type MemberRecord,
} from '@/services/mappers';
import { fetchStaffDirectory } from '@/services/staffDirectory';
import { requireSupabase, supabase } from '@/services/supabase';
import { perfInc } from '@/utils/perfCounters';
import {
  compactMembersForRole,
  getStaffClients,
  normalizeStaffRole,
} from '@/utils/staffClients';

export type PlatformBundle = {
  members: MemberRecord[];
  staffClients: MemberRecord[];
  programs: Record<string, unknown>[];
  tickets: Record<string, unknown>[];
  activities: Record<string, unknown>[];
  payments: Record<string, unknown>[];
  posts: Record<string, unknown>[];
  plans: Record<string, unknown>[];
  staffList: Record<string, unknown>[];
  staffById: Record<string, Record<string, unknown>>;
  staffApplications: Record<string, unknown>[];
  corporateApplications: Record<string, unknown>[];
  contactInquiries: Record<string, unknown>[];
  adminStats: {
    members: number;
    paid: number;
    staff: number;
    openTickets: number;
    pendingApps: number;
  };
};

export const EMPTY_PLATFORM: PlatformBundle = {
  members: [],
  staffClients: [],
  programs: [],
  tickets: [],
  activities: [],
  payments: [],
  posts: [],
  plans: [],
  staffList: [],
  staffById: {},
  staffApplications: [],
  corporateApplications: [],
  contactInquiries: [],
  adminStats: { members: 0, paid: 0, staff: 0, openTickets: 0, pendingApps: 0 },
};

function staffAssignmentColumn(staffRole: string | null | undefined): string {
  const r = normalizeStaffRole(staffRole);
  if (r === 'doctor') return 'assigned_doctor_id';
  if (r === 'dietitian') return 'assigned_dietitian_id';
  return 'assigned_coach_id';
}

export async function hydratePlatform(opts: {
  role: string | null;
  userId: string | null;
  staff: Record<string, unknown> | null;
}): Promise<PlatformBundle> {
  if (isUiOnly() || !supabase || !opts.userId) {
    return EMPTY_PLATFORM;
  }

  perfInc('hydratePlatform', 'boot');
  const client = requireSupabase();
  const role = opts.role;
  const staffUser = opts.staff;

  // ── Staff: scoped hydrate (no full-table members/programs/tickets) ──
  if (role === 'staff' && staffUser?.id) {
    const staffId = String(staffUser.id);
    const assignCol = staffAssignmentColumn(String(staffUser.role || ''));

    const [staffBundle, membersRes] = await Promise.all([
      fetchStaffDirectory(),
      client.from('members').select('*').eq(assignCol, staffId),
    ]);

    let members = (membersRes.data || []).map((r) =>
      rowToMember(r as Record<string, unknown>),
    );
    const staffClients = getStaffClients(
      members,
      String(staffUser.role),
      staffId,
    );
    // Only keep assigned paid clients in memory for staff
    members = staffClients;
    const clientIds = staffClients.map((m) => String(m.id));

    let programsQuery = client
      .from('programs')
      .select('*')
      .order('created_at', { ascending: false });
    if (clientIds.length > 0) {
      programsQuery = programsQuery.or(
        `staff_id.eq.${staffId},member_id.in.(${clientIds.join(',')})`,
      );
    } else {
      programsQuery = programsQuery.eq('staff_id', staffId);
    }
    const programsRes = await programsQuery;
    const programs = (programsRes.data || []).map((r) =>
      rowToProgram(r as Record<string, unknown>),
    );

    return {
      ...EMPTY_PLATFORM,
      members,
      staffClients,
      programs,
      staffList: staffBundle.staffList,
      staffById: staffBundle.staffById,
      adminStats: {
        members: members.length,
        paid: members.length,
        staff: staffBundle.staffList.filter((s) => s.active !== false).length,
        openTickets: 0,
        pendingApps: 0,
      },
    };
  }

  const [staffBundle, postsRes, plansRes] = await Promise.all([
    fetchStaffDirectory(),
    client.from('posts').select('*').order('created_at', { ascending: false }),
    client.from('plans').select('*').eq('is_active', true).order('sort_order', { ascending: true }),
  ]);

  const staffList = staffBundle.staffList;
  const posts = (postsRes.data || []).map((r) =>
    rowToPost(r as Record<string, unknown>),
  );
  const plans = (plansRes.data || []).map((r) =>
    rowToPlan(r as Record<string, unknown>),
  );
  const staffById = staffBundle.staffById;

  if (role === 'member') {
    return {
      ...EMPTY_PLATFORM,
      posts,
      plans,
      staffList,
      staffById,
    };
  }

  if (role !== 'admin') {
    return { ...EMPTY_PLATFORM, posts, plans, staffList, staffById };
  }

  // ── Admin: full platform (unchanged) ──
  const [membersRes, programsRes, ticketsRes, activitiesRes, paymentsRes] =
    await Promise.all([
      client.from('members').select('*'),
      client.from('programs').select('*').order('created_at', { ascending: false }),
      client.from('tickets').select('*').order('created_at', { ascending: false }),
      client.from('activities').select('*').order('created_at', { ascending: false }),
      client.from('payments').select('*').order('created_at', { ascending: false }),
    ]);

  let members = (membersRes.data || []).map((r) =>
    rowToMember(r as Record<string, unknown>),
  );
  members = compactMembersForRole(members, role, staffUser);

  const programs = (programsRes.data || []).map((r) =>
    rowToProgram(r as Record<string, unknown>),
  );
  const tickets = (ticketsRes.data || []).map((r) =>
    rowToTicket(r as Record<string, unknown>),
  );
  const activities = (activitiesRes.data || []).map((r) =>
    rowToActivity(r as Record<string, unknown>),
  );
  const payments = (paymentsRes.data || []).map((r) =>
    rowToPayment(r as Record<string, unknown>),
  );

  const [sa, ca, ci] = await Promise.all([
    client.from('staff_applications').select('*').order('created_at', { ascending: false }),
    client.from('corporate_applications').select('*').order('created_at', { ascending: false }),
    client.from('contact_inquiries').select('*').order('created_at', { ascending: false }),
  ]);
  const staffApplications = (sa.data || []).map((r) =>
    rowToApplication(r as Record<string, unknown>, 'staff'),
  );
  const corporateApplications = (ca.data || []).map((r) =>
    rowToApplication(r as Record<string, unknown>, 'corporate'),
  );
  const contactInquiries = (ci.data || []).map((r) =>
    rowToApplication(r as Record<string, unknown>, 'contact'),
  );

  const paid = members.filter((m) => {
    const mem = String(m.membership || 'free');
    return mem !== 'free';
  }).length;

  const openTickets = tickets.filter(
    (t) => t.status !== 'closed' && t.status !== 'resolved',
  ).length;

  const pendingApps = [...staffApplications, ...corporateApplications, ...contactInquiries].filter(
    (a) => String(a.status || 'pending') === 'pending',
  ).length;

  return {
    members,
    staffClients: members,
    programs,
    tickets,
    activities,
    payments,
    posts,
    plans,
    staffList,
    staffById,
    staffApplications,
    corporateApplications,
    contactInquiries,
    adminStats: {
      members: members.length,
      paid,
      staff: staffList.filter((s) => s.active !== false).length,
      openTickets,
      pendingApps,
    },
  };
}

function nowISO() {
  return new Date().toISOString();
}

export type ProgramWriteInput = {
  memberId?: string;
  staffId?: string | null;
  type?: string;
  memberName?: string;
  staffName?: string;
  title?: string;
  description?: string;
  items?: unknown[];
  entries?: unknown[];
  scheduleType?: string | null;
  cycleStartDate?: string | null;
  cycleLength?: number | null;
  cycleLoop?: boolean | null;
  cycleSameDaily?: boolean | null;
  sessionDuration?: number | null;
  source?: string | null;
};

/** Staff program create — web supabaseDb.createProgram parity */
export async function createProgram(
  input: ProgramWriteInput,
): Promise<Record<string, unknown> | null> {
  if (isUiOnly() || !supabase) return null;
  if (!input.memberId || !input.title) return null;
  const client = requireSupabase();
  const staffId = input.staffId && input.staffId !== 'system' ? input.staffId : null;
  const { data, error } = await client
    .from('programs')
    .insert({
      member_id: input.memberId,
      staff_id: staffId,
      data: {
        type: input.type === 'nutrition' ? 'nutrition' : 'workout',
        memberName: input.memberName || '',
        staffName: input.staffName || '',
        title: input.title,
        description: input.description || '',
        items: Array.isArray(input.items) ? input.items : [],
        entries: Array.isArray(input.entries) ? input.entries : [],
        scheduleType: input.scheduleType || null,
        cycleStartDate: input.cycleStartDate || null,
        cycleLength: input.cycleLength || null,
        cycleLoop: input.cycleLoop !== undefined ? input.cycleLoop : null,
        cycleSameDaily:
          input.cycleSameDaily !== undefined ? input.cycleSameDaily : null,
        sessionDuration: input.sessionDuration || null,
        source: input.source || null,
        createdAt: nowISO(),
      },
    })
    .select('*')
    .single();
  if (error || !data) return null;
  const program = rowToProgram(data as Record<string, unknown>);
  if (input.memberId) {
    const { notifyMemberProgram } = await import('@/services/memberNotifications');
    void notifyMemberProgram({
      memberId: input.memberId,
      staffName: input.staffName,
      title: String(input.title),
      programType: input.type,
      programId: String(program?.id || data.id),
    });
  }
  return program;
}

/** Mevcut programs.data alanlarını günceller — web updateProgram parity */
export async function updateProgram(
  id: string,
  patch: ProgramWriteInput = {},
): Promise<Record<string, unknown> | null> {
  if (!id) return null;
  if (isUiOnly() || !supabase) return null;
  const client = requireSupabase();
  const { data: existing, error: fetchErr } = await client
    .from('programs')
    .select('*')
    .eq('id', id)
    .single();
  if (fetchErr || !existing) return null;

  const prev =
    existing.data && typeof existing.data === 'object'
      ? (existing.data as Record<string, unknown>)
      : {};
  const nextType =
    patch.type != null
      ? patch.type === 'nutrition'
        ? 'nutrition'
        : 'workout'
      : prev.type === 'nutrition'
        ? 'nutrition'
        : 'workout';

  const nextData = {
    ...prev,
    type: nextType,
    memberName:
      patch.memberName !== undefined ? patch.memberName : prev.memberName || '',
    staffName:
      patch.staffName !== undefined ? patch.staffName : prev.staffName || '',
    title: patch.title !== undefined ? patch.title : prev.title,
    description:
      patch.description !== undefined
        ? patch.description
        : prev.description || '',
    items:
      patch.items !== undefined
        ? Array.isArray(patch.items)
          ? patch.items
          : []
        : Array.isArray(prev.items)
          ? prev.items
          : [],
    entries:
      patch.entries !== undefined
        ? Array.isArray(patch.entries)
          ? patch.entries
          : []
        : Array.isArray(prev.entries)
          ? prev.entries
          : [],
    scheduleType:
      patch.scheduleType !== undefined
        ? patch.scheduleType
        : prev.scheduleType || null,
    cycleStartDate:
      patch.cycleStartDate !== undefined
        ? patch.cycleStartDate
        : prev.cycleStartDate || null,
    cycleLength:
      patch.cycleLength !== undefined
        ? patch.cycleLength
        : prev.cycleLength || null,
    cycleLoop:
      patch.cycleLoop !== undefined ? patch.cycleLoop : (prev.cycleLoop ?? null),
    cycleSameDaily:
      patch.cycleSameDaily !== undefined
        ? patch.cycleSameDaily
        : (prev.cycleSameDaily ?? null),
    sessionDuration:
      patch.sessionDuration !== undefined
        ? patch.sessionDuration
        : prev.sessionDuration || null,
    source: patch.source !== undefined ? patch.source : prev.source || null,
    createdAt: prev.createdAt || nowISO(),
    updatedAt: nowISO(),
  };

  const { data: row, error } = await client
    .from('programs')
    .update({ data: nextData })
    .eq('id', id)
    .select('*')
    .single();
  if (error || !row) return null;
  return rowToProgram(row as Record<string, unknown>);
}
