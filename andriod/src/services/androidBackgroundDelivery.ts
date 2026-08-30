/**
 * OEM (Samsung / Xiaomi / Huawei) arka plan öldürme FCM teslimini keser.
 * Sistem IGNORE_BATTERY_OPTIMIZATIONS listesi yetmez; uygulama ayarındaki
 * “Arka planda otomatik kapat” / Pil kısıtı kapatılmalı.
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';
import { Alert, Linking, Platform } from 'react-native';

import { hasGrantedNotificationPermission } from '@/services/push';

const PROMPT_KEY = 'android_bg_delivery_prompted';
const PROMPT_DELAY_MS = 4500;

let promptTimer: ReturnType<typeof setTimeout> | null = null;

function androidPackageName(): string {
  return String(Constants.expoConfig?.android?.package || 'com.yeniform.app');
}

async function openAppSettings(): Promise<void> {
  try {
    const IntentLauncher = await import('expo-intent-launcher');
    await IntentLauncher.startActivityAsync(
      IntentLauncher.ActivityAction.APPLICATION_DETAILS_SETTINGS,
      { data: `package:${androidPackageName()}` },
    );
  } catch {
    try {
      await Linking.openSettings();
    } catch {
      /* ignore */
    }
  }
}

async function maybePromptAndroidBackgroundDelivery(): Promise<void> {
  if (Platform.OS !== 'android') return;
  if (!(await hasGrantedNotificationPermission())) return;
  try {
    const asked = await AsyncStorage.getItem(PROMPT_KEY);
    if (asked) return;
  } catch {
    return;
  }

  Alert.alert(
    'Arka plan bildirimleri',
    'Bazı telefonlar uygulamayı arka planda kapatınca koç mesajları gelmez. Ayarlar’da Pil veya “Arka planda otomatik kapat” seçeneğini kapatın.',
    [
      {
        text: 'Şimdi Değil',
        style: 'cancel',
        onPress: () => {
          void AsyncStorage.setItem(PROMPT_KEY, 'true');
        },
      },
      {
        text: 'Ayarları Aç',
        onPress: () => {
          void AsyncStorage.setItem(PROMPT_KEY, 'true');
          void openAppSettings();
        },
      },
    ],
  );
}

/** İlk girişte bir kez; bildirim izni Alert’i ile çakışmasın diye gecikmeli. */
export function scheduleAndroidBackgroundDeliveryPrompt() {
  if (Platform.OS !== 'android') return;
  if (promptTimer) clearTimeout(promptTimer);
  promptTimer = setTimeout(() => {
    promptTimer = null;
    void maybePromptAndroidBackgroundDelivery();
  }, PROMPT_DELAY_MS);
}

export function cancelAndroidBackgroundDeliveryPrompt() {
  if (promptTimer) {
    clearTimeout(promptTimer);
    promptTimer = null;
  }
}
