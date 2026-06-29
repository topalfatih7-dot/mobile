import { readEnv } from '@/config/envHelpers';

export const ONESIGNAL_CONFIG = {
  appId: readEnv('EXPO_PUBLIC_ONESIGNAL_APP_ID'),
} as const;

export function isOneSignalConfigured() {
  return Boolean(ONESIGNAL_CONFIG.appId);
}

/** OneSignal native SDK dev build gerektirir; Expo Go'da yalnızca expo-notifications kullanılır. */
export async function initOneSignal(_userId?: string): Promise<{ ok: boolean; message?: string }> {
  if (!isOneSignalConfigured()) {
    return { ok: false, message: 'OneSignal App ID tanımlı değil.' };
  }
  return {
    ok: false,
    message:
      'OneSignal için EAS development build gerekir. Şimdilik expo-notifications ile yerel push altyapısı aktif.',
  };
}

export async function setOneSignalExternalUserId(_userId: string) {
  if (!isOneSignalConfigured()) return;
}
