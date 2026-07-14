import type { VideoSession } from '@/services/videoCallSession';
import type { MemberProfile } from '@/types/session';

export type SessionTab = 'coach' | 'dietitian' | 'doctor';

export type MemberSession = VideoSession & {
  sessionType: SessionTab;
  coachName?: string;
};

const KEYS: Record<SessionTab, string> = {
  coach: 'coachSessions',
  dietitian: 'dietitianSessions',
  doctor: 'doctorSessions',
};

export function getMemberSessions(member: MemberProfile | null | undefined, tab: SessionTab): MemberSession[] {
  if (!member) return [];
  const raw = (member[KEYS[tab]] as VideoSession[] | undefined) || [];
  return raw.map((s) => ({ ...s, sessionType: tab }));
}

export function getAllUpcomingSessions(member: MemberProfile | null | undefined): MemberSession[] {
  if (!member) return [];
  const all = (['coach', 'dietitian', 'doctor'] as SessionTab[]).flatMap((tab) =>
    getMemberSessions(member, tab),
  );
  const now = new Date();
  return all
    .filter((s) => s.status === 'scheduled' && s.date)
    .filter((s) => {
      const when = new Date(`${s.date}T${s.time || '23:59'}`);
      return !Number.isNaN(when.getTime()) && when >= now;
    })
    .sort((a, b) => {
      const aKey = `${a.date}T${a.time || '00:00'}`;
      const bKey = `${b.date}T${b.time || '00:00'}`;
      return aKey.localeCompare(bKey);
    });
}

export function sessionRoleLabel(type: SessionTab): string {
  if (type === 'dietitian') return 'Diyetisyen';
  if (type === 'doctor') return 'Doktor';
  return 'Kişisel Koç';
}

export function formatSessionWhen(session: MemberSession): string {
  if (!session.date) return '—';
  const when = new Date(`${session.date}T${session.time || '12:00'}`);
  if (Number.isNaN(when.getTime())) return `${session.date} ${session.time || ''}`.trim();
  const isToday = when.toDateString() === new Date().toDateString();
  const dateLabel = isToday
    ? 'Bugün'
    : when.toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' });
  return `${dateLabel}, ${session.time || '—'} · ${session.durationMin || session.duration || 30} dk`;
}
