#!/usr/bin/env node
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const NPX = '/Users/mac/.npm/_npx/e25a38a8cc65d08e/node_modules';
const requireFromNpx = createRequire(path.join(NPX, 'eas-cli/package.json'));
const apple = requireFromNpx('@expo/apple-utils');

const BUNDLE_ID = 'com.yeniform.app';
const BUILD_NUMBER = '7';
const ACCOUNT = 'yeniforms-team';
const SCREEN_DIR = path.join(ROOT, 'assets/store/ios-phone');
const NOTES = `Yeni Form is the iOS companion of yeniform.com (Guideline 3.1.3(f)). Digital membership is not sold in the App Store. There is no purchase button, external checkout CTA, Payment Management, or StoreKit. Membership purchased on the web opens with email/password. Stripe cancel/card is not in iOS.

1:1 coach, dietitian, or doctor video sessions use Daily.co WebRTC. UIBackgroundModes voip + audio are only so session audio can continue briefly in background. There is no PushKit incoming call; the user joins from the calendar. Camera is off in background on iOS.

Account deletion: Profile → Delete my account → https://www.yeniform.com/hesap-silme (starts in-app).

Privacy: https://www.yeniform.com/legal/gizlilik-politikasi
Terms: https://www.yeniform.com/legal/uyelik-ve-abonelik-sozlesmesi
Health disclaimer: https://www.yeniform.com/legal/saglik-sorumluluk-reddi

Login: email/password only. No social login.
Demo account is in the demo username/password fields. Please do not change the password during review.
If no live session is scheduled: join window is coach 10 minutes before / 20 minutes after; token only when status is scheduled.`;

function loadExpoSession() {
  const j = JSON.parse(fs.readFileSync(path.join(os.homedir(), '.expo/state.json'), 'utf8'));
  const secret = j?.auth?.sessionSecret;
  if (!secret) throw new Error('No Expo session');
  return secret;
}

async function expoGql(sessionSecret, query, variables = {}) {
  const res = await fetch('https://api.expo.dev/graphql', {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'expo-session': sessionSecret },
    body: JSON.stringify({ query, variables }),
  });
  const json = await res.json();
  if (json.errors?.length) throw new Error(json.errors.map((e) => e.message).join('; '));
  return json.data;
}

async function loadAscKey(sessionSecret) {
  const data = await expoGql(
    sessionSecret,
    `query ($accountName: String!) {
      account { byName(accountName: $accountName) {
        appStoreConnectApiKeysPaginated(first: 5) { edges { node { id } } }
      } }
    }`,
    { accountName: ACCOUNT }
  );
  const id = data.account.byName.appStoreConnectApiKeysPaginated.edges[0].node.id;
  const full = await expoGql(
    sessionSecret,
    `query ($id: ID!) { appStoreConnectApiKey { byId(id: $id) { issuerIdentifier keyIdentifier keyP8 } } }`,
    { id }
  );
  const k = full.appStoreConnectApiKey.byId;
  return { issuerId: k.issuerIdentifier, keyId: k.keyIdentifier, keyP8: k.keyP8 };
}

