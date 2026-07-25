/**
 * Supabase client — docs/mobile/01-architecture.md + contracts/env-vars.md
 * Auth storage: AsyncStorage (JWT SecureStore 2KB limit’i aşabilir).
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';

import { env, isSupabaseConfigured } from '@/config/env';

export const supabase: SupabaseClient | null = isSupabaseConfigured
  ? createClient(env.supabaseUrl, env.supabaseAnonKey, {
      auth: {
        storage: AsyncStorage,
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: false,
      },
    })
  : null;

export function requireSupabase() {
  if (!supabase) throw new Error('Supabase yapılandırılmadı. EXPO_PUBLIC_SUPABASE_* kontrol edin.');
  return supabase;
}
