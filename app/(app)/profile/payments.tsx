import { AppHeader } from '@/components/ui/AppHeader';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { Screen } from '@/components/ui/Screen';
import { useApp } from '@/context/AppContext';
import {
  fetchMemberPayments,
  formatTry,
  paymentPlanLabel,
  type MemberPayment,
} from '@/services/db/payments';
import { colors, fonts, radius, spacing } from '@/constants/theme';
import { router, type Href } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';

const STATUS_LABELS: Record<string, string> = {
  completed: 'Tamamlandı',
  paid: 'Ödendi',
  pending: 'Bekliyor',
  refunded: 'İade',
};

export default function PaymentsScreen() {
  const { member } = useApp();
  const [loading, setLoading] = useState(true);
  const [payments, setPayments] = useState<MemberPayment[]>([]);

  const load = useCallback(async () => {
    if (!member?.id) {
      setPayments([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      setPayments(await fetchMemberPayments(member.id));
    } finally {
      setLoading(false);
    }
  }, [member?.id]);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <Screen scroll contentStyle={styles.screen}>
      <StatusBar style="dark" />
      <AppHeader showBack subtitle="Stripe Checkout kayıtları" title="Ödeme Yönetimi" />

      <View style={styles.content}>
      <View style={styles.note}>
        <Text style={styles.noteTitle}>Ödeme yöntemi</Text>
        <Text style={styles.noteBody}>
          Ücretli paket satın alımları güvenli Stripe Checkout ile yapılır. Geçmiş ödemeler aşağıda
          listelenir.
        </Text>
      </View>

      <Button
        label="Paket yükselt"
        onPress={() => router.push('/profile/membership' as Href)}
        rightIcon="arrow-forward"
        variant="secondary"
      />

      <Text style={styles.sectionTitle}>Ödeme geçmişim</Text>

      {loading ? (
        <ActivityIndicator color={colors.teal[600]} style={styles.loader} />
      ) : payments.length === 0 ? (
        <EmptyState
          subtitle="Ücretli paket satın aldığınızda ödemeleriniz burada listelenir."
          title="Henüz ödeme kaydı yok"
        />
      ) : (
        <View style={styles.list}>
          {payments.map((p) => {
            const date = p.createdAt
              ? new Date(p.createdAt).toLocaleDateString('tr-TR', {
                  day: 'numeric',
                  month: 'short',
                  year: 'numeric',
                })
              : '—';
            const status = p.status || 'completed';
            return (
              <View key={p.id} style={styles.card}>
                <View style={styles.row}>
                  <Text style={styles.date}>{date}</Text>
                  <View style={styles.status}>
                    <Text style={styles.statusText}>{STATUS_LABELS[status] || status}</Text>
                  </View>
                </View>
                <Text style={styles.plan}>{paymentPlanLabel(p)}</Text>
                <Text style={styles.amount}>{formatTry(typeof p.amount === 'number' ? p.amount : undefined)}</Text>
              </View>
            );
          })}
        </View>
      )}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  screen: {
    paddingHorizontal: 0,
    paddingBottom: spacing.xxl,
  },
  content: {
    paddingHorizontal: spacing.lg,
    gap: spacing.md,
  },
  note: {
    padding: spacing.md,
    borderRadius: radius.lg,
    backgroundColor: '#FAF6F0',
    borderWidth: 1,
    borderColor: colors.border,
  },
  noteTitle: {
    fontFamily: fonts.semibold,
    fontSize: 14,
    color: colors.text.primary,
  },
  noteBody: {
    marginTop: 6,
    fontFamily: fonts.regular,
    fontSize: 13.5,
    lineHeight: 20,
    color: colors.text.secondary,
  },
  sectionTitle: {
    fontFamily: fonts.displaySemibold,
    fontSize: 17,
    color: colors.text.primary,
  },
  loader: {
    marginTop: spacing.lg,
  },
  list: {
    gap: spacing.sm,
  },
  card: {
    padding: spacing.md,
    borderRadius: radius.lg,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  date: {
    fontFamily: fonts.medium,
    fontSize: 13,
    color: colors.text.secondary,
  },
  status: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: radius.full,
    backgroundColor: colors.teal[50],
  },
  statusText: {
    fontFamily: fonts.semibold,
    fontSize: 11.5,
    color: colors.teal[700],
  },
  plan: {
    marginTop: spacing.sm,
    fontFamily: fonts.semibold,
    fontSize: 15,
    color: colors.text.primary,
  },
  amount: {
    marginTop: 4,
    fontFamily: fonts.displaySemibold,
    fontSize: 16,
    color: colors.teal[700],
  },
});
