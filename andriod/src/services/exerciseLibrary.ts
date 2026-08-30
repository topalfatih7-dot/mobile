import { rowToExercise } from '@/services/mappers';
import { supabase } from '@/services/supabase';

export const EXERCISE_PAGE_SIZE = 24;

export async function fetchExercisesPage({
  page = 1,
  pageSize = EXERCISE_PAGE_SIZE,
  filters = {} as {
    search?: string;
    category?: string;
    difficulty?: string;
    equipment?: string;
    location?: string;
    requiresMachine?: string;
    /** Web parity: program-scoped ids; [] → empty list */
    ids?: string[] | null;
  },
} = {}) {
  if (!supabase) {
    return {
      items: [],
      total: 0,
      page,
      pageSize,
      totalPages: 0,
      error: 'Supabase yok',
    };
  }

  if (Array.isArray(filters.ids) && filters.ids.length === 0) {
    return { items: [], total: 0, page, pageSize, totalPages: 0, error: null };
  }

  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  let query = supabase.from('exercises').select('*', { count: 'exact' });

  const {
    search = '',
    category = '',
    difficulty = '',
    equipment = '',
    location = '',
    requiresMachine = '',
    ids = null,
  } = filters;

  if (Array.isArray(ids)) {
    if (ids.length === 0) {
      return { items: [], total: 0, page, pageSize, totalPages: 0, error: null };
    }
    query = query.in('id', ids);
  }
  if (search.trim()) {
    const q = `%${search.trim()}%`;
    query = query.or(`name.ilike.${q},equipment.ilike.${q}`);
  }
  if (category && category !== 'Tümü') query = query.eq('body_part', category);
  if (difficulty && difficulty !== 'Tümü') query = query.eq('difficulty', difficulty);
  if (equipment) query = query.eq('equipment', equipment);
  if (location) query = query.contains('locations', [location]);
  if (requiresMachine === 'true') query = query.eq('requires_machine', true);
  if (requiresMachine === 'false') query = query.eq('requires_machine', false);
  query = query.neq('metadata->>importStatus', 'deferred');

  const { data, error, count } = await query
    .order('name', { ascending: true, nullsFirst: false })
    .range(from, to);

  const items = (data || []).map((row) => rowToExercise(row as Record<string, unknown>));
  const total = count ?? 0;
  return {
    items,
    total,
    page,
    pageSize,
    totalPages: Math.max(1, Math.ceil(total / pageSize)),
    error: error?.message || null,
  };
}

/** Web parity: distinct `body_part` values used by the category filter. */
export async function fetchDistinctExerciseCategories(): Promise<string[]> {
  if (!supabase) return [];
  const { data, error } = await supabase
    .from('exercises')
    .select('body_part')
    .neq('metadata->>importStatus', 'deferred')
    .not('body_part', 'is', null)
    .neq('body_part', '');
  if (error) return [];
  return [
    ...new Set(
      (data || [])
        .map((row) => String((row as { body_part?: string }).body_part || ''))
        .filter(Boolean),
    ),
  ].sort((a, b) => a.localeCompare(b, 'tr'));
}

/** Single exercise metadata for calendar/program detail parity. */
export async function fetchExerciseById(id: unknown): Promise<Record<string, unknown> | null> {
  if (!id) return null;
  if (!supabase) return null;
  const { data, error } = await supabase
    .from('exercises')
    .select('*')
    .eq('id', String(id))
    .maybeSingle();
  if (error || !data) return null;
  return rowToExercise(data as Record<string, unknown>);
}
