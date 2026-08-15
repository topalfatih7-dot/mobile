/**
 * Web parity: Adsız `src/services/staffNotifications.js`
 * staff.data.notifications via RPC.
 */
import { isUiOnly } from '@/config/runtime';
import { requireSupabase, supabase } from '@/services/supabase';

const nowISO = () => new Date().toISOString();

export function buildStaffNotification({
  type,
  title,
  message,
  ...extra
}: {
  type: string;
  title: string;
  message: string;
  [key: string]: unknown;
}) {
  return {
    id: `n-${type}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    type,
    title,
    message,
    read: false,
    createdAt: nowISO(),
    ...extra,
  };
}

export function buildAppointmentStaffNotification({
  memberId,
  memberName,
  sessionId,
  sessionType,
  startsAt,
}: {
  memberId?: string | null;
  memberName?: string | null;
  sessionId?: string | null;
  sessionType?: string | null;
  startsAt?: string | null;
}) {
  const when = startsAt
    ? new Date(startsAt).toLocaleString('tr-TR', {
        timeZone: 'Europe/Istanbul',
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    : '';
  return buildStaffNotification({
    type: 'appointment',
    title: 'Yeni randevu',
    message: `${memberName || 'Danışan'}${when ? ` — ${when}` : ''}`,
    memberId: memberId || null,
    sessionId: sessionId || null,
    sessionType: sessionType || null,
    startsAt: startsAt || null,
  });
}

/** rowToStaff spreads data → notifications at top-level; tolerate nested data. */
export function getStaffNotificationsList(
  staff: Record<string, unknown> | null | undefined,
): Record<string, unknown>[] {
  if (!staff) return [];
  const nested = (staff.data as { notifications?: unknown } | undefined)?.notifications;
  if (Array.isArray(nested)) return nested as Record<string, unknown>[];
  if (Array.isArray(staff.notifications)) {
    return staff.notifications as Record<string, unknown>[];
  }
  return [];
}

/** staff.data.notifications — RPC ile atomik ekleme. */
export async function pushStaffNotification(
  staffId: string,
  notification: Record<string, unknown>,
): Promise<{ success: boolean; error?: string }> {
  if (!staffId || !notification?.title) {
    return { success: false, error: 'Eksik bildirim bilgisi' };
  }
  if (isUiOnly() || !supabase) {
    return { success: false, error: 'Demo modda bildirim yok.' };
  }

  const client = requireSupabase();
  const { error } = await client.rpc('append_staff_notification', {
    p_staff_id: staffId,
    p_notification: notification,
  });
  if (error) return { success: false, error: error.message };
  return { success: true };
}

/** Okundu / tüm liste yazma — personelin kendi satırı. */
export async function setStaffNotifications(
  notifications: Record<string, unknown>[],
): Promise<{ success: boolean; error?: string }> {
  if (isUiOnly() || !supabase) {
    return { success: false, error: 'Demo modda bildirim yok.' };
  }
  const client = requireSupabase();
  const { error } = await client.rpc('staff_set_notifications', {
    p_notifications: Array.isArray(notifications) ? notifications : [],
  });
  if (error) return { success: false, error: error.message };
  return { success: true };
}
