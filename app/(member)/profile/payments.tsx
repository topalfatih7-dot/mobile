import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { Linking, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';

import { MembershipCancelModal, type CancelDialogVariant } from '@/components/membership/MembershipCancelModal';
import { Button } from '@/components/ui/Button';
import { FadeIn } from '@/components/ui/FadeIn';
import { MeshBackground } from '@/components/ui/MeshBackground';
import { MembershipBadge } from '@/components/home/MembershipBadge';
import { useToast } from '@/context/ToastContext';
import { useAuth } from '@/context/AuthContext';
import { useMember } from '@/context/DataContext';
import { MEMBERSHIP_CANCEL_COPY, MEMBERSHIP_CANCEL_SUPPORT_EMAIL } from '@/data/membershipCancelCopy';
import { getPlanLabel } from '@/data/membershipPlans';
import { fetchMemberRowQuiet } from '@/services/memberRowRefresh';
import { resumeStripeSubscription, startStripePortal } from '@/services/stripePortal';
import {
  canOfferWebPurchase,
  openWebCheckoutHandoff,
} from '@/services/webCheckoutHandoff';
import {
  isOneTimePackage,
  isPackageEntryActive,
  migrateLegacyToPackages,
  packageBillingSubscriptionId,
} from '@/utils/memberPackages';
import { colors, fonts, radius, spacing } from '@/theme';

type DialogState = {
  variant: CancelDialogVariant;
  subscriptionId: string;
  planLabel: string;
  dateLabel: string;
};

function formatDate(iso?: string | null) {
  if (!iso) return '—';
  try {
    return format(new Date(iso), 'd MMMM yyyy', { locale: tr });
  } catch {
    return String(iso);
  }
}

/**
 * LOCK: docs/mobile/screens/member/payments.md
 */
export default function PaymentsScreen() {
  const insets = useSafeAreaInsets();
  const member = useMember();
  const { userId, applyRemoteMember } = useAuth();
  const { toast } = useToast();
  const copy = MEMBERSHIP_CANCEL_COPY;
  const offerWebPurchase = canOfferWebPurchase();
  const [openingWeb, setOpeningWeb] = useState(false);
  const [busy, setBusy] = useState(false);
  const [dialog, setDialog] = useState<DialogState | null>(null);

  const membership = String(member?.membership || 'free');
  const status = String(member?.membershipStatus || 'active');
  const expires = member?.premiumExpiresAt ? String(member.premiumExpiresAt) : null;

  const packages = useMemo(
    () =>
      migrateLegacyToPackages(member).filter((p: { status?: string }) => isPackageEntryActive(p)),
    [member],
  );

  const refreshMember = async () => {
    const row = await fetchMemberRowQuiet(userId);
    if (row) applyRemoteMember(row);
  };

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

  const openManagePortal = async () => {
    setBusy(true);
    try {
      const result = await startStripePortal({ intent: 'manage' });
      if (!result.ok) toast(result.error, 'error');
    } finally {
      setBusy(false);
    }
  };

  const confirmDialog = async () => {
    if (!dialog) return;
    setBusy(true);
    try {
      if (dialog.variant === 'resume') {
        const result = await resumeStripeSubscription(dialog.subscriptionId);
        if (!result.ok) {
          toast(result.error, 'error');
          return;
        }
        toast(copy.resumedToast, 'success');
        setDialog(null);
        await refreshMember();
        return;
      }
      const result = await startStripePortal({
        intent: 'cancel',
        mode: dialog.variant === 'immediate' ? 'immediately' : 'at_period_end',
        subscriptionId: dialog.subscriptionId,
      });
      if (!result.ok) {
        toast(result.error, 'error');
        return;
      }
      setDialog(null);
    } finally {
      setBusy(false);
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
          <Text style={styles.sub}>
            {offerWebPurchase ? 'Paketleriniz, iptal ve web üzerinden satın alma' : copy.iosPaymentsSub}
          </Text>
        </FadeIn>

        <FadeIn delay={60}>
          {membership === 'free' ? (
            <View style={styles.heroFree}>
              <MembershipBadge status={status !== 'active' ? status : null} tier={membership} />
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
              <MembershipBadge status={status !== 'active' ? status : null} tier={membership} />
              <Text style={styles.planNameOnDark}>{getPlanLabel(membership)}</Text>
              <Text style={styles.metaOnDark}>
                {expires
                  ? `Bitiş: ${format(new Date(expires), 'd MMMM yyyy', { locale: tr })}`
                  : 'Aktif abonelik'}
              </Text>
            </LinearGradient>
          )}
        </FadeIn>

        <FadeIn delay={90}>
          <Text style={styles.section}>{copy.packagesTitle}</Text>
          <Text style={styles.independent}>{copy.independentNote}</Text>
          {packages.length === 0 ? (
            <Text style={styles.emptyPkg}>Aktif ücretli paketiniz yok.</Text>
          ) : (
            packages.map(
              (pkg: {
                id?: string;
                planId?: string;
                currentPeriodEnd?: string | null;
                expiresAt?: string | null;
                cancelAtPeriodEnd?: boolean;
              }) => {
              const subId = packageBillingSubscriptionId(pkg, member);
              const oneTime = isOneTimePackage(pkg);
              const access = pkg.currentPeriodEnd || pkg.expiresAt;
              const label = getPlanLabel(pkg.planId);
              return (
                <View key={String(pkg.id || pkg.planId)} style={styles.pkgCard}>
                  <View style={styles.pkgRow}>
                    <View style={styles.pkgIcon}>
                      <Ionicons color={colors.sage[600]} name="cube" size={18} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.pkgName}>{label}</Text>
                      <Text style={styles.pkgMeta}>
                        {oneTime
                          ? 'Tek seferlik'
                          : access
                            ? `${pkg.cancelAtPeriodEnd ? 'Yenileme kapalı · ' : 'Bitiş '}${formatDate(access)}`
                            : 'Aktif abonelik'}
                      </Text>
                    </View>
                  </View>
                  {pkg.cancelAtPeriodEnd ? (
                    <Text style={styles.badgeOff}>{copy.renewalOffBadge}</Text>
                  ) : null}
                  {oneTime ? (
                    <>
                      <Text style={styles.doctorBody}>{copy.doctorBody}</Text>
                      <Button
                        label={copy.doctorMail}
                        onPress={() =>
                          void Linking.openURL(`mailto:${MEMBERSHIP_CANCEL_SUPPORT_EMAIL}`)
                        }
                        size="md"
                        variant="secondary"
                      />
                    </>
                  ) : (
                    <View style={styles.pkgActions}>
                      {subId && !pkg.cancelAtPeriodEnd ? (
                        <>
                          <Button
                            disabled={busy}
                            label={copy.closeRenewal}
                            onPress={() =>
                              setDialog({
                                variant: 'period_end',
                                subscriptionId: subId,
                                planLabel: label,
                                dateLabel: formatDate(access),
                              })
                            }
                            size="md"
                            variant="secondary"
                          />
                          <Button
                            disabled={busy}
                            label={copy.closeNow}
                            onPress={() =>
                              setDialog({
                                variant: 'immediate',
                                subscriptionId: subId,
                                planLabel: label,
                                dateLabel: formatDate(access),
                              })
                            }
                            size="md"
                            variant="ghost"
                          />
                        </>
                      ) : null}
                      {subId && pkg.cancelAtPeriodEnd ? (
                        <Button
                          disabled={busy}
                          label={copy.keepRenewal}
                          onPress={() =>
                            setDialog({
                              variant: 'resume',
                              subscriptionId: subId,
                              planLabel: label,
                              dateLabel: formatDate(access),
                            })
                          }
                          size="md"
                        />
                      ) : null}
                      {!subId ? (
                        <Text style={styles.pkgMeta}>
                          Stripe aboneliği eşleşmedi. Kart/fatura veya {MEMBERSHIP_CANCEL_SUPPORT_EMAIL}
                        </Text>
                      ) : null}
                    </View>
                  )}
                </View>
              );
            })
          )}
        </FadeIn>

        <FadeIn delay={130} style={styles.actions}>
          <View style={styles.note}>
            <Ionicons color={colors.gold[500]} name="information-circle" size={20} />
            <Text style={styles.noteText}>
              {offerWebPurchase ? copy.manageNote : copy.iosManageNote}
            </Text>
          </View>
          <Button
            disabled={busy}
            label={copy.cardInvoice}
            loading={busy}
            onPress={() => void openManagePortal()}
            size="lg"
            variant="secondary"
          />
          {offerWebPurchase ? (
            <Button
              label={copy.buyCta}
              loading={openingWeb}
              onPress={() => void openWebMembership()}
              size="lg"
            />
          ) : null}
        </FadeIn>
      </ScrollView>

      <MembershipCancelModal
        busy={busy}
        dateLabel={dialog?.dateLabel || ''}
        onClose={() => {
          if (!busy) setDialog(null);
        }}
        onConfirm={() => void confirmDialog()}
        planLabel={dialog?.planLabel || ''}
        variant={dialog?.variant || null}
        visible={Boolean(dialog)}
      />
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
  independent: {
    fontFamily: fonts.sans,
    fontSize: 13,
    color: colors.cream[800],
    lineHeight: 18,
  },
  emptyPkg: { fontFamily: fonts.sans, fontSize: 14, color: colors.cream[800] },
  pkgCard: {
    backgroundColor: colors.white,
    borderRadius: radius.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.cream[200],
    gap: spacing.sm,
  },
  pkgRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  pkgIcon: {
    width: 36,
    height: 36,
    borderRadius: radius.full,
    backgroundColor: colors.sage[50],
    alignItems: 'center',
    justifyContent: 'center',
  },
  pkgName: { fontFamily: fonts.sansSemi, fontSize: 15, color: colors.cream[900] },
  pkgMeta: { fontFamily: fonts.sans, fontSize: 12, color: colors.cream[800] },
  pkgActions: { gap: spacing.sm },
  badgeOff: {
    alignSelf: 'flex-start',
    fontFamily: fonts.sansSemi,
    fontSize: 11,
    color: colors.warm[500],
    backgroundColor: colors.warm[50],
    overflow: 'hidden',
    borderRadius: radius.full,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  doctorBody: {
    fontFamily: fonts.sans,
    fontSize: 13,
    lineHeight: 19,
    color: colors.cream[800],
  },
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
