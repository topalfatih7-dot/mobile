/**
 * Plans CRUD — web `supabaseDb.getPlans` / `upsertPlan`.
 */
import { FALLBACK_PLANS, type MembershipPlan } from '@/services/hydrateShared';
import { supabase } from '@/services/supabaseClient';

type PlanRow = {
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
};

export function rowToPlan(row: PlanRow): MembershipPlan {
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

export async function getPlans(activeOnly = true): Promise<MembershipPlan[]> {
  if (!supabase) return FALLBACK_PLANS;
  let q = supabase.from('plans').select('*').order('sort_order', { ascending: true });
  if (activeOnly) q = q.eq('is_active', true);
  const { data, error } = await q;
  if (error || !data?.length) return FALLBACK_PLANS;
  return data.map((row) => rowToPlan(row as PlanRow));
}

export async function upsertPlan(
  plan: Partial<MembershipPlan> & { id: string; name: string },
): Promise<{ success: true } | { success: false; error: string }> {
  if (!supabase) return { success: false, error: 'Supabase bağlantısı yok.' };
  const { error } = await supabase.from('plans').upsert(
    {
      id: plan.id,
      name: plan.name,
      price: plan.price ?? 0,
      period: plan.period || 'ay',
      is_active: plan.isActive !== false,
      badge: plan.badge || null,
      features: plan.features || [],
      limits: plan.limits || [],
      pricing_tiers: plan.pricingTiers || [],
      color: plan.color || 'sage',
      sort_order: plan.sortOrder || 0,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'id' },
  );
  if (error) return { success: false, error: error.message };
  return { success: true };
}
