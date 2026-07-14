/**
 * Site content CRUD — web `supabaseDb.addContent` / `editContent` / `removeContent`.
 */
import { supabase } from '@/services/supabaseClient';

export type SiteContentItem = {
  id: string;
  kind: string;
  sort: number;
  data: Record<string, unknown>;
};

type ContentRow = {
  id: string;
  kind?: string;
  sort?: number;
  data?: Record<string, unknown> | null;
};

export function rowToContent(row: ContentRow): SiteContentItem {
  return {
    id: row.id,
    kind: row.kind || '',
    sort: row.sort || 0,
    data: row.data || {},
  };
}

export async function fetchSiteContent(kinds?: string[]): Promise<SiteContentItem[]> {
  if (!supabase) return [];
  let q = supabase.from('site_content').select('*').order('sort', { ascending: true });
  if (kinds?.length) q = q.in('kind', kinds);
  const { data, error } = await q;
  if (error || !data) return [];
  return data.map((row) => rowToContent(row as ContentRow));
}

export async function addContent(
  kind: string,
  data: Record<string, unknown> & { sort?: number },
): Promise<{ success: true } | { success: false; error: string }> {
  if (!supabase) return { success: false, error: 'Supabase bağlantısı yok.' };
  const { error } = await supabase.from('site_content').insert({
    kind,
    sort: data.sort || 0,
    data,
  });
  if (error) return { success: false, error: error.message };
  return { success: true };
}

export async function editContent(
  id: string,
  data: Record<string, unknown> & { sort?: number },
): Promise<{ success: true } | { success: false; error: string }> {
  if (!supabase) return { success: false, error: 'Supabase bağlantısı yok.' };
  const { error } = await supabase
    .from('site_content')
    .update({ data, sort: data.sort || 0 })
    .eq('id', id);
  if (error) return { success: false, error: error.message };
  return { success: true };
}

export async function removeContent(id: string): Promise<{ success: true } | { success: false; error: string }> {
  if (!supabase) return { success: false, error: 'Supabase bağlantısı yok.' };
  const { error } = await supabase.from('site_content').delete().eq('id', id);
  if (error) return { success: false, error: error.message };
  return { success: true };
}
