/**
 * Web parity: Adsız `src/services/staffNotifications.js`
 * staff.data.notifications via RPC + Expo push via /api/application-notify.
 */
import { postJson } from '@/services/api';
import { requireSupabase, supabase } from '@/services/supabase';

const nowISO = () => new Date().toISOString();
const RECENT_NOTIF_MS = 60_000;

const COLLAB_SENDER_TITLE: Record<string, string> = {
  coach: 'Koçtan ekip mesajı',
  dietitian: 'Diyetisyenden ekip mesajı',
  doctor: 'Doktordan ekip mesajı',
};

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
    audience: 'staff',
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

/**
 * Overlay SoT top-level `notifications`. Nested `data.notifications` yalnız
 * ham satırda (overlay yokken) yedek.
 */
export function getStaffNotificationsList(
  staff: Record<string, unknown> | null | undefined,
): Record<string, unknown>[] {
  if (!staff) return [];
  if (Array.isArray(staff.notifications)) {
    return staff.notifications as Record<string, unknown>[];
  }
  const nested = (staff.data as { notifications?: unknown } | undefined)?.notifications;
  if (Array.isArray(nested)) return nested as Record<string, unknown>[];
  return [];
}

export function hasRecentStaffNotification(
  staff: Record<string, unknown> | null | undefined,
  match: { type: string; threadId?: string | null; memberId?: string | null },
  windowMs = RECENT_NOTIF_MS,
): boolean {
  const list = getStaffNotificationsList(staff);
  const now = Date.now();
  return list.some((n) => {
    if (String(n.type || '') !== match.type) return false;
    if (match.threadId && String(n.threadId || '') !== String(match.threadId)) return false;
    if (match.memberId && String(n.memberId || '') !== String(match.memberId)) return false;
    const at = new Date(String(n.createdAt || 0)).getTime();
    return Number.isFinite(at) && now - at < windowMs;
  });
}

async function dispatchStaffOutbound(
  staffId: string,
  notification: Record<string, unknown>,
  extra: Record<string, unknown> = {},
) {
  try {
    /**
     * `memberId` must stay the staff token lookup id.
     * Spreading extra.memberId (danışan) made /api/application-notify
     * Expo-push the sender's own chat message back to their phone.
     */
    await postJson('/api/application-notify', {
      audience: 'staff',
      staffId,
      memberId: staffId,
      notification,
      threadId: extra.threadId ?? notification.threadId ?? null,
      sessionId: extra.sessionId ?? notification.sessionId ?? null,
      sessionType: extra.sessionType ?? notification.sessionType ?? null,
    });
  } catch {
    /* ignore — in-app notification must not fail */
  }
}

/** staff.data.notifications — RPC ile atomik ekleme. */
export async function pushStaffNotification(
  staffId: string,
  notification: Record<string, unknown>,
  outboundExtra: Record<string, unknown> = {},
): Promise<{ success: boolean; error?: string }> {
  if (!staffId || !notification?.title) {
    return { success: false, error: 'Eksik bildirim bilgisi' };
  }
  if (!supabase) {
    return { success: false, error: 'Bağlantı kurulamadı.' };
  }

  const client = requireSupabase();
  const { error } = await client.rpc('append_staff_notification', {
    p_staff_id: staffId,
    p_notification: notification,
  });
  if (error && __DEV__) {
    console.warn('[staffNotifications] append_staff_notification', error.message);
  }
  await dispatchStaffOutbound(staffId, notification, outboundExtra);
  return error
    ? { success: false, error: error.message }
    : { success: true };
}

export async function notifyStaffChatMessage(opts: {
  staffId: string;
  preview: string;
  threadId?: string | null;
  memberId?: string | null;
  memberName?: string | null;
}) {
  if (!opts.staffId) return { success: false, error: 'Personel yok.' };
  return pushStaffNotification(
    opts.staffId,
    buildStaffNotification({
      type: 'chat',
      title: `${opts.memberName || 'Danışan'} yeni mesaj gönderdi`,
      message: opts.preview,
      threadId: opts.threadId || null,
      memberId: opts.memberId || null,
      senderId: opts.memberId || null,
    }),
    {
      threadId: opts.threadId || null,
    },
  );
}

