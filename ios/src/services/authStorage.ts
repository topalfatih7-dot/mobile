import AsyncStorage from '@react-native-async-storage/async-storage';

const REMEMBER_KEY = 'yeniform.rememberMe';

export async function getRememberMe(): Promise<boolean> {
  try {
    const v = await AsyncStorage.getItem(REMEMBER_KEY);
    if (v === null) return true;
    return v === '1';
  } catch {
    return true;
  }
}

export async function setRememberMe(remember: boolean): Promise<void> {
  await AsyncStorage.setItem(REMEMBER_KEY, remember ? '1' : '0');
}
