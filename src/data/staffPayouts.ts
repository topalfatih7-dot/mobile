/**
 * Personel hakediş iş kuralları — web `src/data/staffPayouts.js` parity.
 */

/** Tamamlanan ve faturalandırılabilir video görüşme başına net hakediş (TRY) */
export const STAFF_SESSION_RATE_TRY = 500;

/** Minimum eşzamanlı görüşme süresi (dakika) — altında hakediş oluşmaz */
export const STAFF_MIN_OVERLAP_MINUTES = 15;

export const STAFF_EARNING_STATUS: Record<string, string> = {
  pending: 'Onay bekliyor',
  approved: 'Onaylandı',
  paid: 'Ödendi',
  reversed: 'İptal / iade',
  rejected: 'Reddedildi',
};

export function formatStaffTry(amount: number): string {
  return new Intl.NumberFormat('tr-TR', {
    style: 'currency',
    currency: 'TRY',
    maximumFractionDigits: 0,
  }).format(amount || 0);
}

export function formatStaffPayoutPeriodLabel(periodKey: string | null | undefined): string {
  if (!periodKey) return '—';
  return periodKey.replace(/^(\d{4})-W(\d{2})$/, '$1 · Hafta $2');
}
