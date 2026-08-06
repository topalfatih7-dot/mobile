/**
 * RevenueCat IAP — docs/mobile/04-payments-iap.md
 * UI_ONLY_MODE: satın alma yok.
 * react-native-purchases lazy — Expo Go’da native yoksa crash etmez.
 */
import { Platform } from 'react-native';

import { env } from '@/config/env';
import { isUiOnly } from '@/config/runtime';

let configured = false;
let configuredUserId: string | null = null;
let purchasesUnavailable = false;

type PurchasesMod = typeof import('react-native-purchases');
type PurchasesPackage = import('react-native-purchases').PurchasesPackage;

export type SellablePlanId =
  | 'eko_diyet'
  | 'eko_spor'
  | 'diyet'
  | 'spor'
  | 'doktor'
  | 'vip';

export type IapPackage = {
  identifier: string;
  productId: string;
  planId: SellablePlanId;
  durationMonths: 0 | 1 | 3 | 6;
  priceString: string;
  title: string;
  description: string;
};

type IapResult = { ok: true } | { ok: false; error: string; cancelled?: boolean };

const PLAN_ORDER: SellablePlanId[] = [
  'eko_diyet',
  'eko_spor',
  'diyet',
  'spor',
  'doktor',
  'vip',
];

/** `yf_eko_diyet_1m` | `yf_doktor_once` → plan + süre */
export function parseStoreProductId(
  productId: string,
): { planId: SellablePlanId; durationMonths: 0 | 1 | 3 | 6 } | null {
  const doctor = productId === 'yf_doktor_once';
  if (doctor) return { planId: 'doktor', durationMonths: 0 };

  const subscription =
    /^yf_(eko_diyet|eko_spor|diyet|spor|vip)_(1|3|6)m$/.exec(productId);
  if (!subscription) return null;
  return {
    planId: subscription[1] as SellablePlanId,
    durationMonths: Number(subscription[2]) as 1 | 3 | 6,
  };
}

function apiKeyForPlatform(): string {
  if (Platform.OS === 'ios') return env.revenueCatIosKey;
  if (Platform.OS === 'android') return env.revenueCatAndroidKey;
  return '';
}

/** Public: payments UX — key yok / native yok ayrımı. */
export function getIapConfigStatus(): {
  ready: boolean;
  reason?: 'ui_only' | 'no_key' | 'native_unavailable';
} {
  if (isUiOnly()) return { ready: false, reason: 'ui_only' };
  if (purchasesUnavailable) return { ready: false, reason: 'native_unavailable' };
  if (!apiKeyForPlatform()) return { ready: false, reason: 'no_key' };
  return { ready: true };
}

function packageDetails(pkg: PurchasesPackage): IapPackage | null {
  const productId = pkg.product.identifier;
  const parsed = parseStoreProductId(productId);
  if (!parsed) return null;

  return {
    identifier: pkg.identifier,
    productId,
    planId: parsed.planId,
    durationMonths: parsed.durationMonths,
    priceString: pkg.product.priceString,
    title: pkg.product.title,
    description: pkg.product.description,
  };
}

function errorMessage(error: unknown, fallback: string): string {
  const err = error as { message?: string };
  return String(err?.message || fallback);
}

async function loadPurchases(): Promise<PurchasesMod | null> {
  if (purchasesUnavailable) return null;
  try {
    return await import('react-native-purchases');
  } catch {
    purchasesUnavailable = true;
    return null;
  }
}

export async function configureIap(appUserId?: string | null): Promise<boolean> {
  if (isUiOnly() || purchasesUnavailable) return false;
  const apiKey = apiKeyForPlatform();
  if (!apiKey) return false;

  const PurchasesMod = await loadPurchases();
  if (!PurchasesMod) return false;

  try {
    const { default: Purchases, LOG_LEVEL } = PurchasesMod;
    if (!configured) {
      Purchases.setLogLevel(__DEV__ ? LOG_LEVEL.DEBUG : LOG_LEVEL.INFO);
      Purchases.configure({
        apiKey,
        appUserID: appUserId || undefined,
        preferredUILocaleOverride: 'tr-TR',
      });
      configured = true;
      configuredUserId = appUserId || null;
    } else if (appUserId && configuredUserId !== appUserId) {
      await Purchases.logIn(appUserId);
      configuredUserId = appUserId;
    }
    return true;
  } catch {
    return false;
  }
}

