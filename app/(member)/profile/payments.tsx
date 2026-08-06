import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';

import { Button } from '@/components/ui/Button';
import { FadeIn } from '@/components/ui/FadeIn';
import { MeshBackground } from '@/components/ui/MeshBackground';
import { MembershipBadge } from '@/components/home/MembershipBadge';
import { useToast } from '@/context/ToastContext';
import { useAuth } from '@/context/AuthContext';
import { useData, useMember } from '@/context/DataContext';
import { getPlanLabel } from '@/data/membershipPlans';
import { fetchMemberById } from '@/services/memberDb';
import {
  getAvailablePackages,
  getIapConfigStatus,
  openCustomerCenter,
  purchasePackage,
  restorePurchases,
  type IapPackage,
} from '@/services/iap';
import {
  isPackageEntryActive,
  migrateLegacyToPackages,
} from '@/utils/memberPackages';
import { colors, fonts, radius, spacing } from '@/theme';

const ENTITLEMENT_POLL_ATTEMPTS = 8;
const ENTITLEMENT_POLL_DELAY_MS = 1500;

function wait(ms: number) {
  return new Promise<void>((resolve) => setTimeout(resolve, ms));
}

function entitlementSignature(value: Record<string, unknown> | null) {
  if (!value) return '';
  return JSON.stringify({
    membership: value.membership || 'free',
    membershipStatus: value.membershipStatus || 'active',
    premiumExpiresAt: value.premiumExpiresAt || null,
    packages: value.packages || [],
  });
}

/**
 * LOCK: docs/mobile/screens/member/payments.md
 * MOBILE DIFF: RevenueCat tam abonelik işlem geçmişi sağlamadığı için sahte geçmiş yok.
 */
