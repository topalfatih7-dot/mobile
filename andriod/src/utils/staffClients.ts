/**
 * Staff client filtering — web chatAccess.js getStaffClients parity.
 */
import {
  isPaidMembership,
  packageIncludesCoach,
  packageIncludesDietitian,
  packageIncludesDoctor,
} from '@/data/membershipPlans';
import type { MemberRecord } from '@/services/mappers';

export function normalizeStaffRole(
  role: string | null | undefined,
): 'coach' | 'dietitian' | 'doctor' {
  const r = String(role || 'coach').toLowerCase();
  if (r === 'dietitian' || r === 'diyetisyen') return 'dietitian';
  if (r === 'doctor' || r === 'doktor') return 'doctor';
  return 'coach';
}

export function getStaffClients(
  members: MemberRecord[],
  role: string | null | undefined,
  staffId: string | null | undefined,
): MemberRecord[] {
  const sid = String(staffId || '');
  if (!sid) return [];
  const normalizedRole = normalizeStaffRole(role);
  const assignmentKey =
    normalizedRole === 'coach'
      ? 'assignedCoachId'
      : normalizedRole === 'doctor'
        ? 'assignedDoctorId'
        : 'assignedDietitianId';

  return (members || []).filter((m) => {
    if (!isPaidMembership(m.membership as string)) return false;
    const status = String(m.membershipStatus || 'active');
    if (status !== 'active' && status !== 'expiring') return false;
    if (String(m[assignmentKey] || '') !== sid) return false;
    const pkg = (m.packageConfig as Record<string, unknown>) || {};
    if (normalizedRole === 'coach') {
      return packageIncludesCoach(pkg) || Boolean(m.assignedCoachId);
    }
    if (normalizedRole === 'doctor') {
      return packageIncludesDoctor(pkg) || Boolean(m.assignedDoctorId);
    }
    return packageIncludesDietitian(pkg) || Boolean(m.assignedDietitianId);
  });
}

export function stripMemberSessions(member: MemberRecord): MemberRecord {
  return {
    ...member,
    coachSessions: [],
    dietitianSessions: [],
    doctorSessions: [],
  };
}

export function compactMembersForRole(
  members: MemberRecord[],
  role: string | null | undefined,
  staffUser: { id?: string; role?: string } | null,
): MemberRecord[] {
  if (role === 'member' || !Array.isArray(members)) return members;
  if (role === 'admin') return members.map(stripMemberSessions);
  if (role === 'staff' && staffUser?.id) {
    const clientIds = new Set(
      getStaffClients(members, staffUser.role, staffUser.id).map((m) => String(m.id)),
    );
    return members.map((m) => (clientIds.has(String(m.id)) ? m : stripMemberSessions(m)));
  }
  return members.map(stripMemberSessions);
}