async function main() {
  const blockers = [];
  const key = await loadAscKey(loadExpoSession());
  const ctx = {
    token: new apple.Token({
      key: key.keyP8,
      issuerId: key.issuerId,
      keyId: key.keyId,
      duration: 1100,
    }),
  };
  const app = await apple.App.findAsync(ctx, { bundleId: BUNDLE_ID });
  console.log('App', app.id, app.attributes.name);

  const versions = await app.getAppStoreVersionsAsync({ query: { limit: 10 } });
  const version = versions[0];
  console.log('Version', version.attributes.versionString, version.attributes.appVersionState);

  const builds = await apple.Build.getAsync(ctx, {
    query: { filter: { app: app.id, version: BUILD_NUMBER }, limit: 10 },
  });
  const match = builds.find((b) => b.attributes.processingState === 'VALID' && !b.attributes.expired);
  if (!match) blockers.push(`Build ${BUILD_NUMBER} not processed`);
  else {
    await version.updateBuildAsync({ buildId: match.id });
    console.log('Attached build', match.id, 'processing', match.attributes.processingState);
    try {
      await match.updateAsync({ usesNonExemptEncryption: false });
      console.log('Export compliance set');
    } catch (e) {
      console.log('Export compliance:', e.message.split('\n')[0]);
    }
  }

  const files = [
    '01-panel-saglik-skoru.png',
    '02-panel-takip.png',
    '03-programlarim.png',
    '04-program-takvimi.png',
    '05-hareket-kutuphanesi.png',
    '06-kalori.png',
  ].map((f) => path.join(SCREEN_DIR, f));

  try {
    const locs = await version.getLocalizationsAsync();
    const loc = locs.find((l) => l.attributes.locale.startsWith('tr')) || locs[0];
    console.log('Locale', loc.attributes.locale);
    let sets = await loc.getAppScreenshotSetsAsync();
    console.log('Sets', sets.map((s) => s.attributes.screenshotDisplayType));
    let set = sets.find((s) =>
      ['APP_IPHONE_67', 'APP_IPHONE_65', 'APP_IPHONE_69'].includes(s.attributes.screenshotDisplayType)
    );
    if (!set) {
      for (const t of [apple.ScreenshotDisplayType.APP_IPHONE_67, apple.ScreenshotDisplayType.APP_IPHONE_65]) {
        try {
          set = await loc.createAppScreenshotSetAsync({ screenshotDisplayType: t });
          console.log('Created set', t);
          break;
        } catch (e) {
          console.log('create set failed', t, e.message.split('\n')[0]);
        }
      }
    }
    if (!set) throw new Error('No iPhone screenshot set');
    const detailed = await apple.AppScreenshotSet.infoAsync(ctx, {
      id: set.id,
      query: { includes: ['appScreenshots'] },
    });
    const current = detailed.appScreenshots || [];
    console.log('Existing screenshots', current.length, set.attributes.screenshotDisplayType);
    if (current.length < 6) {
      for (const s of current) {
        try { await s.deleteAsync(); } catch {}
      }
      for (let i = 0; i < files.length; i++) {
        console.log('Upload', path.basename(files[i]));
        await set.uploadScreenshot({
          filePath: files[i],
          waitForProcessing: true,
          position: i,
        });
      }
    }
    console.log('Screenshots OK');
  } catch (e) {
    blockers.push('screenshots: ' + e.message.split('\n')[0]);
    console.log('Screenshot error', e.message);
  }

  try {
    const attrs = {
      contactFirstName: 'Mehmet',
      contactLastName: 'Sari',
      contactEmail: 'admin@yeniform.com',
      notes: NOTES,
      demoAccountRequired: true,
    };
    let existing = null;
    if (typeof version.getReviewDetailAsync === 'function') {
      existing = await version.getReviewDetailAsync();
    }
    if (existing) {
      if (existing.attributes.contactPhone) attrs.contactPhone = existing.attributes.contactPhone;
      await existing.updateAsync(attrs);
      if (!existing.attributes.demoAccountName) blockers.push('Demo account not set');
      console.log('Review updated');
    } else {
      await version.createReviewDetailAsync(attrs);
      blockers.push('Demo account not set');
      console.log('Review created');
    }
  } catch (e) {
    blockers.push('review: ' + e.message.split('\n')[0]);
    console.log('Review error', e.message);
  }

  try {
    const cats = [
      apple.AppDataUsageCategoryId.NAME,
      apple.AppDataUsageCategoryId.EMAIL_ADDRESS,
      apple.AppDataUsageCategoryId.PHONE_NUMBER,
      apple.AppDataUsageCategoryId.USER_ID,
      apple.AppDataUsageCategoryId.DEVICE_ID,
      apple.AppDataUsageCategoryId.HEALTH,
      apple.AppDataUsageCategoryId.FITNESS,
      apple.AppDataUsageCategoryId.PHOTOS_OR_VIDEOS,
      apple.AppDataUsageCategoryId.AUDIO,
      apple.AppDataUsageCategoryId.OTHER_USER_CONTENT,
    ];
    for (const cat of cats) {
      try {
        await app.createAppDataUsageAsync({
          appDataUsageCategory: cat,
          appDataUsageProtection: apple.AppDataUsageDataProtectionId.DATA_LINKED_TO_YOU,
          appDataUsagePurpose: apple.AppDataUsagePurposeId.APP_FUNCTIONALITY,
        });
        console.log('Privacy +', cat);
      } catch (e) {
        console.log('Privacy skip', cat, e.message.split('\n')[0]);
      }
    }
  } catch (e) {
    blockers.push('privacy: ' + e.message.split('\n')[0]);
  }

  console.log('\n=== BLOCKERS ===\n' + (blockers.length ? blockers.join('\n') : 'none'));
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
