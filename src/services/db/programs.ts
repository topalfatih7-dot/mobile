import { supabase } from '@/services/supabaseClient';

export type DbProgram = {
  id: string;
  memberId: string;
  staffId: string | null;
  type: 'workout' | 'nutrition' | string;
  title: string;
  description: string;
  staffName: string;
  items: unknown[];
  entries: ProgramEntry[];
  createdAt: string;
};

export type ProgramEntry = {
  id: string;
  date?: string;
  day?: number | string;
  mealType?: string;
  name?: string;
  exerciseName?: string;
  start?: string;
  end?: string;
  amount?: number;
  [key: string]: unknown;
};

type ProgramRow = {
  id: string;
  member_id: string;
  staff_id: string | null;
  data?: {
    type?: string;
    title?: string;
    description?: string;
    staffName?: string;
    items?: unknown[];
    entries?: ProgramEntry[];
    createdAt?: string;
  } | null;
  created_at?: string;
};

export function rowToProgram(row: ProgramRow): DbProgram {
  const data = row.data || {};
  return {
    id: row.id,
    memberId: row.member_id,
    staffId: row.staff_id,
    type: data.type === 'nutrition' ? 'nutrition' : 'workout',
    title: data.title || '',
    description: data.description || '',
    staffName: data.staffName || '',
    items: data.items || [],
    entries: data.entries || [],
    createdAt: data.createdAt || row.created_at || '',
  };
}

export async function fetchStaffPrograms(staffId: string): Promise<DbProgram[]> {
  if (!supabase) return [];
  const { data, error } = await supabase
    .from('programs')
    .select('*')
    .eq('staff_id', staffId)
    .order('created_at', { ascending: false });
  if (error) return [];
  return (data || []).map(rowToProgram);
}

export async function fetchMemberPrograms(memberId: string): Promise<DbProgram[]> {
  if (!supabase) return [];
  const { data, error } = await supabase
    .from('programs')
    .select('*')
    .eq('member_id', memberId)
    .order('created_at', { ascending: false });
  if (error) return [];
  return (data || []).map(rowToProgram);
}

export async function fetchProgramById(programId: string): Promise<DbProgram | null> {
  if (!supabase) return null;
  const { data, error } = await supabase.from('programs').select('*').eq('id', programId).maybeSingle();
  if (error || !data) return null;
  return rowToProgram(data as ProgramRow);
}
