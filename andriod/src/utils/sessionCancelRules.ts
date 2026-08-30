/** Randevu iptal / yeniden planla — 24 saat kuralı (web parity) */

export const CANCEL_NOTICE_MS = 24 * 60 * 60 * 1000;

/** Slot kilidi + kota sayımı — iptal onaylanana kadar dolu */
export const SLOT_ACTIVE_STATUSES = [
  'pending',
  'scheduled',
  'rescheduled',
  'cancel_pending',
  'admin_cancel_pending',
] as const;

/** Video join açık (henüz kesin iptal değil) */
export const VIDEO_ACTIVE_STATUSES = [
  'scheduled',
  'cancel_pending',
  'admin_cancel_pending',
] as const;

export const BOOKING_POLICY_ACK_COPY =
  'Randevu saatinden 24 saatten az kaldığında iptal veya yeniden planlama yapılamaz. Onaylı randevularda iptal talebi personel onayına gider.';

export function parseSessionStart(sessionOrDate: { date?: string } | string | Date | null | undefined): Date | null {
  const raw =
    typeof sessionOrDate === 'string' || sessionOrDate instanceof Date
      ? sessionOrDate
      : sessionOrDate?.date;
  if (!raw) return null;
  const d = raw instanceof Date ? raw : new Date(raw);
  return Number.isNaN(d.getTime()) ? null : d;
}

/** Üye iptal / yeniden planla için yeterli süre var mı (≥24s) */
export function canMemberModifySession(
  sessionOrDate: { date?: string } | string | Date | null | undefined,
  now = new Date(),
): boolean {
  const start = parseSessionStart(sessionOrDate);
  if (!start) return false;
  return start.getTime() - now.getTime() >= CANCEL_NOTICE_MS;
}

export function isWithinCancelNoticeWindow(
  sessionOrDate: { date?: string } | string | Date | null | undefined,
  now = new Date(),
): boolean {
  const start = parseSessionStart(sessionOrDate);
  if (!start) return false;
  const ms = start.getTime() - now.getTime();
  return ms > 0 && ms < CANCEL_NOTICE_MS;
}

export function memberCancelLabel(status?: string | null): string {
  if (status === 'pending') return 'Talebi İptal Et';
  return 'İptal Talebi Gönder';
}

export function memberCancelBlockedCopy(): string {
  return 'Randevuya 24 saatten az kaldığı için iptal veya değişiklik yapılamaz.';
}
