import { createClient, type SupabaseClient } from '@supabase/supabase-js';

import { env, isSupabaseConfigured } from '@/config/env';

import { authStorage } from './authStorage';

export const isSupabaseEnabled = isSupabaseConfigured;

export const supabase: SupabaseClient | null = isSupabaseConfigured
  ? createClient(env.supabaseUrl, env.supabaseAnonKey, {
      auth: {
        storage: authStorage,
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: false,
        flowType: 'pkce',
      },
    })
  : null;

/** Oturum yenilemeyi aç/kapat — Adım 3 auth akışında kullanılacak. */
export function syncAutoRefresh(remember: boolean): void {
  if (!supabase) return;
  if (remember) supabase.auth.startAutoRefresh();
  else supabase.auth.stopAutoRefresh();
}
