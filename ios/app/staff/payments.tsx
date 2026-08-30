/**
 * LOCK: docs/mobile/screens/staff/payments.md
 * Web: PaymentManagementPage.jsx — StaffPayments / useStaffEarnings
 */
import { Ionicons } from '@expo/vector-icons';
import { startOfMonth } from 'date-fns';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { PanelScaffold } from '@/components/panel/PanelScaffold';
import { StaffEarningsHistory } from '@/components/payments/StaffEarningsHistory';
import { StaffPayoutAccountCard } from '@/components/payments/StaffPayoutAccountCard';
import { FadeIn } from '@/components/ui/FadeIn';
import { InlineSpinner } from '@/components/ui/InlineSpinner';
import { useAuth } from '@/context/AuthContext';
import { useData } from '@/context/DataContext';
import { useStaffPayoutAccounts } from '@/hooks/useStaffPayoutAccounts';
import {
  STAFF_MIN_OVERLAP_MINUTES,
  STAFF_SESSION_RATE_TRY,
  formatStaffPayoutPeriodLabel,
  formatStaffTry,
  nextStaffPayoutPeriodKey,
} from '@/data/staffPayouts';
import {
  fetchStaffEarnings,
  type StaffEarningRow,
} from '@/services/staffEarnings';
import { colors, fonts, radius, spacing } from '@/theme';

function buildSummary(rows: StaffEarningRow[]) {
  const monthStart = startOfMonth(new Date());
  const pendingRows = rows.filter((r) => r.status === 'pending' || r.status === 'approved');
  const pendingAmount = pendingRows.reduce((s, r) => s + Number(r.amount_try || 0), 0);
  const sessionsThisMonth = rows.filter((r) => {
    const created = new Date(r.created_at);
    return created >= monthStart && r.status !== 'rejected' && r.status !== 'reversed';
  }).length;
  const totalEarned = rows
    .filter((r) => r.status === 'paid' || r.status === 'approved' || r.status === 'pending')
    .reduce((s, r) => s + Number(r.amount_try || 0), 0);
  const payoutKey = nextStaffPayoutPeriodKey(
    new Date(),
    pendingRows.map((r) => r.period_key),
  );

  return {
    pendingAmount,
    sessionsThisMonth,
    totalEarned,
    payoutLabel: formatStaffPayoutPeriodLabel(payoutKey),
  };
}

