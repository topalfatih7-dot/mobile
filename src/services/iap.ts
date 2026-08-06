/**
 * RevenueCat IAP — docs/mobile/04-payments-iap.md
 * UI_ONLY_MODE: satın alma yok.
 * react-native-purchases lazy — Expo Go’da native yoksa crash etmez.
 */
import { NativeModules, Platform } from 'react-native';

import { env } from '@/config/env';
import { isUiOnly } from '@/config/runtime';

type CustomerInfo = import('react-native-purchases').CustomerInfo;

let configured = false;
let configuredUserId: string | null = null;
let purchasesUnavailable = false;

/** JS API yüklü olsa bile native bridge yoksa (Expo Go / eski binary) false. */
function hasPurchasesNativeModule(): boolean {
  return Boolean(NativeModules.RNPurchases);
}

type PurchasesMod = typeof import('react-native-purchases');
type PurchasesPackage = import('react-native-purchases').PurchasesPackage;

export type SellablePlanId =
  | 'eko_diyet'
  | 'eko_spor'
  | 'diyet'
  | 'spor'
  | 'doktor'
  | 'vip'
  | 'lifetime'
  | 'yearly'
  | 'monthly';

export const ENTITLEMENT_PRO = 'Yeniform Pro';

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

function markPurchasesUnavailable(): null {
  purchasesUnavailable = true;
  configured = false;
  configuredUserId = null;
  return null;
}

/** JS bundle yüklenebilir; native yoksa `RNPurchases` null — setLogLevel unhandled reject verir. */
async function loadPurchases(): Promise<PurchasesMod | null> {
  if (purchasesUnavailable) return null;
  if (!hasPurchasesNativeModule()) {
    return markPurchasesUnavailable();
  }
  try {
    const mod = await import('react-native-purchases');
    const Purchases = mod?.default;
    if (!Purchases || typeof Purchases.configure !== 'function') {
      return markPurchasesUnavailable();
    }
    return mod;
  } catch {
    return markPurchasesUnavailable();
  }
}

export async function configureIap(appUserId?: string | null): Promise<boolean> {
  if (isUiOnly() || purchasesUnavailable) return false;
  const apiKey = apiKeyForPlatform();
  if (!apiKey) return false;

  const PurchasesMod = await loadPurchases();
  if (!PurchasesMod) return false;

  try {
    const Purchases = PurchasesMod.default;
    // Native bridge bazen RNPurchases gösterirken JS default null kalır (Expo Go / bozuk binary)
    if (!Purchases || typeof Purchases.configure !== 'function') {
      markPurchasesUnavailable();
      return false;
    }
    if (!configured) {
      const { LOG_LEVEL } = PurchasesMod;
      // Kökte optional chain zorunlu: `Purchases.setLogLevel?.` Purchases=null iken yine throw eder
      if (LOG_LEVEL && typeof Purchases?.setLogLevel === 'function') {
        try {
          await Purchases.setLogLevel(__DEV__ ? LOG_LEVEL.DEBUG : LOG_LEVEL.INFO);
        } catch {
          // log seviyesi opsiyonel — native hata satın almayı engellemesin
        }
      }
      Purchases.configure({
        apiKey,
        appUserID: appUserId || undefined,
        preferredUILocaleOverride: 'tr-TR',
      });
      configured = true;
      configuredUserId = appUserId || null;
    } else if (appUserId && configuredUserId !== appUserId) {
      if (typeof Purchases?.logIn === 'function') {
        await Purchases.logIn(appUserId);
        configuredUserId = appUserId;
      }
    }
    return true;
  } catch {
    markPurchasesUnavailable();
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
    const after = getIapConfigStatus();
    return {
      ok: false,
      error:
        after.reason === 'native_unavailable' || status.reason === 'native_unavailable'
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

export async function checkEntitlement(userId: string): Promise<{
  active: boolean;
  productId?: string;
  expiresAt?: string;
}> {
  if (!(await configureIap(userId))) return { active: false };
  try {
    const PurchasesMod = await loadPurchases();
    if (!PurchasesMod) return { active: false };
    const customerInfo = await PurchasesMod.default.getCustomerInfo();
    const entitlement = customerInfo.entitlements.active[ENTITLEMENT_PRO];
    if (!entitlement) return { active: false };
    return {
      active: true,
      productId: entitlement.productIdentifier,
      expiresAt: entitlement.expirationDate ?? undefined,
    };
  } catch {
    return { active: false };
  }
}

export async function getCustomerInfo(
  userId: string,
): Promise<{ ok: true; info: CustomerInfo } | { ok: false; error: string }> {
  if (isUiOnly()) return { ok: false, error: 'Demo modda kullanılamaz.' };
  if (!(await configureIap(userId))) {
    return {
      ok: false,
      error: getIapConfigStatus().reason === 'no_key'
        ? 'RevenueCat anahtarı yapılandırılmadı.'
        : 'RevenueCat yapılandırılmadı.',
    };
  }
  try {
    const PurchasesMod = await loadPurchases();
    if (!PurchasesMod) return { ok: false, error: 'IAP native modülü yok.' };
    const info = await PurchasesMod.default.getCustomerInfo();
    return { ok: true, info };
  } catch (error: unknown) {
    return { ok: false, error: errorMessage(error, 'Müşteri bilgisi alınamadı.') };
  }
}

export async function presentPaywall(
  userId: string,
  offeringIdentifier?: string,
): Promise<{ ok: true; purchased: boolean } | { ok: false; error: string }> {
  if (isUiOnly()) return { ok: false, error: 'Satın alma demo modda kapalı.' };
  if (!(await configureIap(userId))) {
    return {
      ok: false,
      error: getIapConfigStatus().reason === 'no_key'
        ? 'Mağaza ödemesi henüz yapılandırılmadı.'
        : 'RevenueCat yapılandırılmadı.',
    };
  }
  try {
    const { default: RevenueCatUI } = await import('react-native-purchases-ui');
    let offering: import('react-native-purchases').PurchasesOffering | undefined;
    if (offeringIdentifier) {
      const PurchasesMod = await loadPurchases();
      if (PurchasesMod) {
        const offerings = await PurchasesMod.default.getOfferings();
        offering = offerings.all[offeringIdentifier] ?? undefined;
      }
    }
    const result = await RevenueCatUI.presentPaywall(offering ? { offering } : undefined);
    const purchased =
      result === 'PURCHASED' ||
      result === 'RESTORED' ||
      (typeof result === 'object' && result !== null && 'customerInfo' in result);
    return { ok: true, purchased };
  } catch (error: unknown) {
    return { ok: false, error: errorMessage(error, 'Ödeme ekranı açılamadı.') };
  }
}

export async function syncSubscription(userId: string): Promise<void> {
  if (!(await configureIap(userId))) return;
  try {
    const PurchasesMod = await loadPurchases();
    if (PurchasesMod) await PurchasesMod.default.syncPurchases();
  } catch {
    // silent — arka planda senkron
  }
}