export async function getAvailablePackages(
  appUserId: string,
): Promise<{ ok: true; packages: IapPackage[] } | { ok: false; error: string }> {
  if (isUiOnly()) return { ok: false, error: 'Satın alma demo modda kapalı.' };
  const status = getIapConfigStatus();
  if (status.reason === 'no_key') {
    return {
      ok: false,
      error:
        'Mağaza ödemesi henüz yapılandırılmadı (RevenueCat anahtarı yok). Web’den aldığın üyelik girişle görünür; mobil satın alma P0 sonrası açılır.',
    };
  }
  if (!(await configureIap(appUserId))) {
    return {
      ok: false,
      error:
        status.reason === 'native_unavailable'
          ? 'Satın alma bu ortamda kullanılamıyor. Development build / TestFlight gerekir.'
          : 'RevenueCat yapılandırılmadı.',
    };
  }

  try {
    const PurchasesMod = await loadPurchases();
    if (!PurchasesMod) {
      return {
        ok: false,
        error: 'Satın alma bu ortamda kullanılamıyor. Development build / TestFlight gerekir.',
      };
    }
    const offerings = await PurchasesMod.default.getOfferings();
    const packages = (offerings.current?.availablePackages || [])
      .map(packageDetails)
      .filter((pkg): pkg is IapPackage => Boolean(pkg))
      .sort((a, b) => {
        const planDiff = PLAN_ORDER.indexOf(a.planId) - PLAN_ORDER.indexOf(b.planId);
        return planDiff || a.durationMonths - b.durationMonths;
      });
    return { ok: true, packages };
  } catch (error: unknown) {
    return { ok: false, error: errorMessage(error, 'Paketler yüklenemedi.') };
  }
}

export async function purchasePackage(
  packageIdentifier: string,
  appUserId: string,
): Promise<IapResult> {
  if (isUiOnly()) {
    return { ok: false, error: 'Satın alma demo modda kapalı.' };
  }

  if (!(await configureIap(appUserId))) {
    return {
      ok: false,
      error: getIapConfigStatus().reason === 'no_key'
        ? 'Mağaza ödemesi henüz yapılandırılmadı.'
        : 'RevenueCat yapılandırılmadı.',
    };
  }

  try {
    const PurchasesMod = await loadPurchases();
    if (!PurchasesMod) return { ok: false, error: 'IAP native modülü yok.' };
    const Purchases = PurchasesMod.default;
    const offerings = await Purchases.getOfferings();
    const current = offerings.current;
    if (!current) return { ok: false, error: 'Aktif paket bulunamadı.' };

    const pkg = current.availablePackages.find((p) => p.identifier === packageIdentifier) || null;
    if (!pkg) return { ok: false, error: 'Ürün bulunamadı.' };

    await Purchases.purchasePackage(pkg);
    return { ok: true };
  } catch (e: unknown) {
    const err = e as { userCancelled?: boolean; message?: string };
    if (err?.userCancelled) return { ok: false, error: 'İptal edildi.', cancelled: true };
    return { ok: false, error: String(err?.message || 'Satın alma başarısız.') };
  }
}

export async function restorePurchases(appUserId: string): Promise<IapResult> {
  if (isUiOnly()) return { ok: false, error: 'Satın alma demo modda kapalı.' };
  if (!(await configureIap(appUserId))) {
    return {
      ok: false,
      error: getIapConfigStatus().reason === 'no_key'
        ? 'Mağaza ödemesi henüz yapılandırılmadı. Web üyeliğin girişle zaten görünür.'
        : 'RevenueCat yapılandırılmadı.',
    };
  }
  try {
    const PurchasesMod = await loadPurchases();
    if (!PurchasesMod) return { ok: false, error: 'IAP native modülü yok.' };
    await PurchasesMod.default.restorePurchases();
    return { ok: true };
  } catch (e: unknown) {
    const err = e as { message?: string };
    return { ok: false, error: String(err?.message || 'Geri yükleme başarısız.') };
  }
}

export async function openCustomerCenter(appUserId: string): Promise<IapResult> {
  if (isUiOnly()) return { ok: false, error: 'Abonelik yönetimi demo modda kapalı.' };
  if (!(await configureIap(appUserId))) {
    return {
      ok: false,
      error: getIapConfigStatus().reason === 'no_key'
        ? 'Mağaza abonelik yönetimi henüz yapılandırılmadı.'
        : 'RevenueCat yapılandırılmadı.',
    };
  }

  try {
    const { default: RevenueCatUI } = await import('react-native-purchases-ui');
    await RevenueCatUI.presentCustomerCenter();
    return { ok: true };
  } catch (error: unknown) {
    return { ok: false, error: errorMessage(error, 'Abonelik yönetimi açılamadı.') };
  }
}
