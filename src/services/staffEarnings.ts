/**
 * Staff hakediş — web `useStaffEarnings` / `staff_earnings` parity.
 */
import { isUiOnly } from '@/config/runtime';
import { requireSupabase, supabase } from '@/services/supabase';

export type StaffEarningRow = {
  id: string;
  staff_id: string;
  member_id: string;
  session_id: string;
  session_type: string;
  amount_try: number;
  overlap_minutes: number;
  period_key: string;
  status: string;
  reject_reason?: string | null;
  created_at: string;
  updated_at?: string;
};

export async function fetchStaffEarnings(staffId: string): Promise<StaffEarningRow[]> {
  if (!staffId) return [];
  if (isUiOnly() || !supabase) return [];

  const client = requireSupabase();
  const { data, error } = await client
    .from('staff_earnings')
    .select('*')
    .eq('staff_id', staffId)
    .order('created_at', { ascending: false })
    .limit(100);

  if (error) throw error;
  return (data || []) as StaffEarningRow[];
}
