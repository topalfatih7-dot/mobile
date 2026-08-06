/**
 * Web parity: Adsız `src/services/memberNotifications.js`
 * members.data.notifications via RPC + Expo push via /api/application-notify.
 */
import { isUiOnly } from '@/config/runtime';
import { postJson } from '@/services/api';
import { requireSupabase, supabase } from '@/services/supabase';

const nowISO = () => new Date().toISOString();

const STAFF_ROLE_LABELS: Record<string, string> = {
  coach: 'Koçunuz',
  dietitian: 'Diyetisyeniniz',
  doctor: 'Doktorunuz',
};

export function staffRoleNotificationLabel(role?: string | null) {
  return STAFF_ROLE_LABELS[String(role || '')] || 'Uzmanınız';
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
  if (isUiOnly() || !supabase) {
    return { success: false, error: 'Demo modda bildirim yok.' };
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
  const roleLabel = staffRoleNotificationLabel(opts.staffRole);
  return pushMemberNotification(
    opts.memberId,
    buildMemberNotification({
      type: 'chat',
      title: `${roleLabel}den yeni mesaj`,
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
