/**
 * Admin activity log — `activities` table.
 */
import { supabase } from '@/services/supabaseClient';

export type ActivityItem = {
  id: string;
  memberId: string | null;
  type: string;
  text: string;
  createdAt: string;
};

type ActivityRow = {
  id: string;
  member_id?: string | null;
  data?: { type?: string; text?: string; createdAt?: string } | null;
  created_at?: string;
};

export async function fetchActivities(limit = 80): Promise<ActivityItem[]> {
  if (!supabase) return [];
  const { data, error } = await supabase
    .from('activities')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit);
  if (error || !data) return [];
  return data.map((row) => {
    const r = row as ActivityRow;
    const d = r.data || {};
    return {
      id: r.id,
      memberId: r.member_id || null,
      type: d.type || 'activity',
      text: d.text || 'Aktivite',
      createdAt: d.createdAt || r.created_at || '',
    };
  });
}
