import { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';

import { AppHeader } from '@/components/ui/AppHeader';
import { EmptyState } from '@/components/ui/EmptyState';
import { Screen } from '@/components/ui/Screen';
import { useApp } from '@/context/AppContext';
import {
  fetchAllPayments,
  fetchPaymentsForMemberIds,
  formatTry,
  paymentPlanLabel,
  type MemberPayment,
} from '@/services/db/payments';
import { fetchAllMembers } from '@/services/db/members';
import { getStaffClients } from '@/utils/staffAccess';
import { colors, fonts, radius, spacing } from '@/constants/theme';

const STATUS_LABELS: Record<string, string> = {
  completed: 'Tamamlandı',
  paid: 'Ödendi',
  pending: 'Bekliyor',
  refunded: 'İade',
};

export default function StaffPaymentsScreen() {
  const { staff } = useApp();
  const [loading, setLoading] = useState(true);
  const [payments, setPayments] = useState<MemberPayment[]>([]);
  const [nameById, setNameById] = useState<Record<string, string>>({});

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const members = await fetchAllMembers();
      const clients = getStaffClients(members, staff?.role, staff?.id);
      const map: Record<string, string> = {};
      members.forEach((m) => {
        map[m.id] = m.name;
      });
      setNameById(map);

      if (clients.length > 0) {
        setPayments(await fetchPaymentsForMemberIds(clients.map((c) => c.id)));
      } else {
        // Atama yoksa genel ödeme listesi (RLS izin verirse); aksi halde boş.
        const all = await fetchAllPayments(40);
        setPayments(all);
      }
    } finally {
      setLoading(false);
    }
  }, [staff?.id, staff?.role]);

  useEffect(() => {
    void load();
  }, [load]);

  const subtitle = useMemo(
    () => (payments.length ? `${payments.length} kayıt` : 'Danışan ödeme kayıtları'),
    [payments.length],
  );

  return (
    <Screen scroll contentStyle={styles.content} edges={{ top: true, bottom: true }}>
      <AppHeader showBack subtitle={subtitle} title="Ödemeler" />
      <View style={styles.body}>
        {loading ? (
          <ActivityIndicator color={colors.teal[600]} size="large" style={styles.loader} />
        ) : payments.length === 0 ? (
          <EmptyState
            subtitle="Atanmış danışanların ödeme kayıtları burada görünür."
            title="Ödeme kaydı yok"
          />
        ) : (
          payments.map((p) => {
            const date = p.createdAt
              ? new Date(p.createdAt).toLocaleDateString('tr-TR', {
                  day: 'numeric',
                  month: 'short',
                  year: 'numeric',
                })
              : '—';
            const status = String(p.status || 'completed');
            return (
              <View key={p.id} style={styles.card}>
                <View style={styles.row}>
                  <Text style={styles.date}>{date}</Text>
                  <Text style={styles.status}>{STATUS_LABELS[status] || status}</Text>
                </View>
                <Text style={styles.member}>{nameById[p.memberId || ''] || 'Üye'}</Text>
                <Text style={styles.plan}>{paymentPlanLabel(p)}</Text>
                <Text style={styles.amount}>
                  {formatTry(typeof p.amount === 'number' ? p.amount : undefined)}
                </Text>
              </View>
            );
          })
        )}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { paddingHorizontal: 0 },
  body: { paddingHorizontal: spacing.lg, paddingBottom: spacing.xl, gap: spacing.sm },
  loader: { marginTop: spacing.xxl },
  card: {
    padding: spacing.md,
    borderRadius: radius.lg,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  date: { fontFamily: fonts.medium, fontSize: 12, color: colors.text.muted },
  status: { fontFamily: fonts.semibold, fontSize: 12, color: colors.teal[600] },
  member: { fontFamily: fonts.semibold, fontSize: 15, color: colors.text.primary, marginTop: 6 },
  plan: { fontFamily: fonts.regular, fontSize: 13, color: colors.text.secondary, marginTop: 2 },
  amount: { fontFamily: fonts.display, fontSize: 18, color: colors.champagne[600], marginTop: 6 },
});
