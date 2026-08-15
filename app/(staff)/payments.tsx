/**
 * LOCK: docs/mobile/screens/staff/payments.md
 * Web: PaymentManagementPage.jsx — StaffPayments / useStaffEarnings
 */
import { Ionicons } from '@expo/vector-icons';
import { format, startOfMonth } from 'date-fns';
import { tr } from 'date-fns/locale';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { PanelScaffold } from '@/components/panel/PanelScaffold';
import { EmptyState } from '@/components/ui/EmptyState';
import { FadeIn } from '@/components/ui/FadeIn';
import { InlineSpinner } from '@/components/ui/InlineSpinner';
import { useAuth } from '@/context/AuthContext';
import {
  STAFF_EARNING_STATUS,
  STAFF_SESSION_RATE_TRY,
  formatStaffPayoutPeriodLabel,
  formatStaffTry,
} from '@/data/staffPayouts';
import {
  fetchStaffEarnings,
  type StaffEarningRow,
} from '@/services/staffEarnings';
import { colors, fonts, radius, spacing } from '@/theme';

type PeriodHistoryRow = {
  id: string;
  period: string;
  sessions: number;
  amount: number;
  status: string;
};

function nextFridayLabel(): string {
  const d = new Date();
  const day = d.getDay();
  const add = day <= 5 ? 5 - day : 6;
  d.setDate(d.getDate() + add);
  return format(d, 'd MMM', { locale: tr });
}

function statusLabel(status: string): string {
  return STAFF_EARNING_STATUS[status] || status;
}

function statusColors(status: string): { bg: string; fg: string } {
  switch (status) {
    case 'paid':
    case 'completed':
      return { bg: colors.sage[50], fg: colors.sage[700] };
    case 'approved':
      return { bg: colors.brand[50], fg: colors.brand[700] };
    case 'rejected':
      return { bg: colors.danger[50], fg: colors.danger[700] };
    case 'reversed':
    case 'refunded':
      return { bg: colors.cream[100], fg: colors.cream[800] };
    case 'pending':
    default:
      return { bg: colors.warm[100], fg: colors.warm[500] };
  }
}

function buildSummary(rows: StaffEarningRow[]) {
  const monthStart = startOfMonth(new Date());
  const pendingAmount = rows
    .filter((r) => r.status === 'pending' || r.status === 'approved')
    .reduce((s, r) => s + Number(r.amount_try || 0), 0);
  const sessionsThisMonth = rows.filter((r) => {
    const created = new Date(r.created_at);
    return created >= monthStart && r.status !== 'rejected' && r.status !== 'reversed';
  }).length;
  const totalEarned = rows
    .filter((r) => r.status === 'paid' || r.status === 'approved' || r.status === 'pending')
    .reduce((s, r) => s + Number(r.amount_try || 0), 0);

  const byPeriod: Record<string, PeriodHistoryRow> = {};
  for (const r of rows) {
    const key = r.period_key || '—';
    if (!byPeriod[key]) {
      byPeriod[key] = {
        id: key,
        period: formatStaffPayoutPeriodLabel(key),
        sessions: 0,
        amount: 0,
        status: r.status,
      };
    }
    byPeriod[key].sessions += 1;
    byPeriod[key].amount += Number(r.amount_try || 0);
    if (r.status === 'pending') byPeriod[key].status = 'pending';
    else if (r.status === 'paid' && byPeriod[key].status !== 'pending') {
      byPeriod[key].status = 'paid';
    }
  }

  return {
    pendingAmount,
    sessionsThisMonth,
    totalEarned,
    history: Object.values(byPeriod).sort((a, b) => String(b.id).localeCompare(String(a.id))),
  };
}

