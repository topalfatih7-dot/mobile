import type { MemberProfile, StaffProfile } from '@/types/session';

type MemberRow = {
  id: string;
  email: string;
  name: string;
  phone?: string | null;
  membership?: string | null;
  membership_status?: string | null;
  assigned_coach_id?: string | null;
  assigned_dietitian_id?: string | null;
  role?: string | null;
  data?: Record<string, unknown> | null;
};

type StaffRow = {
  id: string;
  email: string;
  name: string;
  role: string;
  active?: boolean | null;
  data?: Record<string, unknown> | null;
};

const MEMBER_COLUMN_KEYS = new Set([
  'id',
  'email',
  'name',
  'phone',
  'membership',
  'membershipStatus',
  'assignedCoachId',
  'assignedDietitianId',
  'role',
  'password',
]);

function memberData(member: Record<string, unknown>) {
  const data: Record<string, unknown> = {};
  Object.keys(member).forEach((key) => {
    if (!MEMBER_COLUMN_KEYS.has(key)) data[key] = member[key];
  });
  return data;
}

export function memberToRow(member: MemberProfile & Record<string, unknown>) {
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
    data: memberData(member),
    updated_at: new Date().toISOString(),
  };
}

export function rowToMember(row: MemberRow | null | undefined): MemberProfile | null {
  if (!row) return null;
  const data = row.data || {};
  return {
    ...data,
    id: row.id,
    email: row.email,
    name: row.name,
    phone: row.phone || (data.phone as string) || '',
    membership: row.membership || 'free',
    membershipStatus: row.membership_status || 'active',
    assignedCoachId: row.assigned_coach_id || data.assignedCoachId || null,
    assignedDietitianId: row.assigned_dietitian_id || data.assignedDietitianId || null,
    role: row.role || data.role || 'member',
  };
}

export function rowToStaff(row: StaffRow): StaffProfile {
  return {
    ...(row.data || {}),
    id: row.id,
    email: row.email,
    name: row.name,
    role: row.role,
    active: row.active ?? true,
  };
}
