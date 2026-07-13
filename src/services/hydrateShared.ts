/**
 * Public/shared hydrate parçası — web `hydrateOnce()` ilk Promise.all bloğu
 * (docs/rn-migration/01 §4, 04 remoteDb, 06 §2.1).
 * Auth’lu üye paketi hâlâ `hydrateAuthState` + member loaders ile gelir.
 */
import { rowToStaff } from '@/services/db/mappers';
import { supabase } from '@/services/supabaseClient';
import type { StaffProfile } from '@/types/session';

export type MembershipPlan = {
  id: string;
  name: string;
  price: number;
  period: string;
  isActive: boolean;
  badge: string | null;
  features: string[];
  limits: string[];
  pricingTiers: unknown[];
  color: string;
  sortOrder: number;
};

export type SiteContentBundle = {
  testimonials: Record<string, unknown>[];
  faqs: Record<string, unknown>[];
  successStories: Record<string, unknown>[];
  exerciseTaxonomy: Record<string, unknown> | null;
};

export type SharedRemoteDb = {
  staff: StaffProfile[];
  plans: MembershipPlan[];
  posts: { id: string; title?: string; [key: string]: unknown }[];
  exerciseCount: number;
  content: SiteContentBundle;
};

const EMPTY_CONTENT: SiteContentBundle = {
  testimonials: [],
  faqs: [],
  successStories: [],
  exerciseTaxonomy: null,
};

function rowToPlan(row: {
  id: string;
  name: string;
  price: number;
  period: string;
  is_active?: boolean;
  badge?: string | null;
  features?: string[];
  limits?: string[];
  pricing_tiers?: unknown[];
  color?: string;
  sort_order?: number;
}): MembershipPlan {
  return {
    id: row.id,
    name: row.name,
    price: row.price,
    period: row.period,
    isActive: row.is_active !== false,
    badge: row.badge || null,
    features: row.features || [],
    limits: row.limits || [],
    pricingTiers: row.pricing_tiers || [],
    color: row.color || 'sage',
    sortOrder: row.sort_order || 0,
  };
}

/** Statik fallback — DB boşsa (web ALL_PLANS eşdeğeri sadeleştirilmiş). */
export const FALLBACK_PLANS: MembershipPlan[] = [
  {
    id: 'free',
    name: 'Basic',
    price: 0,
    period: 'ay',
    isActive: true,
    badge: null,
    features: [],
    limits: [],
    pricingTiers: [],
    color: 'sage',
    sortOrder: 0,
  },
];

export async function hydrateSharedRemote(): Promise<SharedRemoteDb> {
  if (!supabase) {
    return {
      staff: [],
      plans: FALLBACK_PLANS,
      posts: [],
      exerciseCount: 0,
      content: EMPTY_CONTENT,
    };
  }

  const [staffRes, staffDirectoryRes, postsRes, contentRes, exercisesRes, plansRes] =
    await Promise.all([
      supabase.from('staff').select('*').order('created_at', { ascending: true }),
      supabase.from('staff_directory').select('*').order('created_at', { ascending: true }),
      supabase.from('posts').select('*').order('created_at', { ascending: false }).limit(40),
      supabase.from('site_content').select('*').order('sort', { ascending: true }),
      supabase.from('exercises').select('id', { count: 'exact', head: true }),
      supabase.from('plans').select('*').eq('is_active', true).order('sort_order', { ascending: true }),
    ]);

  const staffById = new Map<string, StaffProfile>();
  ;(staffDirectoryRes.data || []).forEach((row) => staffById.set(row.id, rowToStaff(row)));
  ;(staffRes.data || []).forEach((row) => staffById.set(row.id, rowToStaff(row)));

  const content: SiteContentBundle = {
    testimonials: [],
    faqs: [],
    successStories: [],
    exerciseTaxonomy: null,
  };
  ;(contentRes.data || []).forEach((r: { id: string; kind?: string; data?: Record<string, unknown> }) => {
    const item = { id: r.id, ...(r.data || {}) };
    if (r.kind === 'testimonial') content.testimonials.push(item);
    else if (r.kind === 'faq') content.faqs.push(item);
    else if (r.kind === 'success_story') content.successStories.push(item);
    else if (r.kind === 'exercise_taxonomy') content.exerciseTaxonomy = { id: r.id, ...item };
  });

  const plans =
    plansRes.data?.length ? plansRes.data.map(rowToPlan) : FALLBACK_PLANS;

  return {
    staff: Array.from(staffById.values()),
    plans,
    posts: (postsRes.data || []).map((p: { id: string; data?: Record<string, unknown>; title?: string }) => ({
      id: p.id,
      title: p.title || (p.data?.title as string) || '',
      ...(p.data || {}),
    })),
    exerciseCount: exercisesRes.count ?? 0,
    content,
  };
}
