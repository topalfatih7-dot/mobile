/** TR cep telefonu — web `countryCodes.isValidNationalNumber('TR', …)` parity. */

export function digitsOnly(raw: string): string {
  return String(raw || '').replace(/\D/g, '');
}

/** Ulusal hane: baştaki 0 atılır; 5 ile başlamalı; 10 hane. */
export function normalizeTrNational(raw: string): string {
  let d = digitsOnly(raw);
  if (d.startsWith('0')) d = d.slice(1);
  if (d.startsWith('90') && d.length >= 12) d = d.slice(2);
  return d;
}

export function isValidTrMobile(raw: string): boolean {
  const d = normalizeTrNational(raw);
  return d.length === 10 && d.startsWith('5');
}

export function toE164Tr(raw: string): string {
  return `+90${normalizeTrNational(raw)}`;
}

export function trPhoneError(raw: string): string | null {
  const d = digitsOnly(raw);
  if (!d) return 'Telefon numarası gerekli.';
  const national = normalizeTrNational(raw);
  if (!national.startsWith('5')) {
    return 'Cep telefonu 5 ile başlamalıdır (ör. 05xx xxx xx xx).';
  }
  if (national.length < 10) {
    return 'Telefon numarası eksik — 10 hane girin (başındaki 0 hariç).';
  }
  if (national.length > 10) {
    return 'Telefon numarası fazla uzun — yalnızca cep numaranızı girin.';
  }
  if (!isValidTrMobile(raw)) {
    return 'Geçerli bir cep telefonu numarası girin (ör. 05xxxxxxxxx).';
  }
  return null;
}
