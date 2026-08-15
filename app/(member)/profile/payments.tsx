import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';

import { Button } from '@/components/ui/Button';
import { FadeIn } from '@/components/ui/FadeIn';
import { MeshBackground } from '@/components/ui/MeshBackground';
import { MembershipBadge } from '@/components/home/MembershipBadge';
import { useToast } from '@/context/ToastContext';
import { useMember } from '@/context/DataContext';
import { getPlanLabel } from '@/data/membershipPlans';
import { openWebCheckoutHandoff } from '@/services/webCheckoutHandoff';
import {
  isPackageEntryActive,
  migrateLegacyToPackages,
} from '@/utils/memberPackages';
import { colors, fonts, radius, spacing } from '@/theme';

/**
 * LOCK: docs/mobile/screens/member/payments.md
 * MOBILE DIFF: Uygulama içi IAP/RevenueCat kaldırıldı — satın alma/yönetim web Stripe.
 */
export default function PaymentsScreen() {
  const insets = useSafeAreaInsets();
  const member = useMember();
  const { toast } = useToast();
  const [openingWeb, setOpeningWeb] = useState(false);

  const membership = String(member?.membership || 'free');
  const status = String(member?.membershipStatus || 'active');
  const expires = member?.premiumExpiresAt ? String(member.premiumExpiresAt) : null;

  const packages = useMemo(
    () =>
      migrateLegacyToPackages(member).filter((p: { status?: string }) =>
        isPackageEntryActive(p),
      ),
    [member],
  );

  const openWebMembership = async () => {
    setOpeningWeb(true);
    try {
      const result = await openWebCheckoutHandoff();
      if (result.ok) return;
      toast(result.error, result.fallback === 'plans-login' ? 'warning' : 'error');
    } catch {
      toast('Web sayfası açılamadı.', 'error');
    } finally {
      setOpeningWeb(false);
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
          <Text style={styles.sub}>Mevcut planınız ve web üzerinden yönetim</Text>
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

        <FadeIn delay={130} style={styles.actions}>
          <View style={styles.note}>
            <Ionicons color={colors.gold[500]} name="information-circle" size={20} />
            <Text style={styles.noteText}>
              Satın alma ve abonelik yönetimi web üzerinden yapılır. Web’den aldığınız üyelik
              giriş yaptığınızda uygulamada geçerlidir.
            </Text>
          </View>
          <Button
            label="Web’den satın al / yönet"
            loading={openingWeb}
            onPress={() => void openWebMembership()}
            size="lg"
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
  actions: { gap: spacing.sm },
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
