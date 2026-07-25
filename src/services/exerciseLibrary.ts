import { isUiOnly } from '@/config/runtime';
import { DEMO_EXERCISES } from '@/data/uiDemo';
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
  if (isUiOnly() || !supabase) {
    if (isUiOnly()) {
      let items = DEMO_EXERCISES.slice();
      if (Array.isArray(filters.ids)) {
        if (filters.ids.length === 0) {
          return {
            items: [],
            total: 0,
            page,
            pageSize,
            totalPages: 0,
            error: null,
          };
        }
        const idSet = new Set(filters.ids);
        items = items.filter((e) => idSet.has(String(e.id)));
      }
      const q = (filters.search || '').trim().toLowerCase();
      if (q) {
        items = items.filter((e) => String(e.name || '').toLowerCase().includes(q));
      }
      if (filters.difficulty) {
        items = items.filter((e) => e.difficulty === filters.difficulty);
      }
      if (filters.location) {
        const locs = (e: Record<string, unknown>) =>
          Array.isArray(e.locations) ? (e.locations as string[]) : [];
        items = items.filter((e) => locs(e).includes(String(filters.location)));
      }
      if (filters.category && filters.category !== 'Tümü') {
        items = items.filter(
          (e) =>
            e.bodyPart === filters.category ||
            (e as { category?: string }).category === filters.category,
        );
      }
      if (filters.equipment) {
        items = items.filter((e) => e.equipment === filters.equipment);
      }
      if (filters.requiresMachine === 'true') {
        items = items.filter((e) => e.requiresMachine === true);
      }
      if (filters.requiresMachine === 'false') {
        items = items.filter((e) => e.requiresMachine !== true);
      }
      const total = items.length;
      const from = (page - 1) * pageSize;
      const pageItems = items.slice(from, from + pageSize);
      return {
        items: pageItems,
        total,
        page,
        pageSize,
        totalPages: Math.max(1, Math.ceil(total / pageSize)),
        error: null,
      };
    }
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
  if (isUiOnly()) {
    return [
      ...new Set(
        DEMO_EXERCISES.map((exercise) => String(exercise.bodyPart || exercise.category || ''))
          .filter(Boolean),
      ),
    ].sort((a, b) => a.localeCompare(b, 'tr'));
  }
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
  if (isUiOnly()) {
    return (
      (DEMO_EXERCISES.find((exercise) => String(exercise.id) === String(id)) as
        | Record<string, unknown>
        | undefined) || null
    );
  }
  if (!supabase) return null;
  const { data, error } = await supabase
    .from('exercises')
    .select('*')
    .eq('id', String(id))
    .maybeSingle();
  if (error || !data) return null;
  return rowToExercise(data as Record<string, unknown>);
}
