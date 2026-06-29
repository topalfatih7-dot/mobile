import { rowToStaff } from '@/services/db/mappers';
import { supabase } from '@/services/supabaseClient';
import type { StaffProfile } from '@/types/session';

export async function fetchStaffByIds(ids: string[]): Promise<StaffProfile[]> {
  if (!supabase || ids.length === 0) return [];
  const unique = [...new Set(ids.filter(Boolean))];
  const { data, error } = await supabase.from('staff').select('*').in('id', unique);
  if (error) return [];
  return (data || []).map(rowToStaff);
}

export async function fetchAllStaff(): Promise<StaffProfile[]> {
  if (!supabase) return [];
  const { data, error } = await supabase.from('staff').select('*').order('created_at', { ascending: true });
  if (error) return [];
  return (data || []).map(rowToStaff);
}
