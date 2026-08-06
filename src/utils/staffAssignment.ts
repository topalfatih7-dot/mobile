/**
 * Web parity: Adsız `src/services/staffAssignment.js`
 */
import {
  isPaidMembership,
  packageIncludesCoach,
  packageIncludesDietitian,
} from '@/data/membershipPlans';

function timeToMinutes(t: string) {
  const [h, m] = String(t || '0:0').split(':').map(Number);
  return (h || 0) * 60 + (m || 0);
}

export function staffAvailableAt(
  staff: Record<string, unknown>,
  day: number,
  time?: string | null,
) {
  const workDays = (staff.workDays as number[]) || [];
  if (!workDays.includes(Number(day))) return false;
  if (!time) return true;
  const t = timeToMinutes(time);
  return (
    t >= timeToMinutes(String(staff.workStart || '09:00')) &&
    t < timeToMinutes(String(staff.workEnd || '17:00'))
  );
}

export function findAvailableStaff(
  members: Record<string, unknown>[],
  staffList: Record<string, unknown>[],
  role: 'coach' | 'dietitian',
  day: number,
  time: string | null | undefined,
  excludeMemberId: string | null = null,
) {
  const candidates = staffList.filter(
    (s) =>
      s.role === role &&
      s.active !== false &&
      staffAvailableAt(s, day, time),
  );
  if (!candidates.length) return null;
  const key = role === 'coach' ? 'assignedCoachId' : 'assignedDietitianId';
  return candidates
    .map((s) => ({
      s,
      load: members.filter(
        (m) => m[key] === s.id && m.id !== excludeMemberId,
      ).length,
    }))
    .sort((a, b) => a.load - b.load)[0].s;
}

export function assignStaffOnly(
  member: Record<string, unknown>,
  staffList: Record<string, unknown>[],
  members: Record<string, unknown>[],
  options: {
    autoAssign?: boolean;
    manualCoachId?: string | null;
    manualDietitianId?: string | null;
  } = {},
) {
  const { autoAssign = false, manualCoachId, manualDietitianId } = options;
  const schedule = member.supportSchedule as
    | { coachDay?: number; coachTime?: string; dietitianDay?: number; dietitianTime?: string }
    | undefined;
  const pkg = (member.packageConfig as Record<string, unknown>) || {};
  let coachId =
    manualCoachId !== undefined
      ? manualCoachId
      : ((member.assignedCoachId as string | null) ?? null);
  let dietitianId =
    manualDietitianId !== undefined
      ? manualDietitianId
      : ((member.assignedDietitianId as string | null) ?? null);

  const needCoach = packageIncludesCoach(pkg);
  const needDiet = packageIncludesDietitian(pkg);

  if (!needCoach) coachId = null;
  if (!needDiet) dietitianId = null;

  if (autoAssign && schedule) {
    if (needCoach && !coachId && schedule.coachDay != null) {
      const found = findAvailableStaff(
        members,
        staffList,
        'coach',
        schedule.coachDay,
        schedule.coachTime,
        String(member.id),
      );
      coachId = found ? String(found.id) : null;
    }
    if (needDiet && !dietitianId && schedule.dietitianDay != null) {
      const found = findAvailableStaff(
        members,
        staffList,
        'dietitian',
        schedule.dietitianDay,
        schedule.dietitianTime,
        String(member.id),
      );
      dietitianId = found ? String(found.id) : null;
    }
  }

  return {
    assignedCoachId: needCoach ? coachId : null,
    assignedDietitianId: needDiet ? dietitianId : null,
  };
}

export function applyStaffAssignments(
  member: Record<string, unknown>,
  staffList: Record<string, unknown>[],
  members: Record<string, unknown>[],
  options: {
    autoAssign?: boolean;
    manualCoachId?: string | null;
    manualDietitianId?: string | null;
    coachSessions?: unknown[];
    dietitianSessions?: unknown[];
  } = {},
) {
  const pkg = (member.packageConfig as Record<string, unknown>) || {};
  const needCoach = packageIncludesCoach(pkg);
  const needDiet = packageIncludesDietitian(pkg);
  const staffOnly = assignStaffOnly(member, staffList, members, options);
  return {
    ...staffOnly,
    coachSessions: needCoach
      ? (options.coachSessions ?? (member.coachSessions as unknown[]) ?? [])
      : [],
    dietitianSessions: needDiet
      ? (options.dietitianSessions ?? (member.dietitianSessions as unknown[]) ?? [])
      : [],
  };
}

export function countStaffClients(
  members: Record<string, unknown>[],
  staffId: string,
  role: 'coach' | 'dietitian',
) {
  const key = role === 'coach' ? 'assignedCoachId' : 'assignedDietitianId';
  return members.filter(
    (m) => isPaidMembership(String(m.membership || '')) && m[key] === staffId,
  ).length;
}
