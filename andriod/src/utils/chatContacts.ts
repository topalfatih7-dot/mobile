import {
  packageIncludesCoach,
  packageIncludesDietitian,
  packageIncludesDoctor,
} from '@/data/membershipPlans';

/** Member chat contacts from assigned staff — LOCK: messages.md */

/** Web parity: chatAccess.js CHAT_CONSENT_KEY — once-ever local shortcut */
export const CHAT_CONSENT_KEY = 'yeniform-chat-consent-v1';

/** Web parity: chatAccess.js CHAT_CONSENT_TEXT */
export const CHAT_CONSENT_TEXT = `Bu mesajlaşma alanı, atanmış koçunuz, diyetisyeniniz ve/veya doktorunuzla paketiniz kapsamında iletişim kurmanız içindir.

Gönderdiğiniz ve aldığınız tüm mesajlar güvenli şekilde saklanır; hizmet kalitesi, uyumluluk ve olası süreç takipleri için saklanabilir.

Tıbbi acil durumlarda bu kanalı kullanmayın; 112 veya en yakın sağlık kuruluşuna başvurun.`;

export type ChatContact = {
  staffId: string;
  staffRole: 'coach' | 'dietitian' | 'doctor';
  name: string;
  title: string;
};

function staffFromMap(
  staffById: Record<string, Record<string, unknown>>,
  id: string,
): Record<string, unknown> | undefined {
  return staffById[id];
}

/**
 * Web `getMemberChatContacts(member, staffList)` parity.
 * Contact only if: package includes the role AND assignment id AND staff still in directory.
 * Do not invent "Koçunuz" / "Diyetisyeniniz" rows when staff is missing.
 */
export function getMemberChatContacts(
  member: Record<string, unknown> | null | undefined,
  staffById: Record<string, Record<string, unknown>> = {},
): ChatContact[] {
  if (!member) return [];

  const packageConfig = (member.packageConfig as Record<string, unknown> | undefined) || {};

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
    const staff = staffFromMap(staffById, id);
    if (!staff) continue;
    out.push({
      staffId: id,
      staffRole: role,
      name: String(staff.name || fallbackTitle),
      title: String(staff.title || fallbackTitle),
    });
  }
  return out;
}

/** Web `memberHasChatAccess` — atama + paket yoksa mesajlaşma kapalı */
export function memberHasChatAccess(
  member: Record<string, unknown> | null | undefined,
): boolean {
  const pkg = (member?.packageConfig as Record<string, unknown> | undefined) || {};
  return Boolean(
    (packageIncludesCoach(pkg) && member?.assignedCoachId) ||
      (packageIncludesDietitian(pkg) && member?.assignedDietitianId) ||
      (packageIncludesDoctor(pkg) && member?.assignedDoctorId),
  );
}
