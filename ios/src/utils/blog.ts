/** Web `blogSlug.js` + `blogImages.js` parity. */

export const BLOG_CATEGORIES = ['Beslenme', 'Antrenman', 'Motivasyon', 'Yaşam'] as const;

export const BLOG_COVER_BY_CATEGORY: Record<string, { url: string; alt: string }> = {
  Beslenme: {
    url: 'https://images.unsplash.com/photo-1490645935967-10de6ba17061?auto=format&fit=crop&w=1200&q=80',
    alt: 'Sağlıklı beslenme tabağı',
  },
  Antrenman: {
    url: 'https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?auto=format&fit=crop&w=1200&q=80',
    alt: 'Fitness antrenmanı',
  },
  Motivasyon: {
    url: 'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?auto=format&fit=crop&w=1200&q=80',
    alt: 'Motivasyon ve wellness',
  },
  Yaşam: {
    url: 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?auto=format&fit=crop&w=1200&q=80',
    alt: 'Sağlıklı yaşam tarzı',
  },
};

const DEFAULT_COVER = BLOG_COVER_BY_CATEGORY.Yaşam;

/** Türkçe karakter destekli URL slug — web `seo.slugifyTurkish`. */
export function slugifyTurkish(text: unknown): string {
  return String(text || '')
    .toLocaleLowerCase('tr-TR')
    .replace(/ı/g, 'i')
    .replace(/ğ/g, 'g')
    .replace(/ü/g, 'u')
    .replace(/ş/g, 's')
    .replace(/ö/g, 'o')
    .replace(/ç/g, 'c')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export function blogPostSlug(post: Record<string, unknown> | null | undefined): string {
  if (!post) return '';
  if (post.slug) return String(post.slug);
  const fromTitle = slugifyTurkish(post.title);
  return fromTitle || String(post.id || '');
}

export function blogPostPath(post: Record<string, unknown>): string {
  const slug = blogPostSlug(post);
  return slug ? `/blog/${slug}` : '/blog';
}

export function blogPostWebUrl(apiBase: string, post: Record<string, unknown>) {
  return `${apiBase.replace(/\/$/, '')}${blogPostPath(post)}`;
}

/** Route param (UUID veya slug) → yayınlanmış yazı. */
export function findBlogPost(
  posts: Record<string, unknown>[] | null | undefined,
  param: string | undefined | null,
): Record<string, unknown> | null {
  if (!param) return null;
  const list = (posts || []).filter((p) => p.published !== false);
  const byId = list.find((p) => String(p.id) === param);
  if (byId) return byId;
  return list.find((p) => blogPostSlug(p) === param) || null;
}

export function resolveBlogCover(post: Record<string, unknown> | null | undefined): {
  url: string;
  alt: string;
} {
  if (post?.coverImage) {
    return {
      url: String(post.coverImage),
      alt: String(post.coverImageAlt || post.title || 'Blog yazısı'),
    };
  }
  const cat = BLOG_COVER_BY_CATEGORY[String(post?.category || '')] || DEFAULT_COVER;
  return cat;
}

/** Expo Router path for in-app blog post. */
export function blogPostHref(post: Record<string, unknown>): string {
  const slug = blogPostSlug(post);
  return `/(public)/blog/${encodeURIComponent(slug || String(post.id || ''))}`;
}
