import AsyncStorage from '@react-native-async-storage/async-storage';

const REMEMBER_KEY = 'nf-remember-me';

function supabaseAuthKeys(keys: readonly string[]): string[] {
  return keys.filter((key) => key.startsWith('sb-') && key.includes('auth-token'));
}

export function getRememberMe(): boolean {
  // Senkron okuma gerekmediği için varsayılan true; Adım 3'te login ekranı güncellenecek.
  return true;
}

async function removeKeys(keys: string[]): Promise<void> {
  await Promise.all(keys.map((key) => AsyncStorage.removeItem(key)));
}

export async function setRememberMe(remember: boolean): Promise<void> {
  if (remember) {
    await AsyncStorage.setItem(REMEMBER_KEY, '1');
    return;
  }
  await AsyncStorage.removeItem(REMEMBER_KEY);
  const keys = await AsyncStorage.getAllKeys();
  await removeKeys(supabaseAuthKeys(keys));
}

export async function clearAllAuthTokens(): Promise<void> {
  const keys = await AsyncStorage.getAllKeys();
  await removeKeys(supabaseAuthKeys(keys));
}

/** Supabase auth için React Native depolama adaptörü. */
export const authStorage = {
  getItem(key: string) {
    return AsyncStorage.getItem(key);
  },
  setItem(key: string, value: string) {
    return AsyncStorage.setItem(key, value);
  },
  removeItem(key: string) {
    return AsyncStorage.removeItem(key);
  },
};
