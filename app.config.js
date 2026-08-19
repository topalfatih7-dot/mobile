/**
 * Expo config — preview/production: com.yeniform.app (standalone, Metro yok).
 * Dev client: com.yeniform.app.dev (yalnızca expo start ile).
 * https://docs.expo.dev/build-reference/variants/
 */
const fs = require('fs');
const path = require('path');

const appJson = require('./app.json');

function isDevVariant() {
  const variant = String(process.env.APP_VARIANT || '').trim();
  const profile = String(process.env.EAS_BUILD_PROFILE || '').trim();
  return (
    variant === 'development' ||
    profile === 'development' ||
    profile === 'development-device'
  );
}

function mapPlugins(plugins, isDev) {
  return (plugins || []).map((plugin) => {
    const name = Array.isArray(plugin) ? plugin[0] : plugin;
    if (name === 'expo-dev-client') {
      return ['expo-dev-client', { addGeneratedScheme: isDev }];
    }
    return plugin;
  });
}

module.exports = () => {
  const expo = { ...(appJson.expo || {}) };
  const isDev = isDevVariant();
  const googleServicesPath = path.join(__dirname, 'google-services.json');
  const googleServicesIosPath = path.join(__dirname, 'GoogleService-Info.plist');
  const hasGoogleServices = fs.existsSync(googleServicesPath);
  const hasGoogleServicesIos = fs.existsSync(googleServicesIosPath);

  const { splash: _splash, ...rest } = expo;
  const android = { ...(rest.android || {}) };
  const ios = { ...(rest.ios || {}) };

  delete android.versionCode;
  delete ios.buildNumber;

  if (isDev) {
    android.package = 'com.yeniform.app.dev';
    ios.bundleIdentifier = 'com.yeniform.app.dev';
    delete android.googleServicesFile;
    delete ios.googleServicesFile;
  } else {
    android.package = 'com.yeniform.app';
    ios.bundleIdentifier = 'com.yeniform.app';
    if (hasGoogleServices) {
      android.googleServicesFile = './google-services.json';
    } else {
      delete android.googleServicesFile;
    }
    if (hasGoogleServicesIos) {
      ios.googleServicesFile = './GoogleService-Info.plist';
    } else {
      delete ios.googleServicesFile;
    }
  }

  return {
    ...rest,
    name: isDev ? 'Yeni Form (Dev)' : 'Yeni Form',
    android,
    ios,
    plugins: mapPlugins(rest.plugins, isDev),
  };
};
