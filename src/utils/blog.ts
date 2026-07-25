export function blogPostSlug(post: Record<string, unknown>) {
  return String(post.slug || post.id || '');
}

export function blogPostPath(post: Record<string, unknown>) {
  const slug = blogPostSlug(post);
  return `/blog/${slug}`;
}

export function blogPostWebUrl(apiBase: string, post: Record<string, unknown>) {
  return `${apiBase.replace(/\/$/, '')}${blogPostPath(post)}`;
}
