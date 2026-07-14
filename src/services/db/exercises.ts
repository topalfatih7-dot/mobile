import { supabase } from '@/services/supabaseClient';



export type LibraryExercise = {

  id: string;

  name: string;

  description?: string;

  category: string;

  sportType: string;

  bodyPart: string;

  videoUrl?: string;

  difficulty?: string;

};



type ExerciseRow = {

  id: string;

  name?: string | null;

  description?: string | null;

  category?: string | null;

  body_part?: string | null;

  sport_type?: string | null;

  video_url?: string | null;

  difficulty?: string | null;

};



function rowToExercise(row: ExerciseRow): LibraryExercise {

  return {

    id: row.id,

    name: row.name || 'Egzersiz',

    description: row.description || undefined,

    category: row.body_part || row.category || 'Tüm Vücut',

    sportType: row.sport_type || 'Fitness',

    bodyPart: row.body_part || row.category || 'Tüm Vücut',

    videoUrl: row.video_url || undefined,

    difficulty: row.difficulty || undefined,

  };

}



function buildExercisePayload(data: {

  name: string;

  description?: string;

  category?: string;

  bodyPart?: string;

  sportType?: string;

  videoUrl?: string;

  difficulty?: string;

}) {

  return {

    name: data.name,

    description: data.description || '',

    category: data.bodyPart || data.category || 'Tüm Vücut',

    sport_type: data.sportType || 'Fitness',

    body_part: data.bodyPart || data.category || 'Tüm Vücut',

    video_url: data.videoUrl || '',

    difficulty: data.difficulty || 'beginner',

  };

}



const isMissingColumnError = (error: { code?: string; message?: string } | null) =>

  !!error &&

  (error.code === 'PGRST204' ||

    error.code === '42703' ||

    /body_part|sport_type|difficulty|video_url/.test(error.message || ''));



export async function fetchLibraryExercises(limit = 60): Promise<LibraryExercise[]> {

  if (!supabase) return [];

  const { data, error } = await supabase

    .from('exercises')

    .select('id, name, description, body_part, sport_type, category, video_url, difficulty')

    .order('name', { ascending: true })

    .limit(limit);

  if (error || !data) return [];

  return (data as ExerciseRow[]).map(rowToExercise);

}



export async function addExercise(data: {

  name: string;

  description?: string;

  category?: string;

  bodyPart?: string;

  sportType?: string;

}): Promise<{ success: true } | { success: false; error: string }> {

  if (!supabase) return { success: false, error: 'Supabase bağlantısı yok.' };

  if (!data.name.trim()) return { success: false, error: 'Egzersiz adı gerekli.' };

  const payload = buildExercisePayload(data);

  let { error } = await supabase.from('exercises').insert(payload);

  if (isMissingColumnError(error)) {

    const { sport_type, body_part, difficulty, video_url, ...rest } = payload;

    void sport_type;

    void body_part;

    void difficulty;

    void video_url;

    ;({ error } = await supabase.from('exercises').insert(rest));

  }

  if (error) return { success: false, error: error.message };

  return { success: true };

}



export async function editExercise(

  id: string,

  patch: {

    name: string;

    description?: string;

    category?: string;

    bodyPart?: string;

    sportType?: string;

  },

): Promise<{ success: true } | { success: false; error: string }> {

  if (!supabase) return { success: false, error: 'Supabase bağlantısı yok.' };

  const payload = buildExercisePayload(patch);

  let { error } = await supabase.from('exercises').update(payload).eq('id', id);

  if (isMissingColumnError(error)) {

    const { sport_type, body_part, difficulty, video_url, ...rest } = payload;

    void sport_type;

    void body_part;

    void difficulty;

    void video_url;

    ;({ error } = await supabase.from('exercises').update(rest).eq('id', id));

  }

  if (error) return { success: false, error: error.message };

  return { success: true };

}



export async function removeExercise(id: string): Promise<{ success: true } | { success: false; error: string }> {
  if (!supabase) return { success: false, error: 'Supabase bağlantısı yok.' };
  const { error } = await supabase.from('exercises').delete().eq('id', id);
  if (error) return { success: false, error: error.message };
  return { success: true };
}

/** Signed / absolute video URL for playback. */
export async function resolveExerciseVideoUrl(pathOrUrl?: string): Promise<string | null> {
  if (!pathOrUrl) return null;
  if (pathOrUrl.startsWith('http')) return pathOrUrl;
  if (!supabase) return null;
  const { data } = await supabase.storage.from('exercises').createSignedUrl(pathOrUrl, 60 * 15);
  return data?.signedUrl || null;
}
