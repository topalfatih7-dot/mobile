/**
 * UI-only demo oturum kalıcılığı — AsyncStorage.
 * Gerçek auth SecureStore / Supabase session kullanır.
 */
import AsyncStorage from '@react-native-async-storage/async-storage';

import type { HydratedAuth } from '@/services/authHydrate';

const KEY = 'yf.ui_only.demo_auth.v1';

export async function loadDemoAuth(): Promise<HydratedAuth | null> {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as HydratedAuth;
    if (!parsed?.userId || !parsed?.role) return null;
    return parsed;
  } catch {
    return null;
  }
}

export async function saveDemoAuth(auth: HydratedAuth | null): Promise<void> {
  try {
    if (!auth) {
      await AsyncStorage.removeItem(KEY);
      return;
    }
    await AsyncStorage.setItem(KEY, JSON.stringify(auth));
  } catch {
    /* ignore */
  }
}

export async function clearDemoAuth(): Promise<void> {
  await saveDemoAuth(null);
}