export default function StaffPayments() {
  const { staff } = useAuth();
  const { staffClients } = useData();
  const staffId = staff?.id ? String(staff.id) : '';
  const [rows, setRows] = useState<StaffEarningRow[]>([]);
  const [loading, setLoading] = useState(true);
  const { account, loading: payoutLoading, reload: reloadPayout } = useStaffPayoutAccounts({
    staffId,
  });

  const load = useCallback(async () => {
    if (!staffId) {
      setRows([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      setRows(await fetchStaffEarnings(staffId));
    } catch {
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, [staffId]);

  useEffect(() => {
    void load();
  }, [load]);

  const summary = useMemo(() => buildSummary(rows), [rows]);
  const rateLabel = formatStaffTry(STAFF_SESSION_RATE_TRY);
  const members = (staffClients || []) as Record<string, unknown>[];

  return (
    <PanelScaffold keyboard subtitle="Hak ediş özeti" title="Ödemeler">
      {loading ? (
        <InlineSpinner fill />
      ) : (
        <>
          <FadeIn delay={40}>
            <View style={styles.hero}>
              <View style={styles.heroRate}>
                <Text style={styles.heroRateLabel}>Görüşme başı net hakediş</Text>
                <Text style={styles.heroRateValue}>{rateLabel}</Text>
                <Text style={styles.heroRateSub}>
                  Ödeme her Cuma, kayıtlı IBAN’ınıza EFT / FAST ile yatırılır.
                </Text>
              </View>
              <View style={styles.heroBody}>
                <View style={styles.heroTitleRow}>
                  <View style={styles.heroIcon}>
                    <Ionicons color={colors.warm[500]} name="videocam" size={20} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.heroTitle}>Hakediş nasıl oluşur?</Text>
                    <Text style={styles.heroText}>
                      Yalnızca platformdaki video görüşmesi sayılır. Tutar sabittir; süre{' '}
                      {STAFF_MIN_OVERLAP_MINUTES} dakikayı geçse de ek ücret yazılmaz.
                    </Text>
                    <Text style={styles.heroTextMuted}>
                      Cuma 00:00 – Perşembe 23:59 (görüşme başlangıç saati, Türkiye). Bu aralık
                      hemen sonraki Cuma ödenir; Cuma günü başlayan görüşme o günkü EFT’ye girmez.
                    </Text>
                  </View>
                </View>
                <View style={styles.ruleGrid}>
                  <View style={styles.ruleYes}>
                    <Text style={styles.ruleYesTitle}>Sayılır</Text>
                    {[
                      'Koç veya diyetisyen video seansı',
                      `Siz ve danışan aynı anda en az ${STAFF_MIN_OVERLAP_MINUTES} dakika bağlı kalır`,
                      'Görüşme tamamlanır; sistem otomatik hakediş satırı açar',
                    ].map((line) => (
                      <View key={line} style={styles.ruleRow}>
                        <Ionicons color={colors.sage[600]} name="checkmark-circle" size={16} />
                        <Text style={styles.ruleText}>{line}</Text>
                      </View>
                    ))}
                  </View>
                  <View style={styles.ruleNo}>
                    <Text style={styles.ruleNoTitle}>Sayılmaz</Text>
                    {[
                      'Antrenman programı veya program revizyonu',
                      'Beslenme listesi hazırlamak',
                      `Tek tarafın bağlanması veya ${STAFF_MIN_OVERLAP_MINUTES} dakikanın altı`,
                    ].map((line) => (
                      <View key={line} style={styles.ruleRow}>
                        <Ionicons color={colors.danger[500]} name="close-circle" size={16} />
                        <Text style={styles.ruleText}>{line}</Text>
                      </View>
                    ))}
                  </View>
                </View>
              </View>
            </View>
          </FadeIn>

          <View style={styles.kpiCol}>
            <FadeIn delay={70}>
              <View style={[styles.kpiCard, styles.kpiPending]}>
                <Text style={styles.kpiLabelPending}>Bekleyen Hakediş</Text>
                <Text style={styles.kpiValuePending}>{formatStaffTry(summary.pendingAmount)}</Text>
                <View style={styles.kpiMetaRow}>
                  <Ionicons color={colors.warm[500]} name="time-outline" size={12} />
                  <Text style={styles.kpiMetaPending}>Ödeme: {summary.payoutLabel}</Text>
                </View>
              </View>
            </FadeIn>
            <FadeIn delay={80}>
              <View style={[styles.kpiCard, styles.kpiSessions]}>
                <Text style={styles.kpiLabelSessions}>Bu Ay Seans</Text>
                <Text style={styles.kpiValueSessions}>{summary.sessionsThisMonth}</Text>
                <Text style={styles.kpiMetaSessions}>Seans başı {rateLabel}</Text>
              </View>
            </FadeIn>
            <FadeIn delay={90}>
              <View style={[styles.kpiCard, styles.kpiTotal]}>
                <Text style={styles.kpiLabelTotal}>Toplam Kazanç</Text>
                <Text style={styles.kpiValueTotal}>{formatStaffTry(summary.totalEarned)}</Text>
                <View style={styles.kpiMetaRow}>
                  <Ionicons color={colors.sage[600]} name="trending-up" size={12} />
                  <Text style={styles.kpiMetaTotal}>Bekleyen + onaylı + ödenen</Text>
                </View>
              </View>
            </FadeIn>
          </View>

          {payoutLoading ? (
            <View style={styles.ibanLoading}>
              <InlineSpinner />
            </View>
          ) : (
            <StaffPayoutAccountCard
              account={account}
              onSaved={() => void reloadPayout()}
              staffUser={staff as { id?: string; name?: string }}
            />
          )}

          <FadeIn delay={100}>
            <View style={styles.sectionHeader}>
              <Ionicons color={colors.brand[500]} name="wallet-outline" size={20} />
              <Text style={styles.sectionTitle}>Hakediş Geçmişi</Text>
            </View>
          </FadeIn>

          <StaffEarningsHistory members={members} rows={rows} />
        </>
      )}
    </PanelScaffold>
  );
}

const styles = StyleSheet.create({
  hero: {
    overflow: 'hidden',
    borderRadius: 24,
    borderWidth: 2,
    borderColor: '#fcd34d',
    backgroundColor: colors.white,
  },
  heroRate: {
    backgroundColor: colors.warm[500],
    paddingHorizontal: spacing.md,
    paddingVertical: 20,
    gap: 8,
  },
  heroRateLabel: {
    fontFamily: fonts.sansSemi,
    fontSize: 12,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    color: 'rgba(255,255,255,0.9)',
  },
  heroRateValue: {
    fontFamily: fonts.displayExtra,
    fontSize: 40,
    lineHeight: 44,
    color: colors.white,
  },
  heroRateSub: {
    fontFamily: fonts.sansMedium,
    fontSize: 14,
    lineHeight: 20,
    color: 'rgba(255,255,255,0.92)',
  },
  heroBody: { padding: spacing.md, gap: spacing.md },
  heroTitleRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  heroIcon: {
    width: 40,
    height: 40,
    borderRadius: 16,
    backgroundColor: colors.warm[100],
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroTitle: {
    fontFamily: fonts.displayBold,
    fontSize: 18,
    color: colors.cream[900],
  },
  heroText: {
    marginTop: 4,
    fontFamily: fonts.sans,
    fontSize: 14,
    lineHeight: 20,
    color: colors.cream[800],
    opacity: 0.75,
  },
  heroTextMuted: {
    marginTop: 8,
    fontFamily: fonts.sans,
    fontSize: 13,
    lineHeight: 19,
    color: colors.cream[800],
    opacity: 0.65,
  },
  ruleGrid: { gap: spacing.sm },
  ruleYes: {
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.sage[200],
    backgroundColor: colors.sage[50],
    padding: spacing.md,
    gap: 8,
  },
  ruleNo: {
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.danger[100],
    backgroundColor: colors.danger[50],
    padding: spacing.md,
    gap: 8,
  },
  ruleYesTitle: {
    fontFamily: fonts.sansBold,
    fontSize: 11,
    letterSpacing: 0.6,
    textTransform: 'uppercase',
    color: colors.sage[700],
  },
  ruleNoTitle: {
    fontFamily: fonts.sansBold,
    fontSize: 11,
    letterSpacing: 0.6,
    textTransform: 'uppercase',
    color: colors.danger[800],
  },
  ruleRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 8 },
  ruleText: {
    flex: 1,
    fontFamily: fonts.sans,
    fontSize: 14,
    lineHeight: 20,
    color: colors.cream[900],
  },
  kpiCol: { gap: spacing.sm },
  kpiCard: {
    borderRadius: radius.lg,
    padding: spacing.md,
    borderWidth: 1,
  },
  kpiPending: {
    borderColor: colors.warm[200],
    backgroundColor: colors.warm[50],
  },
  kpiSessions: {
    borderColor: colors.brand[100],
    backgroundColor: colors.brand[50],
  },
  kpiTotal: {
    borderColor: colors.cream[200],
    backgroundColor: colors.white,
  },
  kpiLabelPending: {
    fontFamily: fonts.sansSemi,
    fontSize: 12,
    color: colors.warm[500],
  },
  kpiLabelSessions: {
    fontFamily: fonts.sansSemi,
    fontSize: 12,
    color: colors.brand[700],
  },
  kpiLabelTotal: {
    fontFamily: fonts.sansSemi,
    fontSize: 12,
    color: colors.cream[800],
  },
  kpiValuePending: {
    marginTop: 4,
    fontFamily: fonts.displayExtra,
    fontSize: 24,
    color: colors.cream[900],
  },
  kpiValueSessions: {
    marginTop: 4,
    fontFamily: fonts.displayExtra,
    fontSize: 24,
    color: colors.brand[900],
  },
  kpiValueTotal: {
    marginTop: 4,
    fontFamily: fonts.displayExtra,
    fontSize: 24,
    color: colors.cream[900],
  },
  kpiMetaRow: {
    marginTop: 4,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  kpiMetaPending: { fontFamily: fonts.sans, fontSize: 12, color: colors.warm[500] },
  kpiMetaSessions: {
    marginTop: 4,
    fontFamily: fonts.sans,
    fontSize: 12,
    color: colors.brand[700],
  },
  kpiMetaTotal: { fontFamily: fonts.sans, fontSize: 12, color: colors.sage[600] },
  ibanLoading: {
    minHeight: 180,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: colors.cream[200],
    backgroundColor: colors.white,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: spacing.sm,
    marginBottom: 4,
  },
  sectionTitle: {
    fontFamily: fonts.displayExtra,
    fontSize: 17,
    color: colors.cream[900],
  },
});