export default function StaffPayments() {
  const { staff } = useAuth();
  const staffId = staff?.id ? String(staff.id) : '';
  const [rows, setRows] = useState<StaffEarningRow[]>([]);
  const [loading, setLoading] = useState(true);

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

  return (
    <PanelScaffold subtitle="Hak ediş özeti" title="Ödemeler">
      {loading ? (
        <InlineSpinner fill />
      ) : (
        <>
          <FadeIn delay={40}>
            <View style={styles.infoBanner}>
              <Ionicons color={colors.brand[600]} name="business-outline" size={20} />
              <Text style={styles.infoText}>
                Faturalandırılabilir görüşme başına {rateLabel} · her iki tarafın videoya katılımı
                ve en az 15 dk eşzamanlı süre gerekir. Program/listeler dahil değildir.
              </Text>
            </View>
          </FadeIn>

          <FadeIn delay={70}>
            <View style={styles.kpiGrid}>
              <View style={[styles.kpiCard, styles.kpiPending]}>
                <Text style={styles.kpiLabelPending}>Bekleyen Hakediş</Text>
                <Text style={styles.kpiValuePending}>
                  {formatStaffTry(summary.pendingAmount)}
                </Text>
                <View style={styles.kpiMetaRow}>
                  <Ionicons color={colors.warm[500]} name="time-outline" size={12} />
                  <Text style={styles.kpiMetaPending}>Ödeme: {nextFridayLabel()}</Text>
                </View>
              </View>

              <View style={[styles.kpiCard, styles.kpiSessions]}>
                <Text style={styles.kpiLabelSessions}>Bu Ay Seans</Text>
                <Text style={styles.kpiValueSessions}>{summary.sessionsThisMonth}</Text>
                <Text style={styles.kpiMetaSessions}>Görüşme başı {rateLabel}</Text>
              </View>

              <View style={[styles.kpiCard, styles.kpiTotal]}>
                <Text style={styles.kpiLabelTotal}>Toplam Kazanç</Text>
                <Text style={styles.kpiValueTotal}>{formatStaffTry(summary.totalEarned)}</Text>
                <View style={styles.kpiMetaRow}>
                  <Ionicons color={colors.sage[600]} name="trending-up" size={12} />
                  <Text style={styles.kpiMetaTotal}>Bekleyen + onaylı + ödenen</Text>
                </View>
              </View>
            </View>
          </FadeIn>

          <FadeIn delay={100}>
            <View style={styles.sectionHeader}>
              <Ionicons color={colors.brand[500]} name="wallet-outline" size={20} />
              <Text style={styles.sectionTitle}>Hakediş Geçmişi</Text>
            </View>
          </FadeIn>

          {summary.history.length === 0 ? (
            <EmptyState
              description="Faturalandırılabilir video görüşmeler tamamlandıkça burada görünür."
              icon="wallet-outline"
              title="Henüz hakediş yok"
            />
          ) : (
            summary.history.map((row, i) => {
              const badge = statusColors(row.status);
              return (
                <FadeIn key={row.id} delay={120 + i * 30}>
                  <View style={styles.historyRow}>
                    <View style={styles.historyLeft}>
                      <Text style={styles.historyPeriod}>{row.period}</Text>
                      <Text style={styles.historyMeta}>
                        {row.sessions} faturalandırılabilir görüşme
                      </Text>
                    </View>
                    <View style={styles.historyRight}>
                      <Text style={styles.historyAmount}>{formatStaffTry(row.amount)}</Text>
                      <View style={[styles.statusBadge, { backgroundColor: badge.bg }]}>
                        <Text style={[styles.statusBadgeText, { color: badge.fg }]}>
                          {statusLabel(row.status)}
                        </Text>
                      </View>
                    </View>
                  </View>
                </FadeIn>
              );
            })
          )}
        </>
      )}
    </PanelScaffold>
  );
}

const styles = StyleSheet.create({
  infoBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.brand[100],
    backgroundColor: colors.brand[50],
    paddingHorizontal: spacing.md,
    paddingVertical: 12,
  },
  infoText: {
    flex: 1,
    fontFamily: fonts.sans,
    fontSize: 13,
    lineHeight: 19,
    color: colors.brand[800],
  },
  kpiGrid: { gap: spacing.sm },
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
  historyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
    backgroundColor: colors.white,
    borderRadius: radius.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.cream[200],
  },
  historyLeft: { flex: 1, gap: 2 },
  historyPeriod: { fontFamily: fonts.sansSemi, fontSize: 15, color: colors.cream[900] },
  historyMeta: { fontFamily: fonts.sans, fontSize: 12, color: colors.cream[800] },
  historyRight: { alignItems: 'flex-end', gap: 6 },
  historyAmount: { fontFamily: fonts.sansSemi, fontSize: 15, color: colors.cream[900] },
  statusBadge: {
    borderRadius: radius.full,
    paddingHorizontal: 10,
    paddingVertical: 3,
  },
  statusBadgeText: { fontFamily: fonts.sansSemi, fontSize: 11 },
});
