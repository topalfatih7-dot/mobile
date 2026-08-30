/**
 * Android Play hardening (Expo managed / EAS prebuild).
 *
 * 1. Daily in-call FGS: camera + microphone (Home’da görüşme sürsün).
 *    Daily Expo config plugin kullanılmaz (SDK 55 peer, useLegacyPackaging, overlay).
 * 2. @daily-co/react-native-webrtc MediaProjectionService +
 *    FOREGROUND_SERVICE_MEDIA_PROJECTION kaldırılır — ekran paylaşımı yok;
 *    Play bu izni görünce demo video ister ve reddeder.
 * 3. Kamera uses-feature required=false — kamerasız cihaz Play’den elenmesin.
 * 4. expo-notifications BOOT_COMPLETED / REBOOT / QUICKBOOT strip —
 *    Play Android 15 tarayıcısı boot alıcısı + kısıtlı FGS (Daily camera|mic)
 *    görünce işaretler. Receiver yalnız NOTIFICATION_EVENT + MY_PACKAGE_REPLACED.
 * 5. Kullanılmayan expo-audio mediaPlayback/microphone FGS servisleri silinir.
 * 6. application resizeableActivity=true (API 36 büyük ekran).
 */
const { AndroidConfig, withAndroidManifest } = require('expo/config-plugins');

const DAILY_SERVICE = 'com.daily.reactlibrary.DailyOngoingMeetingForegroundService';
const NOTIFICATIONS_RECEIVER = 'expo.modules.notifications.service.NotificationsService';
const AUDIO_FGS_SERVICES = [
  'expo.modules.audio.service.AudioControlsService',
  'expo.modules.audio.service.AudioRecordingService',
];
const BLOCKED_PERMISSIONS = [
  'android.permission.FOREGROUND_SERVICE_MEDIA_PROJECTION',
  'android.permission.RECEIVE_BOOT_COMPLETED',
];

function ensureToolsNamespace(manifest) {
  manifest.$ = manifest.$ || {};
  if (!manifest.$['xmlns:tools']) {
    manifest.$['xmlns:tools'] = 'http://schemas.android.com/tools';
  }
}

function blockPermissions(manifest, names) {
  manifest['uses-permission'] = manifest['uses-permission'] || [];
  for (const name of names) {
    const already = manifest['uses-permission'].some(
      (p) => p.$?.['android:name'] === name && p.$?.['tools:node'] === 'remove',
    );
    if (!already) {
      manifest['uses-permission'].push({
        $: { 'android:name': name, 'tools:node': 'remove' },
      });
    }
  }
}

function ensureOptionalCameraFeatures(manifest) {
  manifest['uses-feature'] = manifest['uses-feature'] || [];
  for (const name of ['android.hardware.camera', 'android.hardware.camera.autofocus']) {
    const existing = manifest['uses-feature'].find((f) => f.$?.['android:name'] === name);
    if (existing) {
      existing.$['android:required'] = 'false';
      existing.$['tools:replace'] = 'android:required';
    } else {
      manifest['uses-feature'].push({
        $: { 'android:name': name, 'android:required': 'false' },
      });
    }
  }
}

function upsertDailyService(application) {
  application.service = application.service || [];
  application.service = application.service.filter((s) => {
    const n = String(s.$?.['android:name'] || '');
    return !n.endsWith('MediaProjectionService') && !AUDIO_FGS_SERVICES.includes(n);
  });
  const existing = application.service.find((s) => s.$?.['android:name'] === DAILY_SERVICE);
  const attrs = {
    'android:name': DAILY_SERVICE,
    'android:exported': 'false',
    'android:foregroundServiceType': 'camera|microphone',
  };
  if (existing) {
    existing.$ = { ...existing.$, ...attrs };
  } else {
    application.service.push({ $: attrs });
  }
}

function replaceNotificationsBootReceiver(application) {
  application.receiver = application.receiver || [];
  application.receiver = application.receiver.filter(
    (r) => r.$?.['android:name'] !== NOTIFICATIONS_RECEIVER,
  );
  application.receiver.push({
    $: {
      'android:name': NOTIFICATIONS_RECEIVER,
      'android:enabled': 'true',
      'android:exported': 'false',
      'tools:node': 'replace',
    },
    'intent-filter': [
      {
        $: { 'android:priority': '-1' },
        action: [
          { $: { 'android:name': 'expo.modules.notifications.NOTIFICATION_EVENT' } },
          { $: { 'android:name': 'android.intent.action.MY_PACKAGE_REPLACED' } },
        ],
      },
    ],
  });
}

function ensureResizable(application) {
  application.$ = application.$ || {};
  application.$['android:resizeableActivity'] = 'true';
}

function withDailyForegroundService(config) {
  config = AndroidConfig.Permissions.withPermissions(config, [
    'android.permission.WAKE_LOCK',
    'android.permission.ACCESS_NETWORK_STATE',
  ]);

  return withAndroidManifest(config, (mod) => {
    const manifest = mod.modResults.manifest;
    if (!manifest) return mod;
    ensureToolsNamespace(manifest);
    blockPermissions(manifest, BLOCKED_PERMISSIONS);
    ensureOptionalCameraFeatures(manifest);
    const application = manifest.application?.[0];
    if (application) {
      upsertDailyService(application);
      replaceNotificationsBootReceiver(application);
      ensureResizable(application);
    }
    return mod;
  });
}

module.exports = withDailyForegroundService;
