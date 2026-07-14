import { Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { useMemo, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, View } from 'react-native';

import { ProfileInfoGrid } from '@/components/profile/ProfileInfoGrid';
import { ResponsiveCenter } from '@/components/layout/ResponsiveCenter';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { PressableScale } from '@/components/ui/PressableScale';
import { StackHeader } from '@/components/ui/StackHeader';
import { useApp } from '@/context/AppContext';
import { useResponsive } from '@/hooks/useResponsive';
import { buildMembershipSummary, buildPersonalInfoRows } from '@/services/memberProfile';
import {
  DURATION_OPTIONS,
  formatTry,
  getPlanLabel,
  getTierPrice,
  isOneTimeBillingPlan,
  isPaidMembership,
  RECOMMENDED_PLAN,
  sortPlansForDisplay,
} from '@/data/membershipPlans';
import { colors, fonts, radius, spacing } from '@/constants/theme';

function formatDate(iso?: string) {
  if (!iso) return '—';
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return date.toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' });
}

export default function MembershipScreen() {
  const { member, user, plans, startStripeCheckout, refresh } = useApp();
  const { horizontalPadding } = useResponsive();
  const summary = buildMembershipSummary(member);
  const infoRows = buildPersonalInfoRows(member, user.email);
  const currentPlanId = (member?.membership as string) || 'free';

  const upgradePlans = useMemo(() => {
    const list = sortPlansForDisplay(plans.length ? plans : []);
    return list.filter((p) => p.id !== 'free' && p.id !== currentPlanId && isPaidMembership(p.id));
  }, [plans, currentPlanId]);

  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null);
  const [durationMonths, setDurationMonths] = useState(1);
  const [checkingOut, setCheckingOut] = useState(false);

  const activePlanId = selectedPlanId || upgradePlans[0]?.id || null;
  const oneTime = isOneTimeBillingPlan(activePlanId);
  const price = activePlanId ? getTierPrice(activePlanId, oneTime ? 1 : durationMonths) : 0;

  const onCheckout = async () => {
    if (!activePlanId) return;
    setCheckingOut(true);
    try {
      const result = await startStripeCheckout(
        activePlanId,
        'change',
        oneTime ? 1 : durationMonths,
      );
      if (!result.success) {
        Alert.alert('Ödeme başlatılamadı', result.error || 'Bir hata oluştu.');
        return;
      }
      await refresh();
      if (result.dismissed) {
        Alert.alert(
          'Ödeme penceresi kapandı',
          'Ödemeyi tamamladıysanız üyeliğiniz kısa süre içinde güncellenir. Güncellenmediyse biraz bekleyip yenileyin.',
        );
      }
    } finally {
      setCheckingOut(false);
    }
  };

  return (
    <View style={styles.root}>
      <StatusBar style="dark" />
      <StackHeader subtitle="Aktif paket ve plan yükseltme" title="Üyeliğim" />

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <ResponsiveCenter innerStyle={{ paddingHorizontal: horizontalPadding }}>
          <Card padding={spacing.lg} style={styles.planCard}>
            <View style={styles.planBadge}>
              <Ionicons color={colors.violet[600]} name="shield-checkmark" size={18} />
              <Text style={styles.planBadgeText}>{summary.statusLabel}</Text>
            </View>
            <Text style={styles.planTitle}>{summary.planLabel}</Text>
            <Text style={styles.planMeta}>
              {summary.isPaid ? 'Premium üyelik' : 'Ücretsiz plan'} · Kayıt: {formatDate(summary.joinedAt)}
            </Text>
            {summary.premiumExpiresAt ? (
              <Text style={styles.planExpiry}>Bitiş: {formatDate(summary.premiumExpiresAt)}</Text>
            ) : null}

            {summary.benefits.length > 0 ? (
              <View style={styles.benefits}>
                {summary.benefits.map((benefit) => (
                  <View key={benefit} style={styles.benefitRow}>
                    <Ionicons color={colors.brand[600]} name="checkmark-circle" size={16} />
                    <Text style={styles.benefitText}>{benefit}</Text>
                  </View>
                ))}
              </View>
            ) : null}
          </Card>

          {upgradePlans.length > 0 ? (
            <>
              <Text style={styles.sectionTitle}>Plan yükselt / paket ekle</Text>
              <Text style={styles.sectionHint}>
                Güvenli ödeme Stripe Checkout ile yapılır. Hesabınız aynı kalır; ödeme sonrası haklarınız
                güncellenir.
              </Text>

              <View style={styles.planList}>
                {upgradePlans.map((plan) => {
                  const selected = plan.id === activePlanId;
                  const recommended = plan.id === RECOMMENDED_PLAN;
                  return (
                    <PressableScale
                      key={plan.id}
                      onPress={() => {
                        setSelectedPlanId(plan.id);
                        if (isOneTimeBillingPlan(plan.id)) setDurationMonths(1);
                      }}
                      scaleTo={0.98}
                      style={[styles.planOption, selected && styles.planOptionSelected]}>
                      <View style={styles.planOptionTop}>
                        <Text style={styles.planOptionName}>{plan.name || getPlanLabel(plan.id)}</Text>
                        {recommended ? (
                          <View style={styles.recBadge}>
                            <Text style={styles.recBadgeText}>Önerilen</Text>
                          </View>
                        ) : null}
                      </View>
                      <Text style={styles.planOptionPrice}>
                        {formatTry(
                          getTierPrice(
                            plan.id,
                            isOneTimeBillingPlan(plan.id) ? 1 : durationMonths,
                          ) || plan.price,
                        )}
                        {isOneTimeBillingPlan(plan.id) ? ' · tek seferlik' : ''}
                      </Text>
                    </PressableScale>
                  );
                })}
              </View>

              {activePlanId && !oneTime ? (
                <View style={styles.durationRow}>
                  {DURATION_OPTIONS.map((opt) => {
                    const active = durationMonths === opt.months;
                    return (
                      <PressableScale
                        key={opt.months}
                        onPress={() => setDurationMonths(opt.months)}
                        scaleTo={0.97}
                        style={[styles.durationChip, active && styles.durationChipActive]}>
                        <Text style={[styles.durationText, active && styles.durationTextActive]}>
                          {opt.label}
                        </Text>
                      </PressableScale>
                    );
                  })}
                </View>
              ) : null}

              <Button
                disabled={!activePlanId || price <= 0}
                label={
                  price > 0
                    ? `${formatTry(price)} · Güvenli öde`
                    : 'Ödeme başlat'
                }
                leftIcon="card-outline"
                loading={checkingOut}
                onPress={onCheckout}
                style={styles.checkoutBtn}
              />
            </>
          ) : null}

          <Text style={styles.sectionTitle}>Kişisel Bilgiler</Text>
          <ProfileInfoGrid rows={infoRows} />

          <Card padding={spacing.md} style={styles.note}>
            <Text style={styles.noteText}>
              Ödeme sorunlarında veya plan sorularınızda destek ekibiyle iletişime geçebilirsiniz.
            </Text>
          </Card>
        </ResponsiveCenter>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    paddingBottom: spacing.xxl,
    paddingTop: spacing.md,
  },
  planCard: {
    marginBottom: spacing.xl,
  },
  planBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 6,
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
    borderRadius: radius.full,
    backgroundColor: colors.violet[50],
  },
  planBadgeText: {
    fontFamily: fonts.semibold,
    fontSize: 12,
    color: colors.violet[600],
  },
  planTitle: {
    fontFamily: fonts.displayExtra,
    fontSize: 28,
    color: colors.text.primary,
    marginTop: spacing.md,
  },
  planMeta: {
    fontFamily: fonts.regular,
    fontSize: 14,
    color: colors.text.secondary,
    marginTop: spacing.xs,
  },
  planExpiry: {
    fontFamily: fonts.medium,
    fontSize: 13,
    color: colors.coral[600],
    marginTop: spacing.xs,
  },
  benefits: {
    marginTop: spacing.lg,
    gap: spacing.sm,
  },
  benefitRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: 8,
    paddingHorizontal: spacing.sm,
    borderRadius: radius.md,
    backgroundColor: colors.brand[50],
  },
  benefitText: {
    flex: 1,
    fontFamily: fonts.medium,
    fontSize: 14,
    color: colors.text.primary,
  },
  sectionTitle: {
    fontFamily: fonts.display,
    fontSize: 18,
    color: colors.text.primary,
    marginBottom: spacing.sm,
  },
  sectionHint: {
    fontFamily: fonts.regular,
    fontSize: 13,
    lineHeight: 19,
    color: colors.text.secondary,
    marginBottom: spacing.md,
  },
  planList: {
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  planOption: {
    padding: spacing.md,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.ink[100],
    backgroundColor: colors.white,
  },
  planOptionSelected: {
    borderColor: colors.brand[500],
    backgroundColor: colors.brand[50],
  },
  planOptionTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  planOptionName: {
    fontFamily: fonts.semibold,
    fontSize: 16,
    color: colors.text.primary,
  },
  planOptionPrice: {
    marginTop: 4,
    fontFamily: fonts.medium,
    fontSize: 14,
    color: colors.text.secondary,
  },
  recBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radius.full,
    backgroundColor: colors.coral[100],
  },
  recBadgeText: {
    fontFamily: fonts.semibold,
    fontSize: 11,
    color: colors.coral[600],
  },
  durationRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  durationChip: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 10,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.ink[100],
    backgroundColor: colors.white,
  },
  durationChipActive: {
    borderColor: colors.brand[500],
    backgroundColor: colors.brand[50],
  },
  durationText: {
    fontFamily: fonts.medium,
    fontSize: 13,
    color: colors.text.secondary,
  },
  durationTextActive: {
    color: colors.brand[700],
    fontFamily: fonts.semibold,
  },
  checkoutBtn: {
    marginBottom: spacing.xl,
  },
  note: {
    marginTop: spacing.xl,
    backgroundColor: colors.brand[50],
    borderWidth: 1,
    borderColor: colors.brand[100],
  },
  noteText: {
    fontFamily: fonts.regular,
    fontSize: 13,
    lineHeight: 20,
    color: colors.text.secondary,
  },
});
