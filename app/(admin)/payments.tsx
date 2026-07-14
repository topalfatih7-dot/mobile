import { useCallback, useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { AdminPanelScreen } from '@/components/admin/AdminPanelScreen';
import { Card } from '@/components/ui/Card';
import { fetchAllMembers } from '@/services/db/members';
import {
  fetchAllPayments,
  formatTry,
  paymentPlanLabel,
  type MemberPayment,
} from '@/services/db/payments';
import { colors, fonts, spacing } from '@/constants/theme';

export default function AdminPaymentsScreen() {
  const [payments, setPayments] = useState<MemberPayment[]>([]);
  const [names, setNames] = useState<Record<string, string>>({});

  const load = useCallback(async () => {
    const [list, members] = await Promise.all([fetchAllPayments(120), fetchAllMembers()]);
    const map: Record<string, string> = {};
    members.forEach((m) => {
      map[m.id] = m.name;
    });
    setNames(map);
    setPayments(list);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <AdminPanelScreen
      emptySubtitle="Ödeme ve abonelik kayıtları burada görünecek."
      emptyTitle="Ödeme kaydı yok"
      subtitle={`${payments.length} kayıt`}
      title="Finans">
      {payments.length > 0
        ? payments.map((p) => (
            <Card key={p.id} padding={spacing.md} style={styles.card}>
              <Text style={styles.date}>
                {p.createdAt
                  ? new Date(p.createdAt).toLocaleDateString('tr-TR', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                    })
                  : '—'}
              </Text>
              <Text style={styles.name}>{names[p.memberId || ''] || 'Üye'}</Text>
              <Text style={styles.plan}>{paymentPlanLabel(p)}</Text>
              <Text style={styles.amount}>
                {formatTry(typeof p.amount === 'number' ? p.amount : undefined)}
              </Text>
            </Card>
          ))
        : null}
    </AdminPanelScreen>
  );
}

const styles = StyleSheet.create({
  card: { marginBottom: spacing.sm },
  date: { fontFamily: fonts.medium, fontSize: 12, color: colors.text.muted },
  name: { fontFamily: fonts.semibold, fontSize: 15, color: colors.text.primary, marginTop: 4 },
  plan: { fontFamily: fonts.regular, fontSize: 13, color: colors.text.secondary, marginTop: 2 },
  amount: { fontFamily: fonts.display, fontSize: 18, color: colors.champagne[600], marginTop: 6 },
});
