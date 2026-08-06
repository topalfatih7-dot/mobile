import {
  getDefaultPackageForPlan,
  packageIncludesCoach,
  packageIncludesDietitian,
  packageIncludesDoctor,
} from '@/data/membershipPlans';

/** Member chat contacts from assigned staff — LOCK: messages.md */

/** Web parity: chatAccess.js CHAT_CONSENT_KEY — once-ever local shortcut */
export const CHAT_CONSENT_KEY = 'yeniform-chat-consent-v1';

/** Web parity: chatAccess.js CHAT_CONSENT_TEXT */
export const CHAT_CONSENT_TEXT = `Bu mesajlaşma alanı, atanmış koçunuz, diyetisyeniniz ve/veya doktorunuzla paketiniz kapsamında iletişim kurmanız içindir.

Gönderdiğiniz ve aldığınız tüm mesajlar güvenli şekilde kaydedilir; hizmet kalitesi, uyumluluk ve olası süreç takipleri için saklanabilir.

Tıbbi acil durumlarda bu kanalı kullanmayın; 112 veya en yakın sağlık kuruluşuna başvurun.`;

export type ChatContact = {
  staffId: string;
  staffRole: 'coach' | 'dietitian' | 'doctor';
  name: string;
  title: string;
};

/**
 * Web `getMemberChatContacts(member, staffList)` parity.
 * staffById/map boş olsa bile atanmış id varsa contact üretilir (fallback ad).
 */
export function getMemberChatContacts(
  member: Record<string, unknown> | null | undefined,
  staffById: Record<string, Record<string, unknown>> = {},
): ChatContact[] {
  if (!member) return [];

  const membership = String(member.membership || 'free');
  const packageConfig =
    (member.packageConfig as Record<string, unknown> | undefined) ||
    getDefaultPackageForPlan(membership);

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
    out.push({
      staffId: id,
      staffRole: role,
      name: String(staff?.name || fallbackTitle),
      title: String(staff?.title || fallbackTitle),
    });
  }
  return out;
}
