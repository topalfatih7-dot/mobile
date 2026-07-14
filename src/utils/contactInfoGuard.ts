/**
 * Sohbet mesajlarında platform dışı iletişim bilgisi paylaşımını tespit eder.
 * Web `contactInfoGuard.js` ile aynı sözleşme.
 */

const EMAIL_RE = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/;
const PHONE_CANDIDATE_RE = /(?:\+?\d[\d\s().-]{7,}\d)/g;

const EXTERNAL_APP_KEYWORDS = [
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

function digitsOnly(value: string) {
  return String(value || '').replace(/\D/g, '');
}

function hasPhoneNumber(text: string) {
  const matches = text.match(PHONE_CANDIDATE_RE) || [];
  return matches.some((m) => digitsOnly(m).length >= 9);
}

function hasEmail(text: string) {
  return EMAIL_RE.test(text);
}

function hasExternalAppMention(text: string) {
  const normalized = text.toLowerCase().replace(/i̇/g, 'i');
  return EXTERNAL_APP_KEYWORDS.some((kw) => normalized.includes(kw));
}

export function detectExternalContactInfo(text: string) {
  const value = String(text || '');
  if (!value.trim()) return { blocked: false, reason: '' };

  if (hasEmail(value)) return { blocked: true, reason: 'e-posta adresi' };
  if (hasExternalAppMention(value)) {
    return { blocked: true, reason: 'sosyal medya / harici uygulama bağlantısı' };
  }
  if (hasPhoneNumber(value)) return { blocked: true, reason: 'telefon numarası' };
  return { blocked: false, reason: '' };
}

export const CONTACT_INFO_BLOCK_MESSAGE =
  'Güvenliğiniz için mesajınızda paylaşım algılandı. Tüm iletişim uygulama içinden yürütülmelidir; lütfen iletişim bilgisi paylaşmadan tekrar yazın.';
