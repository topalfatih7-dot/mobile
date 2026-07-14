import { supabase } from '@/services/supabaseClient';

export type MemberPayment = {
  id: string;
  memberId: string | null;
  amount?: number;
  status?: string;
  planId?: string;
  plan?: string;
  createdAt?: string;
  packageConfig?: { planId?: string; membership?: string; [key: string]: unknown };
  [key: string]: unknown;
};

type PaymentRow = {
  id: string;
  member_id: string | null;
  data?: Record<string, unknown> | null;
  created_at?: string;
};

function rowToPayment(row: PaymentRow): MemberPayment {
  const data = row.data || {};
  return {
    ...data,
    id: row.id,
    memberId: row.member_id,
    createdAt: (data.createdAt as string | undefined) || row.created_at,
  };
}

export async function fetchMemberPayments(memberId: string): Promise<MemberPayment[]> {
  if (!supabase || !memberId) return [];
  const { data, error } = await supabase
    .from('payments')
    .select('*')
    .eq('member_id', memberId)
    .order('created_at', { ascending: false });
  if (error || !data) return [];
  return (data as PaymentRow[]).map(rowToPayment);
}

export async function fetchAllPayments(limit = 100): Promise<MemberPayment[]> {
  if (!supabase) return [];
  const { data, error } = await supabase
    .from('payments')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit);
  if (error || !data) return [];
  return (data as PaymentRow[]).map(rowToPayment);
}

/** Staff: ödemeler atanmış danışanlara göre filtrelenir. */
export async function fetchPaymentsForMemberIds(
  memberIds: string[],
  limit = 80,
): Promise<MemberPayment[]> {
  if (!supabase || memberIds.length === 0) return [];
  const unique = [...new Set(memberIds.filter(Boolean))];
  const { data, error } = await supabase
    .from('payments')
    .select('*')
    .in('member_id', unique)
    .order('created_at', { ascending: false })
    .limit(limit);
  if (error || !data) return [];
  return (data as PaymentRow[]).map(rowToPayment);
}

export function paymentPlanLabel(p: MemberPayment): string {
  const planId =
    p.packageConfig?.planId ||
    p.packageConfig?.membership ||
    p.planId ||
    p.plan;
  if (typeof planId === 'string' && planId.trim()) return planId;
  return 'Üyelik ödemesi';
}

export function formatTry(amount?: number): string {
  return new Intl.NumberFormat('tr-TR', {
    style: 'currency',
    currency: 'TRY',
    maximumFractionDigits: 0,
  }).format(amount || 0);
}
