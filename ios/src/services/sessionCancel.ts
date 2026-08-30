/**
 * Randevu iptal / yeniden planla API — web `/api/auth` parity.
 */
import { postJson } from '@/services/api';
import type { MemberSession, SessionType } from '@/utils/sessionBooking';

type CancelOk = {
  ok: true;
  session: MemberSession;
  outcome?: string;
  actor?: string;
};
type CancelFail = { ok: false; error: string };

export async function requestCancelSessionApi(opts: {
  sessionId: string;
  sessionType: SessionType;
  memberId?: string;
  forceAdmin?: boolean;
}): Promise<CancelOk | CancelFail> {

  const { ok, json } = await postJson<{
    ok?: boolean;
    error?: string;
    session?: MemberSession;
    outcome?: string;
    actor?: string;
  }>('/api/auth', {
    action: 'request-cancel-session',
    sessionId: opts.sessionId,
    sessionType: opts.sessionType,
    memberId: opts.memberId,
    forceAdmin: Boolean(opts.forceAdmin),
  });

  if (!ok || !json?.ok || !json.session) {
    return { ok: false, error: String(json?.error || 'İptal işlemi başarısız.') };
  }
  return {
    ok: true,
    session: json.session,
    outcome: json.outcome,
    actor: json.actor,
  };
}

export async function respondCancelSessionApi(opts: {
  memberId: string;
  sessionId: string;
  sessionType: SessionType;
  decision: 'approve' | 'reject';
}): Promise<CancelOk | CancelFail> {

  const { ok, json } = await postJson<{
    ok?: boolean;
    error?: string;
    session?: MemberSession;
    outcome?: string;
  }>('/api/auth', {
    action: 'respond-cancel-session',
    memberId: opts.memberId,
    sessionId: opts.sessionId,
    sessionType: opts.sessionType,
    decision: opts.decision,
  });

  if (!ok || !json?.ok || !json.session) {
    return { ok: false, error: String(json?.error || 'İşlem başarısız.') };
  }
  return { ok: true, session: json.session, outcome: json.outcome };
}

export async function rescheduleSessionApi(opts: {
  sessionId: string;
  sessionType: SessionType;
  days?: number;
}): Promise<
  | { ok: true; session: MemberSession; oldStartsAt?: string; newStartsAt?: string }
  | CancelFail
> {

  const { ok, json } = await postJson<{
    ok?: boolean;
    error?: string;
    session?: MemberSession;
    oldStartsAt?: string;
    newStartsAt?: string;
  }>('/api/auth', {
    action: 'reschedule-session',
    sessionId: opts.sessionId,
    sessionType: opts.sessionType,
    days: opts.days,
  });

  if (!ok || !json?.ok || !json.session) {
    return { ok: false, error: String(json?.error || 'Yeniden planlama başarısız.') };
  }
  return {
    ok: true,
    session: json.session,
    oldStartsAt: json.oldStartsAt,
    newStartsAt: json.newStartsAt,
  };
}

/** Personel: pending randevu onay/red (web respond-session) */
export async function respondBookSessionApi(opts: {
  memberId: string;
  sessionId: string;
  sessionType: SessionType;
  decision: 'approve' | 'reject';
}): Promise<CancelOk | CancelFail> {

  const { ok, json } = await postJson<{
    ok?: boolean;
    error?: string;
    session?: MemberSession;
  }>('/api/auth', {
    action: 'respond-session',
    memberId: opts.memberId,
    sessionId: opts.sessionId,
    sessionType: opts.sessionType,
    decision: opts.decision,
  });

  if (!ok || !json?.ok || !json.session) {
    return { ok: false, error: String(json?.error || 'İşlem başarısız.') };
  }
  return { ok: true, session: json.session };
}
