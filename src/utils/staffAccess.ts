import {
  isPaidMembership,
  packageIncludesCoach,
  packageIncludesDietitian,
} from '@/data/membershipPlans';
import { getMemberPackageConfig } from '@/services/memberProfile';
import type { MemberProfile } from '@/types/session';

export function normalizeStaffRole(role?: string | null): 'coach' | 'dietitian' | 'doctor' {
  if (role === 'dietitian' || role === 'doctor') return role;
  return 'coach';
}

export function staffRoleLabel(role?: string | null) {
  const normalized = normalizeStaffRole(role);
  if (normalized === 'dietitian') return 'Diyetisyen';
  if (normalized === 'doctor') return 'Doktor';
  return 'Koç';
}

export function getStaffClients(
  members: MemberProfile[],
  role: string | undefined,
  staffId: string | undefined,
): MemberProfile[] {
  const sid = String(staffId || '');
  if (!sid) return [];

  const normalizedRole = normalizeStaffRole(role);
  const assignmentKey = normalizedRole === 'coach' ? 'assignedCoachId' : 'assignedDietitianId';

  return members.filter((member) => {
    if (!isPaidMembership(member.membership as string)) return false;
    const status = (member.membershipStatus as string) || 'active';
    if (status !== 'active' && status !== 'expiring') return false;
    if (String(member[assignmentKey] || '') !== sid) return false;

    const pkg = getMemberPackageConfig(member);
    if (normalizedRole === 'coach') {
      return packageIncludesCoach(pkg) || Boolean(member.assignedCoachId);
    }
    return packageIncludesDietitian(pkg) || Boolean(member.assignedDietitianId);
  });
}

type SessionRow = {
  id?: string;
  date?: string;
  status?: string;
  time?: string;
  type?: string;
  duration?: number;
  durationMin?: number;
};

export type StaffAppointment = SessionRow & {
  id: string;
  sessionType: 'coach' | 'dietitian';
  memberId: string;
  memberName: string;
};

export function getStaffAppointments(clients: MemberProfile[], role?: string): StaffAppointment[] {
  const normalizedRole = normalizeStaffRole(role);
  const key = normalizedRole === 'coach' ? 'coachSessions' : 'dietitianSessions';
  const now = new Date();
  const list: StaffAppointment[] = [];

  clients.forEach((member) => {
    const sessions = (member[key] as SessionRow[] | undefined) || [];
    sessions.forEach((session) => {
      if (session.status !== 'scheduled' || !session.date || !session.id) return;
      if (new Date(session.date) < now) return;
      list.push({
        ...session,
        id: session.id,
        sessionType: normalizedRole === 'dietitian' ? 'dietitian' : 'coach',
        memberId: member.id,
        memberName: member.name,
      });
    });
  });

  return list.sort((a, b) => new Date(a.date!).getTime() - new Date(b.date!).getTime());
}

export function countWeekAppointments(appointments: StaffAppointment[]) {
  const now = new Date();
  const weekEnd = new Date(now);
  weekEnd.setDate(weekEnd.getDate() + 7);
  return appointments.filter((item) => {
    if (!item.date) return false;
    const date = new Date(item.date);
    return date >= now && date <= weekEnd;
  }).length;
}
