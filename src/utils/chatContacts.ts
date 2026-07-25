import {
  packageIncludesCoach,
  packageIncludesDietitian,
  packageIncludesDoctor,
} from '@/data/membershipPlans';

/** Member chat contacts from assigned staff — LOCK: messages.md */

export type ChatContact = {
  staffId: string;
  staffRole: 'coach' | 'dietitian' | 'doctor';
  name: string;
  title: string;
};

export function getMemberChatContacts(
  member: Record<string, unknown> | null | undefined,
  staffById: Record<string, Record<string, unknown>>,
): ChatContact[] {
  if (!member) return [];
  const packageConfig =
    (member.packageConfig as Record<string, unknown> | undefined) || {};
  const pairs: {
    key: string;
    role: ChatContact['staffRole'];
    included: boolean;
    fallbackTitle: string;
  }[] = [
    {
      key: 'assignedCoachId',
      role: 'coach',
      included: packageIncludesCoach(packageConfig),
      fallbackTitle: 'Koçunuz',
    },
    {
      key: 'assignedDietitianId',
      role: 'dietitian',
      included: packageIncludesDietitian(packageConfig),
      fallbackTitle: 'Diyetisyeniniz',
    },
    {
      key: 'assignedDoctorId',
      role: 'doctor',
      included: packageIncludesDoctor(packageConfig),
      fallbackTitle: 'Doktorunuz',
    },
  ];
  const out: ChatContact[] = [];
  for (const { key, role, included, fallbackTitle } of pairs) {
    if (!included) continue;
    const id = member[key] ? String(member[key]) : '';
    if (!id) continue;
    const staff = staffById[id];
    if (!staff) continue;
    out.push({
      staffId: id,
      staffRole: role,
      name: String(staff.name || 'Uzman'),
      title: String(staff.title || fallbackTitle),
    });
  }
  return out;
}
