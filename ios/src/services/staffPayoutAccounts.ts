import { requireSupabase, supabase } from '@/services/supabase';
import {
  payoutAccountToRow,
  rowToPayoutAccount,
  type PayoutAccountForm,
  type StaffPayoutAccount,
} from '@/utils/staffPayoutAccount';

export { payoutAccountToRow, rowToPayoutAccount };
export type { PayoutAccountForm, StaffPayoutAccount };

export async function fetchOwnPayoutAccount(staffId: string): Promise<StaffPayoutAccount | null> {
  if (!supabase || !staffId) return null;
  const { data, error } = await requireSupabase()
    .from('staff_payout_accounts')
    .select('*')
    .eq('staff_id', staffId)
    .maybeSingle();
  if (error) throw error;
  return rowToPayoutAccount(data as Record<string, unknown> | null);
}

export async function upsertPayoutAccount(
  staffId: string,
  form: PayoutAccountForm,
): Promise<StaffPayoutAccount> {
  if (!supabase) throw new Error('Veritabanı bağlantısı yok.');
  const payload = payoutAccountToRow(staffId, form);
  const { data, error } = await requireSupabase()
    .from('staff_payout_accounts')
    .upsert(payload, { onConflict: 'staff_id' })
    .select('*')
    .single();
  if (error) throw error;
  const row = rowToPayoutAccount(data as Record<string, unknown>);
  if (!row) throw new Error('Kaydedilemedi.');
  return row;
}
