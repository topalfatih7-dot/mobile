/**
 * Blog posts CRUD — web `supabaseDb.addPost` / `editPost` / `removePost`.
 */
import { supabase } from '@/services/supabaseClient';

export type BlogPost = {
  id: string;
  published: boolean;
  title: string;
  slug: string;
  category: string;
  excerpt: string;
  author: string;
  content: string;
  createdAt: string;
  updatedAt?: string;
  [key: string]: unknown;
};

type PostRow = {
  id: string;
  published?: boolean;
  data?: Record<string, unknown> | null;
  created_at?: string;
};

function today() {
  return new Date().toISOString().slice(0, 10);
}

function slugify(title: string) {
  return String(title || 'yazi')
    .toLowerCase()
    .replace(/ğ/g, 'g')
    .replace(/ü/g, 'u')
    .replace(/ş/g, 's')
    .replace(/ı/g, 'i')
    .replace(/ö/g, 'o')
    .replace(/ç/g, 'c')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 80);
}

export function rowToPost(row: PostRow): BlogPost {
  const data = row.data || {};
  return {
    id: row.id,
    published: row.published !== false,
    title: String(data.title || ''),
    slug: String(data.slug || ''),
    category: String(data.category || 'Yaşam'),
    excerpt: String(data.excerpt || ''),
    author: String(data.author || 'Yeni Form Ekibi'),
    content: String(data.content || ''),
    createdAt: String(data.createdAt || row.created_at || today()),
    updatedAt: data.updatedAt ? String(data.updatedAt) : undefined,
    ...data,
  };
}

export async function fetchPosts(limit = 60): Promise<BlogPost[]> {
  if (!supabase) return [];
  const { data, error } = await supabase
    .from('posts')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit);
  if (error || !data) return [];
  return data.map((row) => rowToPost(row as PostRow));
}

export async function addPost(input: {
  title: string;
  content?: string;
  excerpt?: string;
  category?: string;
  author?: string;
  published?: boolean;
}): Promise<{ success: true; post: BlogPost } | { success: false; error: string }> {
  if (!supabase) return { success: false, error: 'Supabase bağlantısı yok.' };
  const title = input.title.trim();
  if (!title) return { success: false, error: 'Başlık gerekli.' };
  const content = input.content || '';
  const category = input.category || 'Yaşam';
  const slug = slugify(title);
  const { data, error } = await supabase
    .from('posts')
    .insert({
      published: input.published !== false,
      data: {
        title,
        slug,
        category,
        excerpt: input.excerpt || '',
        author: input.author || 'Yeni Form Ekibi',
        content,
        createdAt: today(),
        updatedAt: today(),
      },
    })
    .select()
    .single();
  if (error || !data) return { success: false, error: error?.message || 'Yazı eklenemedi.' };
  return { success: true, post: rowToPost(data as PostRow) };
}

export async function editPost(
  id: string,
  patch: Partial<{ title: string; content: string; excerpt: string; category: string; published: boolean }>,
): Promise<{ success: true } | { success: false; error: string }> {
  if (!supabase) return { success: false, error: 'Supabase bağlantısı yok.' };
  const { data: rows } = await supabase.from('posts').select('*').eq('id', id).limit(1);
  const current = rows?.[0] as PostRow | undefined;
  if (!current) return { success: false, error: 'Yazı bulunamadı.' };
  const merged = { ...rowToPost(current), ...patch };
  const { error } = await supabase
    .from('posts')
    .update({
      published: merged.published !== false,
      data: {
        ...(current.data || {}),
        title: merged.title,
        slug: merged.slug || slugify(merged.title),
        category: merged.category || 'Yaşam',
        excerpt: merged.excerpt || '',
        author: merged.author,
        content: merged.content || '',
        createdAt: merged.createdAt,
        updatedAt: today(),
      },
    })
    .eq('id', id);
  if (error) return { success: false, error: error.message };
  return { success: true };
}

export async function removePost(id: string): Promise<{ success: true } | { success: false; error: string }> {
  if (!supabase) return { success: false, error: 'Supabase bağlantısı yok.' };
  const { error } = await supabase.from('posts').delete().eq('id', id);
  if (error) return { success: false, error: error.message };
  return { success: true };
}
