/** LOCK: messages.md / chat-model — contact info block */

export const CONTACT_INFO_BLOCK_MESSAGE =
  'Güvenliğiniz için mesajınızda paylaşım algılandı. Tüm iletişim uygulama içinden yürütülmelidir; lütfen iletişim bilgisi paylaşmadan tekrar yazın.';

const EMAIL_RE = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/;
const KEYWORDS = [
  'whatsapp',
  'wa.me',
  'telegram',
  't.me/',
  'instagram',
  'i̇nstagram',
  'snapchat',
  'discord',
  'skype',
  'messenger',
  'facebook.com',
  'fb.com/',
  'twitter.com/',
  'x.com/',
  'linkedin.com/in',
];

export function detectExternalContactInfo(text: string): boolean {
  const t = String(text || '');
  if (!t.trim()) return false;
  if (EMAIL_RE.test(t)) return true;
  const phoneMatches = t.match(/(?:\+?\d[\d\s().-]{7,}\d)/g) || [];
  if (phoneMatches.some((match) => match.replace(/\D/g, '').length >= 9)) return true;
  const lower = t.toLowerCase().replace(/i̇/g, 'i');
  return KEYWORDS.some((k) => lower.includes(k));
}
