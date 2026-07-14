import { supabase } from '@/services/supabaseClient';

export type DbProgram = {
  id: string;
  memberId: string;
  staffId: string | null;
  type: 'workout' | 'nutrition' | string;
  title: string;
  description: string;
  staffName: string;
  memberName: string;
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
    memberName?: string;
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
    memberName: data.memberName || '',
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

export async function fetchStaffNutritionLists(staffId: string): Promise<DbProgram[]> {
  const all = await fetchStaffPrograms(staffId);
  return all.filter((p) => p.type === 'nutrition');
}

function nowISO() {
  return new Date().toISOString();
}

/** Web `createProgram` — basit atama / not. */
export async function createProgram(data: {
  memberId: string;
  staffId?: string | null;
  type?: 'workout' | 'nutrition';
  title: string;
  description?: string;
  memberName?: string;
  staffName?: string;
  items?: unknown[];
  entries?: ProgramEntry[];
}): Promise<{ success: true; program: DbProgram } | { success: false; error: string }> {
  if (!supabase) return { success: false, error: 'Supabase bağlantısı yok.' };
  const staffId = data.staffId && data.staffId !== 'system' ? data.staffId : null;
  const { data: row, error } = await supabase
    .from('programs')
    .insert({
      member_id: data.memberId,
      staff_id: staffId,
      data: {
        type: data.type === 'nutrition' ? 'nutrition' : 'workout',
        memberName: data.memberName || '',
        staffName: data.staffName || '',
        title: data.title,
        description: data.description || '',
        items: Array.isArray(data.items) ? data.items : [],
        entries: Array.isArray(data.entries) ? data.entries : [],
        createdAt: nowISO(),
      },
    })
    .select()
    .single();
  if (error || !row) return { success: false, error: error?.message || 'Program oluşturulamadı.' };
  return { success: true, program: rowToProgram(row as ProgramRow) };
}

export async function updateProgramDescription(
  programId: string,
  description: string,
): Promise<{ success: true; program: DbProgram } | { success: false; error: string }> {
  if (!supabase) return { success: false, error: 'Supabase bağlantısı yok.' };
  const current = await fetchProgramById(programId);
  if (!current) return { success: false, error: 'Program bulunamadı.' };

  const { data: rows } = await supabase.from('programs').select('*').eq('id', programId).limit(1);
  const row = rows?.[0] as ProgramRow | undefined;
  if (!row) return { success: false, error: 'Program bulunamadı.' };

  const nextData = { ...(row.data || {}), description, title: current.title };
  const { error } = await supabase.from('programs').update({ data: nextData }).eq('id', programId);
  if (error) return { success: false, error: error.message };
  return { success: true, program: { ...current, description } };
}