export async function notifyStaffAdminMessage(opts: {
  staffId: string;
  preview: string;
  threadId?: string | null;
}) {
  if (!opts.staffId) return { success: false, error: 'Personel yok.' };
  return pushStaffNotification(
    opts.staffId,
    buildStaffNotification({
      type: 'admin-chat',
      title: 'Yönetimden yeni mesaj',
      message: opts.preview,
      threadId: opts.threadId || null,
    }),
    { threadId: opts.threadId || null },
  );
}

export function collabNotificationTitle(senderRole?: string | null) {
  return COLLAB_SENDER_TITLE[String(senderRole || '')] || 'Ekip mesajı';
}

export async function notifyStaffCollabMessage(opts: {
  staffId: string;
  preview: string;
  threadId?: string | null;
  memberId?: string | null;
  memberName?: string | null;
  senderRole?: string | null;
  senderId?: string | null;
}) {
  if (!opts.staffId) return { success: false, error: 'Personel yok.' };
  const title = collabNotificationTitle(opts.senderRole);
  return pushStaffNotification(
    opts.staffId,
    buildStaffNotification({
      type: 'collab',
      title,
      message: opts.memberName
        ? `${opts.memberName}: ${opts.preview}`
        : opts.preview,
      threadId: opts.threadId || null,
      memberId: opts.memberId || null,
      senderId: opts.senderId || null,
    }),
    {
      threadId: opts.threadId || null,
    },
  );
}

/**
 * Danışan görüşme odasına katılınca ilgili personele in-app + Expo.
 * Tip: `call-join` — tap → `/staff/call/{sessionType}/{sessionId}`
 */
export async function notifyStaffCallJoin(opts: {
  staffId: string;
  memberId?: string | null;
  memberName?: string | null;
  sessionId: string;
  sessionType: string;
}) {
  if (!opts.staffId || !opts.sessionId) {
    return { success: false, error: 'Eksik görüşme bilgisi' };
  }
  const name = String(opts.memberName || '').trim() || 'Danışan';
  return pushStaffNotification(
    opts.staffId,
    buildStaffNotification({
      type: 'call-join',
      title: 'Danışan görüşmeye katıldı',
      message: `${name} görüşme odasına girdi.`,
      memberId: opts.memberId || null,
      sessionId: opts.sessionId,
      sessionType: opts.sessionType,
      senderId: opts.memberId || null,
    }),
    {
      sessionId: opts.sessionId,
      sessionType: opts.sessionType,
    },
  );
}

/**
 * Personele yeni danışan atandı bildirimi.
 * Admin paneli üye atadığında backend bu fonksiyonu çağırır.
 */
export async function notifyStaffNewMember(opts: {
  staffId: string;
  memberName?: string | null;
  memberId?: string | null;
}) {
  if (!opts.staffId) return { success: false, error: 'Personel yok.' };
  const name = opts.memberName || 'Yeni danışan';
  return pushStaffNotification(
    opts.staffId,
    buildStaffNotification({
      type: 'assignment',
      title: 'Yeni danışan atandı',
      message: `${name} adlı danışan sizinle çalışmaya başladı.`,
      memberId: opts.memberId || null,
    }),
    { memberId: opts.memberId || null },
  );
}

/** Okundu / tüm liste yazma — personelin kendi satırı. */
export async function setStaffNotifications(
  notifications: Record<string, unknown>[],
): Promise<{ success: boolean; error?: string }> {
  if (!supabase) {
    return { success: false, error: 'Bağlantı kurulamadı.' };
  }
  const client = requireSupabase();
  const { error } = await client.rpc('staff_set_notifications', {
    p_notifications: Array.isArray(notifications) ? notifications : [],
  });
  if (error) return { success: false, error: error.message };
  return { success: true };
}
