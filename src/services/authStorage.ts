import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

const REMEMBER_KEY = 'nf-remember-me';

/** "Beni hatırla" kapalıyken oturum — cold start'ta silinir (web sessionStorage eşdeğeri). */
const memoryStore = new Map<string, string>();

/** Native AsyncStorage çökerse (yanlış sürüm / web) localStorage veya bellek. */
const webStore =
  Platform.OS === 'web' && typeof globalThis !== 'undefined' && 'localStorage' in globalThis
    ? globalThis.localStorage
    : null;

let rememberCached: boolean | null = null;
let nativeBroken = false;

function supabaseAuthKeys(keys: readonly string[]): string[] {
  return keys.filter((key) => key.startsWith('sb-') && key.includes('auth-token'));
}

async function storageGet(key: string): Promise<string | null> {
  if (!nativeBroken) {
    try {
      return await AsyncStorage.getItem(key);
    } catch {
      nativeBroken = true;
    }
  }
  if (webStore) return webStore.getItem(key);
  return memoryStore.has(key) ? memoryStore.get(key)! : null;
}

async function storageSet(key: string, value: string): Promise<void> {
  if (!nativeBroken) {
    try {
      await AsyncStorage.setItem(key, value);
      return;
    } catch {
      nativeBroken = true;
    }
  }
  if (webStore) {
    webStore.setItem(key, value);
    return;
  }
  memoryStore.set(key, value);
}

async function storageRemove(key: string): Promise<void> {
  if (!nativeBroken) {
    try {
      await AsyncStorage.removeItem(key);
      return;
    } catch {
      nativeBroken = true;
    }
  }
  if (webStore) webStore.removeItem(key);
  memoryStore.delete(key);
}

async function storageGetAllKeys(): Promise<readonly string[]> {
  if (!nativeBroken) {
    try {
      return await AsyncStorage.getAllKeys();
    } catch {
      nativeBroken = true;
    }
  }
  if (webStore) {
    const keys: string[] = [];
    for (let i = 0; i < webStore.length; i += 1) {
      const key = webStore.key(i);
      if (key) keys.push(key);
    }
    return keys;
  }
  return [...memoryStore.keys()];
}

/** Senkron okuma — cache yoksa kalıcı oturum varsay (web localStorage default yolu). */
export function getRememberMe(): boolean {
  if (rememberCached === null) return true;
  return rememberCached;
}

export async function loadRememberMePreference(): Promise<boolean> {
  try {
    const value = await storageGet(REMEMBER_KEY);
    rememberCached = value === '1';
  } catch {
    rememberCached = true;
  }
  return getRememberMe();
}

async function removeKeys(keys: string[]): Promise<void> {
  await Promise.all(keys.map((key) => storageRemove(key)));
}

export async function setRememberMe(remember: boolean): Promise<void> {
  rememberCached = remember;
  if (remember) {
    await storageSet(REMEMBER_KEY, '1');
    return;
  }
  await storageRemove(REMEMBER_KEY);
  const keys = await storageGetAllKeys();
  await removeKeys(supabaseAuthKeys(keys));
}

export async function clearAllAuthTokens(): Promise<void> {
  memoryStore.clear();
  const keys = await storageGetAllKeys();
  await removeKeys(supabaseAuthKeys(keys));
}

/** Supabase auth için React Native depolama adaptörü (remember-me dual store). */
export const authStorage = {
  async getItem(key: string) {
    if (getRememberMe()) {
      return storageGet(key);
    }
    return memoryStore.has(key) ? memoryStore.get(key)! : null;
  },
  async setItem(key: string, value: string) {
    if (getRememberMe()) {
      memoryStore.delete(key);
      await storageSet(key, value);
      return;
    }
    await storageRemove(key);
    memoryStore.set(key, value);
  },
  async removeItem(key: string) {
    memoryStore.delete(key);
    await storageRemove(key);
  },
};
