/**
 * Daily görüntülü seans: Android 14+ arka plan kamera/mikrofon FGS.
 * Expo managed — native AndroidManifest’e servis yazılır (prebuild / EAS).
 */
const { withAndroidManifest } = require('expo/config-plugins');

const SERVICE = 'com.daily.reactlibrary.DailyOngoingMeetingForegroundService';

function withDailyForegroundService(config) {
  return withAndroidManifest(config, (mod) => {
    const application = mod.modResults.manifest.application?.[0];
    if (!application) return mod;
    application.service = application.service || [];
    const exists = application.service.some((s) => s.$?.['android:name'] === SERVICE);
    if (!exists) {
      application.service.push({
        $: {
          'android:name': SERVICE,
          'android:exported': 'false',
          'android:foregroundServiceType': 'camera|microphone',
        },
      });
    }
    return mod;
  });
}

module.exports = withDailyForegroundService;
