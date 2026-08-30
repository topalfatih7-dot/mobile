/**
 * Web parity: Adsız `src/services/memberNotifications.js`
 * members.data.notifications via RPC + Expo push via /api/application-notify.
 */
import { postJson } from '@/services/api';
import { requireSupabase, supabase } from '@/services/supabase';

const nowISO = () => new Date().toISOString();

const STAFF_ROLE_LABELS: Record<string, string> = {
  coach: 'Koçunuz',
  dietitian: 'Diyetisyeniniz',
  doctor: 'Doktorunuz',
};

const STAFF_ROLE_FROM_LABELS: Record<string, string> = {
  coach: 'Koçunuzdan',
  dietitian: 'Diyetisyeninizden',
  doctor: 'Doktorunuzdan',
};

export function staffRoleNotificationLabel(role?: string | null) {
  return STAFF_ROLE_LABELS[String(role || '')] || 'Uzmanınız';
}

/** Eski kayıtlardaki "Koçunuzden" yazımını ekranda düzeltir. */
export function displayMemberNotificationTitle(title?: string | null) {
  const t = String(title || '').trim();
  if (!t) return 'Bildirim';
  return t
    .replace(/^Koçunuzden /, 'Koçunuzdan ')
    .replace(/^Doktorunuzden /, 'Doktorunuzdan ')
    .replace(/^Uzmanınızden /, 'Uzmanınızdan ');
}

export function buildMemberNotification(opts: {
  type: string;
  title: string;
  message: string;
  [key: string]: unknown;
}) {
  const { type, title, message, ...extra } = opts;
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

async function dispatchOutbound(
  memberId: string,
  notification: Record<string, unknown>,
  extra: Record<string, unknown> = {},
) {
  try {
    await postJson('/api/application-notify', {
      memberId,
      notification,
      ...extra,
    });
  } catch {
    /* ignore — in-app notification must not fail */
  }
}

/** members.data.notifications — RPC ile atomik ekleme (RLS güvenli). */
export async function pushMemberNotification(
  memberId: string,
  notification: Record<string, unknown>,
  outboundExtra: Record<string, unknown> = {},
): Promise<{ success: boolean; error?: string }> {
  if (!memberId || !notification?.title) {
    return { success: false, error: 'Eksik bildirim bilgisi' };
  }
  if (!supabase) {
    return { success: false, error: 'Bağlantı kurulamadı.' };
  }

  const client = requireSupabase();
  const { error } = await client.rpc('append_member_notification', {
    p_member_id: memberId,
    p_notification: notification,
  });

  if (error) return { success: false, error: error.message };
  void dispatchOutbound(memberId, notification, outboundExtra);
  return { success: true };
}

export async function notifyMemberChatMessage(opts: {
  memberId: string;
  preview: string;
  threadId?: string | null;
  staffRole?: string | null;
}) {
  const fromLabel = STAFF_ROLE_FROM_LABELS[String(opts.staffRole || '')] || 'Uzmanınızdan';
  return pushMemberNotification(
    opts.memberId,
    buildMemberNotification({
      type: 'chat',
      title: `${fromLabel} yeni mesaj`,
      message: opts.preview,
      threadId: opts.threadId || null,
      staffRole: opts.staffRole || null,
    }),
    {
      threadId: opts.threadId || null,
      staffRole: opts.staffRole || null,
    },
  );
}

export async function notifyMemberProgram(opts: {
  memberId: string;
  staffName?: string | null;
  title: string;
  programType?: string | null;
  programId?: string | null;
}) {
  const typeLabel = opts.programType === 'nutrition' ? 'Beslenme' : 'Antrenman';
  return pushMemberNotification(
    opts.memberId,
    buildMemberNotification({
      type: 'program',
      title: `Yeni ${typeLabel} Programı`,
      message: `${opts.staffName || 'Uzmanınız'} size "${opts.title}" programını hazırladı. Programlarım bölümünden inceleyebilirsiniz.`,
      programId: opts.programId || null,
      programType: opts.programType || 'workout',
    }),
    {
      staffName: opts.staffName || null,
      programTitle: opts.title || typeLabel,
      programType: opts.programType || 'workout',
    },
  );
}

export async function notifyMemberSupportReply(opts: {
  memberId: string;
  preview: string;
  ticketId?: string | null;
}) {
  return pushMemberNotification(
    opts.memberId,
    buildMemberNotification({
      type: 'support-reply',
      title: 'Destek yanıtı',
      message: opts.preview,
      ticketId: opts.ticketId || null,
    }),
  );
}

export async function notifyMemberAvailability(opts: {
  memberId: string;
  message: string;
}) {
  return pushMemberNotification(
    opts.memberId,
    buildMemberNotification({
      type: 'availability',
      title: 'Müsaitlik güncellendi',
      message: opts.message,
      action: 'availability',
    }),
  );
}

/**
 * Personel görüşme odasına katılınca danışana in-app + Expo.
 * Tip: `call-join` — tap → `/(member)/call/{sessionType}/{sessionId}`
 */
export async function notifyMemberCallJoin(opts: {
  memberId: string;
  sessionId: string;
  sessionType: string;
  staffId?: string | null;
  staffName?: string | null;
}) {
  if (!opts.memberId || !opts.sessionId) {
    return { success: false, error: 'Eksik görüşme bilgisi' };
  }
  const roleLabel = staffRoleNotificationLabel(opts.sessionType);
  const name = String(opts.staffName || '').trim();
  return pushMemberNotification(
    opts.memberId,
    buildMemberNotification({
      type: 'call-join',
      title: `${roleLabel} görüşmeye katıldı`,
      message: name
        ? `${name} görüşme odasında sizi bekliyor.`
        : `${roleLabel} görüşme odasında sizi bekliyor.`,
      sessionId: opts.sessionId,
      sessionType: opts.sessionType,
      staffRole: opts.sessionType,
      senderId: opts.staffId || null,
    }),
    {
      sessionId: opts.sessionId,
      sessionType: opts.sessionType,
      staffRole: opts.sessionType,
    },
  );
}

/** Üyeye atama bildirimi: "Koçunuz atandı" / "Diyetisyeniniz atandı". */
export async function notifyMemberAssignment(opts: {
  memberId: string;
  staffRole: 'coach' | 'dietitian' | 'doctor';
  staffName?: string | null;
}) {
  const roleLabel: Record<string, string> = {
    coach: 'Koçunuz',
    dietitian: 'Diyetisyeniniz',
    doctor: 'Doktorunuz',
  };
  const label = roleLabel[opts.staffRole] || 'Uzmanınız';
  const namePart = opts.staffName ? ` ${opts.staffName}` : '';
  return pushMemberNotification(
    opts.memberId,
    buildMemberNotification({
      type: 'assignment',
      title: `${label} atandı`,
      message: `${label}${namePart} sizinle çalışmaya başladı. Mesajlar bölümünden iletişime geçebilirsiniz.`,
      staffRole: opts.staffRole,
    }),
    { staffRole: opts.staffRole },
  );
}
