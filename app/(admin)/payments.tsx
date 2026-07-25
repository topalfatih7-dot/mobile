import { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { PanelScaffold } from '@/components/panel/PanelScaffold';
import { EmptyState } from '@/components/ui/EmptyState';
import { FadeIn } from '@/components/ui/FadeIn';
import { InlineSpinner } from '@/components/ui/InlineSpinner';
import { useData } from '@/context/DataContext';
import { formatTry, getPlanLabel, getTierPrice } from '@/data/membershipPlans';
import { formatRelativeDayTr } from '@/utils/relativeTime';
import { colors, fonts, radius, spacing } from '@/theme';

/** LOCK: docs/mobile/screens/admin/payments.md */
export default function AdminPayments() {
  const { loading, platform } = useData();

  const rows = useMemo(() => {
    const nameById = new Map(
      platform.members.map((m) => [String(m.id), m]),
    );
    return platform.payments.map((p) => {
      const member = nameById.get(String(p.memberId || ''));
      const membership = String(
        p.plan || p.membership || member?.membership || 'free',
      );
      const months = Number(p.months || 1);
      const amount =
        typeof p.amount === 'number'
          ? p.amount
          : getTierPrice(membership, months);
      return {
        id: String(p.id),
        membership,
        months,
        name: String(member?.name || p.memberName || 'Üye'),
        at: String(p.createdAt || p.at || new Date().toISOString()),
        amount,
        source: String(p.source || p.provider || 'IAP'),
      };
    });
  }, [platform.payments, platform.members]);

  return (
    <PanelScaffold showBack subtitle="Ödeme kayıtları" title="Ödemeler">
      {loading && rows.length === 0 ? (
        <InlineSpinner fill />
      ) : rows.length === 0 ? (
        <EmptyState title="Henüz ödeme yok." />
      ) : (
        <>
          <FadeIn>
            <View style={styles.summary}>
              <Text style={styles.summaryText}>Bu ay {rows.length} ödeme</Text>
            </View>
          </FadeIn>
          {rows.map((r, i) => (
            <FadeIn delay={40 + i * 40} key={r.id}>
              <View style={styles.card}>
                <View style={styles.body}>
                  <Text numberOfLines={1} style={styles.title}>
                    {getPlanLabel(r.membership)} · {r.months} ay
                  </Text>
                  <Text style={styles.meta}>{r.name}</Text>
                  <Text style={styles.date}>{formatRelativeDayTr(r.at)}</Text>
                </View>
                <View style={styles.right}>
                  <Text style={styles.amount}>{formatTry(r.amount)}</Text>
                  <View style={styles.badge}>
                    <Text style={styles.badgeText}>{r.source}</Text>
                  </View>
                </View>
              </View>
            </FadeIn>
          ))}
        </>
      )}
    </PanelScaffold>
  );
}

const styles = StyleSheet.create({
  summary: {
    backgroundColor: colors.brand[50],
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.brand[200],
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 4,
  },
  summaryText: { fontFamily: fonts.sansSemi, fontSize: 13, color: colors.brand[700] },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.white,
    borderRadius: radius.xl,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.cream[200],
    minHeight: 64,
  },
  body: { flex: 1 },
  title: { fontFamily: fonts.sansSemi, fontSize: 15, color: colors.cream[900] },
  meta: { fontFamily: fonts.sans, fontSize: 12, color: colors.cream[800], marginTop: 2 },
  date: { fontFamily: fonts.sans, fontSize: 11, color: colors.cream[800], opacity: 0.7, marginTop: 4 },
  right: { alignItems: 'flex-end', gap: 4 },
  amount: { fontFamily: fonts.displayExtra, fontSize: 16, color: colors.brand[700] },
  badge: {
    backgroundColor: colors.brand[100],
    borderRadius: radius.full,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  badgeText: { fontFamily: fonts.sansSemi, fontSize: 10, color: colors.brand[700] },
});
