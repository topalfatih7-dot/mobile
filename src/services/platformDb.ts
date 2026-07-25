/**
 * Staff/admin platform hydrate — web supabaseDb fetchAuthenticatedBundle parity.
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
import {
  compactMembersForRole,
  getStaffClients,
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

export async function hydratePlatform(opts: {
  role: string | null;
  userId: string | null;
  staff: Record<string, unknown> | null;
}): Promise<PlatformBundle> {
  if (isUiOnly() || !supabase || !opts.userId) {
    return EMPTY_PLATFORM;
  }

  const client = requireSupabase();
  const role = opts.role;
  const staffUser = opts.staff;

  const [staffBundle, postsRes, plansRes] = await Promise.all([
    // Web hydrateOnce: staff_directory + erişilebilir ham staff birleşimi
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

  if (role !== 'staff' && role !== 'admin') {
    return { ...EMPTY_PLATFORM, posts, plans, staffList, staffById };
  }

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

  let staffApplications: Record<string, unknown>[] = [];
  let corporateApplications: Record<string, unknown>[] = [];
  let contactInquiries: Record<string, unknown>[] = [];

  if (role === 'admin') {
    const [sa, ca, ci] = await Promise.all([
      client.from('staff_applications').select('*').order('created_at', { ascending: false }),
      client.from('corporate_applications').select('*').order('created_at', { ascending: false }),
      client.from('contact_inquiries').select('*').order('created_at', { ascending: false }),
    ]);
    staffApplications = (sa.data || []).map((r) =>
      rowToApplication(r as Record<string, unknown>, 'staff'),
    );
    corporateApplications = (ca.data || []).map((r) =>
      rowToApplication(r as Record<string, unknown>, 'corporate'),
    );
    contactInquiries = (ci.data || []).map((r) =>
      rowToApplication(r as Record<string, unknown>, 'contact'),
    );
  }

  const staffClients =
    role === 'staff' && staffUser
      ? getStaffClients(members, String(staffUser.role), String(staffUser.id))
      : members;

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
    staffClients,
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

/** Staff program create — web createProgram parity (minimal) */
export async function createProgram(input: {
  memberId: string;
  staffId?: string;
  type: string;
  title: string;
  description?: string;
  entries?: unknown[];
}): Promise<Record<string, unknown> | null> {
  if (isUiOnly() || !supabase) return null;
  const client = requireSupabase();
  const id = `prog_${Date.now()}`;
  const row = {
    id,
    member_id: input.memberId,
    staff_id: input.staffId || null,
    data: {
      type: input.type,
      title: input.title,
      description: input.description || '',
      entries: input.entries || [],
    },
    created_at: new Date().toISOString(),
  };
  const { data, error } = await client.from('programs').insert(row).select('*').maybeSingle();
  if (error || !data) return null;
  return rowToProgram(data as Record<string, unknown>);
}
