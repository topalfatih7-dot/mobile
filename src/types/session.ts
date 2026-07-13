import type { User } from '@supabase/supabase-js';

export type SessionType = 'admin' | 'staff' | 'member';

export type AppSession =
  | { type: 'admin'; memberId: null; email: string }
  | { type: 'staff'; staffId: string | null; email: string }
  | { type: 'member'; memberId: string; email: string };

export type AuthUser = {
  id: string;
  email: string;
  name: string;
  identities?: { provider: string }[];
  app_metadata?: { provider?: string; [key: string]: unknown };
};

export type MemberProfile = {
  id: string;
  email: string;
  name: string;
  phone?: string;
  membership?: string;
  membershipStatus?: string;
  streak?: number;
  goal?: string;
  plan?: string;
  [key: string]: unknown;
};

export type StaffProfile = {
  id: string;
  email: string;
  name: string;
  role: string;
  active?: boolean;
  [key: string]: unknown;
};

export type AuthState = {
  session: AppSession | null;
  authUser: AuthUser | null;
  member: MemberProfile | null;
  staff: StaffProfile | null;
};

export type UserRole = SessionType;

export type SupabaseAuthUser = User;
