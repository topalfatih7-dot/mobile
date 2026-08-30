import { requireSupabase, supabase } from '@/services/supabase';

export type SuccessStoryInput = {
  story: string;
  highlight?: string;
  duration?: string;
  name?: string;
  memberId?: string | null;
};

/**
 * Web parity: Adsız `supabaseDb.submitSuccessStory`
 * → `site_content` insert `{ kind: 'success_story', data: {...} }`
 */
export async function submitSuccessStory(
  member: { id?: string; name?: string } | null | undefined,
  data: SuccessStoryInput,
): Promise<{ success: true } | { success: false; error: string }> {
  const story = String(data.story || '').trim().slice(0, 2000);
  if (!story) return { success: false, error: 'Lütfen hikayenizi yazın' };

  if (!supabase) {
    return { success: false, error: 'Bağlantı kurulamadı.' };
  }

  try {
    const client = requireSupabase();
    const { error } = await client.from('site_content').insert({
      kind: 'success_story',
      sort: 0,
      data: {
        name: member?.name || data.name || 'Üye',
        memberId: member?.id || data.memberId || null,
        duration: String(data.duration || '').trim(),
        highlight: String(data.highlight || story.slice(0, 80)),
        story,
        consent: true,
        approved: false,
      },
    });
    if (error) return { success: false, error: error.message };
    return { success: true };
  } catch (e) {
    return {
      success: false,
      error: e instanceof Error ? e.message : 'Gönderilemedi',
    };
  }
}