export default function PaymentsScreen() {
  const insets = useSafeAreaInsets();
  const member = useMember();
  const { refreshAuth, userId } = useAuth();
  const { refreshData } = useData();
  const { toast } = useToast();
  const [restoring, setRestoring] = useState(false);
  const [managing, setManaging] = useState(false);
  const [purchasing, setPurchasing] = useState<string | null>(null);
  const [storePackages, setStorePackages] = useState<IapPackage[]>([]);
  const [packagesLoading, setPackagesLoading] = useState(true);
  const [packagesError, setPackagesError] = useState<string | null>(null);

  const membership = String(member?.membership || 'free');
  const status = String(member?.membershipStatus || 'active');
  const expires = member?.premiumExpiresAt ? String(member.premiumExpiresAt) : null;
  const iapStatus = getIapConfigStatus();
  const storeReady = iapStatus.ready;

  const packages = useMemo(
    () =>
      migrateLegacyToPackages(member).filter((p: { status?: string }) =>
        isPackageEntryActive(p),
      ),
    [member],
  );

  useEffect(() => {
    let alive = true;
    if (!userId || !storeReady) {
      setPackagesLoading(false);
      setStorePackages([]);
      setPackagesError(null);
      return;
    }

    setPackagesLoading(true);
    setPackagesError(null);
    void getAvailablePackages(userId).then((result) => {
      if (!alive) return;
      if (result.ok) {
        setStorePackages(result.packages);
        setPackagesError(result.packages.length ? null : 'Mağazada aktif paket bulunamadı.');
      } else {
        setPackagesError(result.error);
      }
      setPackagesLoading(false);
    });

    return () => {
      alive = false;
    };
  }, [userId, storeReady]);

  const pollAuthoritativeEntitlement = async (
    baseline: string,
    expectedPlanId?: IapPackage['planId'],
  ) => {
    if (!userId) return false;
    for (let attempt = 0; attempt < ENTITLEMENT_POLL_ATTEMPTS; attempt += 1) {
      await refreshAuth();
      await refreshData();
      const latest = await fetchMemberById(userId);
      const changed = entitlementSignature(latest) !== baseline;
      const expectedActive =
        !expectedPlanId ||
        latest?.membership === expectedPlanId ||
        migrateLegacyToPackages(latest).some(
          (entry: { planId?: string; status?: string }) =>
            entry.planId === expectedPlanId && isPackageEntryActive(entry),
        );
      if (changed && expectedActive) {
        await refreshAuth();
        await refreshData();
        return true;
      }
      if (attempt < ENTITLEMENT_POLL_ATTEMPTS - 1) {
        await wait(ENTITLEMENT_POLL_DELAY_MS);
      }
    }
    await refreshAuth();
    await refreshData();
    return false;
  };

  const buy = async (pkg: IapPackage) => {
    if (!userId) return;
    const baseline = entitlementSignature(member);
    setPurchasing(pkg.identifier);
    try {
      const result = await purchasePackage(pkg.identifier, userId);
      if (!result.ok) {
        if (!result.cancelled) toast(result.error, 'error');
        return;
      }
      await pollAuthoritativeEntitlement(baseline, pkg.planId);
      toast('Ödeme alındı! Planınız birkaç saniye içinde güncellenecek.', 'success');
    } finally {
      setPurchasing(null);
    }
  };

  return (
    <MeshBackground style={styles.root}>
      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingTop: insets.top + 12, paddingBottom: insets.bottom + 32 },
        ]}>
        <FadeIn>
          <Pressable
            accessibilityLabel="Geri"
            accessibilityRole="button"
            hitSlop={10}
            onPress={() => router.back()}
            style={styles.back}>
            <Ionicons color={colors.brand[600]} name="chevron-back" size={22} />
            <Text style={styles.backText}>Geri</Text>
          </Pressable>
          <Text style={styles.title}>Ödemeler & Üyelik</Text>
          <Text style={styles.sub}>Mevcut planınız ve abonelik yönetimi</Text>
        </FadeIn>

        <FadeIn delay={60}>
          {membership === 'free' ? (
            <View style={styles.heroFree}>
              <MembershipBadge
                status={status !== 'active' ? status : null}
                tier={membership}
              />
              <Text style={styles.planName}>{getPlanLabel(membership)}</Text>
              <Text style={styles.meta}>
                {expires
                  ? `Bitiş: ${format(new Date(expires), 'd MMMM yyyy', { locale: tr })}`
                  : 'Ücretsiz plan'}
              </Text>
            </View>
          ) : (
            <LinearGradient
              colors={[colors.brand[600], colors.brand[800]]}
              end={{ x: 1, y: 1 }}
              start={{ x: 0, y: 0 }}
              style={styles.heroGradient}>
              <MembershipBadge
                status={status !== 'active' ? status : null}
                tier={membership}
              />
              <Text style={styles.planNameOnDark}>{getPlanLabel(membership)}</Text>
              <Text style={styles.metaOnDark}>
                {expires
                  ? `Bitiş: ${format(new Date(expires), 'd MMMM yyyy', { locale: tr })}`
                  : 'Aktif abonelik'}
              </Text>
            </LinearGradient>
          )}
        </FadeIn>

        {packages.length > 0 ? (
          <FadeIn delay={100}>
            <Text style={styles.section}>Aktif paketler</Text>
            {packages.map((pkg: { id?: string; planId?: string; expiresAt?: string | null }) => (
              <View key={String(pkg.id || pkg.planId)} style={styles.pkgRow}>
                <View style={styles.pkgIcon}>
                  <Ionicons color={colors.sage[600]} name="cube" size={18} />
                </View>
                <Text style={styles.pkgName}>{getPlanLabel(pkg.planId)}</Text>
                <Text style={styles.pkgMeta}>
                  {pkg.expiresAt
                    ? `Bitiş ${format(new Date(pkg.expiresAt), 'd MMM yyyy', { locale: tr })}`
                    : 'Süresiz / tek seferlik'}
                </Text>
              </View>
            ))}
          </FadeIn>
        ) : null}

        <FadeIn delay={130}>
          <Text style={styles.section}>Mağaza paketleri</Text>
          {!storeReady && iapStatus.reason === 'no_key' ? (
            <View style={styles.setupCard}>
              <Ionicons color={colors.brand[600]} name="storefront-outline" size={22} />
              <Text style={styles.setupTitle}>Mobil satın alma yakında</Text>
              <Text style={styles.setupBody}>
                App Store / Play ürünleri ve RevenueCat anahtarları bağlanınca burada paket
                yükseltebilirsin. Web’den aldığın üyelik giriş yaptığında zaten geçerlidir.
              </Text>
            </View>
          ) : packagesLoading ? (
            <View style={styles.loadingRow}>
              <ActivityIndicator color={colors.brand[600]} />
              <Text style={styles.loadingText}>Paketler yükleniyor…</Text>
            </View>
          ) : packagesError ? (
            <View style={styles.note}>
              <Ionicons color={colors.gold[500]} name="information-circle" size={20} />
              <Text style={styles.noteText}>{packagesError}</Text>
            </View>
          ) : (
            <View style={styles.storeList}>
              {storePackages.map((pkg) => (
                <View key={pkg.productId} style={styles.storeCard}>
                  <View style={styles.storeInfo}>
                    <Text style={styles.storePlan}>{getPlanLabel(pkg.planId)}</Text>
                    <Text style={styles.storeDuration}>
                      {pkg.durationMonths === 0
                        ? 'Tek seferlik'
                        : pkg.durationMonths === 1
                          ? '1 ay'
                          : `${pkg.durationMonths} ay`}
                    </Text>
                  </View>
                  <Text style={styles.storePrice}>{pkg.priceString}</Text>
                  <Button
                    disabled={Boolean(purchasing)}
                    label={
                      purchasing === pkg.identifier
                        ? 'Üyelik güncelleniyor…'
                        : 'Satın al'
                    }
                    loading={purchasing === pkg.identifier}
                    onPress={() => void buy(pkg)}
                    size="md"
                  />
                </View>
              ))}
            </View>
          )}
        </FadeIn>

        <FadeIn delay={140} style={styles.actions}>
          <View style={styles.note}>
            <Ionicons color={colors.gold[500]} name="information-circle" size={20} />
            <Text style={styles.noteText}>
              {storeReady
                ? 'Abonelik ve ödemeleriniz App Store veya Google Play hesabınız üzerinden yönetilir.'
                : 'Üyelik bilgin Supabase’ten gelir. Mağaza yönetimi RevenueCat bağlanınca açılır.'}
            </Text>
          </View>
          <Button
            disabled={!storeReady}
            label="Aboneliği yönet"
            loading={managing}
            onPress={async () => {
              if (!userId || !storeReady) return;
              setManaging(true);
              try {
                const result = await openCustomerCenter(userId);
                if (!result.ok) {
                  toast(result.error, 'error');
                  return;
                }
                await refreshAuth();
              } finally {
                setManaging(false);
              }
            }}
            style={{ marginBottom: spacing.sm }}
          />
          <Button
            disabled={!storeReady}
            label={
              restoring
                ? 'Üyelik güncelleniyor…'
                : 'Satın almaları geri yükle'
            }
            loading={restoring}
            onPress={async () => {
              if (!userId || !storeReady) return;
              const baseline = entitlementSignature(member);
              setRestoring(true);
              try {
                const res = await restorePurchases(userId);
                if (!res.ok) {
                  toast(res.error, 'error');
                  return;
                }
                await pollAuthoritativeEntitlement(baseline);
                toast('Satın almalar geri yüklendi.', 'success');
              } finally {
                setRestoring(false);
              }
            }}
            variant="secondary"
          />
        </FadeIn>
      </ScrollView>
    </MeshBackground>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  content: { paddingHorizontal: spacing.lg, gap: spacing.md },
  back: { flexDirection: 'row', alignItems: 'center' },
  backText: { fontFamily: fonts.sansSemi, fontSize: 15, color: colors.brand[600] },
  title: { fontFamily: fonts.displayExtra, fontSize: 28, color: colors.cream[900] },
  sub: { fontFamily: fonts.sans, fontSize: 14, color: colors.cream[800] },
  heroFree: {
    backgroundColor: colors.white,
    borderRadius: radius.xl,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.brand[100],
    gap: spacing.sm,
    alignItems: 'flex-start',
  },
  heroGradient: {
    borderRadius: radius.xl,
    padding: spacing.lg,
    gap: spacing.sm,
    alignItems: 'flex-start',
  },
  planName: {
    fontFamily: fonts.displayExtra,
    fontSize: 24,
    color: colors.cream[900],
    marginTop: 4,
  },
  planNameOnDark: {
    fontFamily: fonts.displayExtra,
    fontSize: 24,
    color: colors.white,
    marginTop: 4,
  },
  meta: { fontFamily: fonts.sans, fontSize: 14, color: colors.cream[800] },
  metaOnDark: { fontFamily: fonts.sans, fontSize: 14, color: 'rgba(255,255,255,0.8)' },
  section: {
    fontFamily: fonts.sansSemi,
    fontSize: 13,
    color: colors.brand[600],
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  pkgRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.white,
    borderRadius: radius.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.cream[200],
  },
  pkgIcon: {
    width: 36,
    height: 36,
    borderRadius: radius.full,
    backgroundColor: colors.sage[50],
    alignItems: 'center',
    justifyContent: 'center',
  },
  pkgName: { flex: 1, fontFamily: fonts.sansSemi, fontSize: 15, color: colors.cream[900] },
  pkgMeta: { fontFamily: fonts.sans, fontSize: 12, color: colors.cream[800] },
  loadingRow: {
    minHeight: 72,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    backgroundColor: colors.white,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.cream[200],
  },
  loadingText: { fontFamily: fonts.sans, fontSize: 13, color: colors.cream[800] },
  storeList: { gap: spacing.sm },
  storeCard: {
    backgroundColor: colors.white,
    borderRadius: radius.xl,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.cream[200],
    gap: spacing.sm,
  },
  storeInfo: { flexDirection: 'row', justifyContent: 'space-between', gap: spacing.sm },
  storePlan: { fontFamily: fonts.displayBold, fontSize: 17, color: colors.cream[900] },
  storeDuration: { fontFamily: fonts.sansMedium, fontSize: 13, color: colors.brand[700] },
  storePrice: { fontFamily: fonts.displayExtra, fontSize: 21, color: colors.brand[700] },
  actions: { gap: spacing.sm },
  setupCard: {
    backgroundColor: colors.brand[50],
    borderRadius: radius.xl,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.brand[100],
    gap: spacing.sm,
  },
  setupTitle: {
    fontFamily: fonts.sansSemi,
    fontSize: 16,
    color: colors.cream[900],
  },
  setupBody: {
    fontFamily: fonts.sans,
    fontSize: 13,
    lineHeight: 20,
    color: colors.cream[800],
  },
  note: {
    flexDirection: 'row',
    gap: spacing.sm,
    backgroundColor: colors.warm[50],
    borderRadius: radius.xl,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: 'rgba(212,168,83,0.35)',
  },
  noteText: {
    flex: 1,
    fontFamily: fonts.sans,
    fontSize: 13,
    color: colors.cream[800],
    lineHeight: 19,
  },
});
