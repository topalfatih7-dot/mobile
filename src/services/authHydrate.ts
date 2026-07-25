/**
 * Session → role — 05-auth-onboarding + login.md roleForUser eşdeğeri.
 */
import { env } from '@/config/env';
import { rowToMember, rowToStaff } from '@/services/mappers';
import { requireSupabase, supabase } from '@/services/supabase';
import { hasRegisteredMember } from '@/utils/memberProfile';

export type SessionRole = 'member' | 'staff' | 'admin';

export type HydratedAuth = {
  userId: string;
  email: string;
  role: SessionRole;
  member: Record<string, unknown> | null;
  staff: Record<string, unknown> | null;
  registeredMember: boolean;
};

export async function hydrateAuth(): Promise<HydratedAuth | null> {
  if (!supabase) return null;
  const client = requireSupabase();
  const { data: sessionData } = await client.auth.getSession();
  const session = sessionData.session;
  if (!session?.user) return null;

  const userId = session.user.id;
  const email = (session.user.email || '').toLowerCase();

  if (email && email === env.adminEmail) {
    return {
      userId,
      email,
      role: 'admin',
      member: null,
      staff: null,
      registeredMember: true,
    };
  }

  const [staffRes, memberRes] = await Promise.all([
    client.from('staff').select('*').eq('id', userId).maybeSingle(),
    client.from('members').select('*').eq('id', userId).maybeSingle(),
  ]);

  if (staffRes.data) {
    return {
      userId,
      email,
      role: 'staff',
      member: null,
      staff: rowToStaff(staffRes.data as Record<string, unknown>),
      registeredMember: true,
    };
  }

  const member = memberRes.data
    ? rowToMember(memberRes.data as Record<string, unknown>)
    : null;
  return {
    userId,
    email,
    role: 'member',
    member,
    staff: null,
    registeredMember: hasRegisteredMember(member),
  };
}

/** login.md redirect — member default /profile */
export function routeForHydrated(auth: HydratedAuth): string {
  if (auth.role === 'admin') return '/(admin)';
  if (auth.role === 'staff') return '/(staff)';
  if (!auth.registeredMember) return '/(auth)/onboarding';
  return '/(member)/dashboard';
}
