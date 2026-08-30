import { sessionsKey, type MemberSession, type SessionType } from '@/utils/sessionBooking';

export type StaffAppointment = MemberSession & {
  memberId: string;
  memberName: string;
};

function roleToSessionType(role: string): SessionType {
  if (role === 'dietitian') return 'dietitian';
  if (role === 'doctor') return 'doctor';
  return 'coach';
}

const UPCOMING = new Set([
  'scheduled',
  'rescheduled',
  'cancel_pending',
  'admin_cancel_pending',
]);

export function getStaffAppointments(
  clients: Array<Record<string, unknown>>,
  role: string,
): StaffAppointment[] {
  const type = roleToSessionType(role);
  const key = sessionsKey(type);
  const now = Date.now();
  const list: StaffAppointment[] = [];
  clients.forEach((m) => {
    const sessions = (m[key] as MemberSession[]) || [];
    sessions.forEach((s) => {
      const st = s.status || 'scheduled';
      if (UPCOMING.has(st) && s.date && new Date(s.date).getTime() >= now) {
        list.push({
          ...s,
          memberId: String(m.id),
          memberName: String(m.name || 'Danışan'),
        });
      }
    });
  });
  return list.sort(
    (a, b) => new Date(String(a.date)).getTime() - new Date(String(b.date)).getTime(),
  );
}

export function getStaffPendingAppointments(
  clients: Array<Record<string, unknown>>,
  role: string,
): StaffAppointment[] {
  const type = roleToSessionType(role);
  const key = sessionsKey(type);
  const now = Date.now();
  const list: StaffAppointment[] = [];
  clients.forEach((m) => {
    const sessions = (m[key] as MemberSession[]) || [];
    sessions.forEach((s) => {
      if (s.status === 'pending' && s.date && new Date(s.date).getTime() >= now) {
        list.push({
          ...s,
          memberId: String(m.id),
          memberName: String(m.name || 'Danışan'),
        });
      }
    });
  });
  return list.sort(
    (a, b) => new Date(String(a.date)).getTime() - new Date(String(b.date)).getTime(),
  );
}

export function getStaffCancelPendingAppointments(
  clients: Array<Record<string, unknown>>,
  role: string,
): StaffAppointment[] {
  const type = roleToSessionType(role);
  const key = sessionsKey(type);
  const now = Date.now();
  const list: StaffAppointment[] = [];
  clients.forEach((m) => {
    const sessions = (m[key] as MemberSession[]) || [];
    sessions.forEach((s) => {
      if (s.status === 'cancel_pending' && s.date && new Date(s.date).getTime() >= now) {
        list.push({
          ...s,
          memberId: String(m.id),
          memberName: String(m.name || 'Danışan'),
        });
      }
    });
  });
  return list.sort(
    (a, b) => new Date(String(a.date)).getTime() - new Date(String(b.date)).getTime(),
  );
}

export { roleToSessionType };
