import { router, type Href } from 'expo-router';
import { Alert, StyleSheet, Text, View } from 'react-native';

import { AppHeader } from '@/components/ui/AppHeader';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Chip } from '@/components/ui/Chip';
import { EmptyState } from '@/components/ui/EmptyState';
import { Screen } from '@/components/ui/Screen';
import { useApp } from '@/context/AppContext';
import { isPaidMembership } from '@/data/membershipPlans';
import { startStripeCheckout } from '@/services/stripePayment';
import { colors, fonts, spacing } from '@/constants/theme';

export default function PublicMembershipScreen() {
  const { plans, session, refresh } = useApp();
  const free = plans.find((p) => p.id === 'free' || p.price === 0);
  const paid = plans.filter((p) => p.isActive && isPaidMembership(p.id));

  const goRegister = (planId: string) => {
    router.push(`/(auth)/register?plan=${encodeURIComponent(planId)}` as Href);
  };

  const onSelectPlan = async (planId: string) => {
    if (!isPaidMembership(planId)) {
      goRegister('free');
      return;
    }

    if (session?.type === 'member') {
      const result = await startStripeCheckout(planId, 'change');
      if (!result.success) {
        Alert.alert('Ödeme başlatılamadı', result.error || 'Tekrar deneyin.');
        return;
      }
      if (result.dismissed) await refresh();
      return;
    }

    goRegister(planId);
  };

  return (
    <Screen scroll contentStyle={styles.content} edges={{ top: true, bottom: true }}>
      <AppHeader showBack subtitle="Paketleri karşılaştır" title="Üyelik" />
      <View style={styles.body}>
        {free ? (
          <Card padding={spacing.lg} style={styles.card}>
            <Text style={styles.name}>{free.name}</Text>
            <Text style={styles.price}>Ücretsiz</Text>
            <Button label="Ücretsiz kayıt ol" onPress={() => goRegister('free')} variant="secondary" />
          </Card>
        ) : (
          <Button label="Ücretsiz kayıt ol" onPress={() => goRegister('free')} variant="secondary" />
        )}

        {paid.length > 0 ? (
          paid.map((plan) => (
            <Card key={plan.id} padding={spacing.lg} style={styles.card}>
              <View style={styles.row}>
                <Text style={styles.name}>{plan.name}</Text>
                {plan.badge ? <Chip label={plan.badge} active /> : null}
              </View>
              <Text style={styles.price}>
                {plan.price.toLocaleString('tr-TR')} ₺
                <Text style={styles.period}>{plan.period ? ` / ${plan.period}` : ''}</Text>
              </Text>
              {(plan.features || []).slice(0, 4).map((f) => (
                <Text key={f} style={styles.feature}>
                  · {f}
                </Text>
              ))}
              <Button
                label={session?.type === 'member' ? 'Paketi seç ve öde' : 'Kayıt ol'}
                onPress={() => void onSelectPlan(plan.id)}
                style={styles.planCta}
              />
            </Card>
          ))
        ) : (
          <EmptyState
            subtitle="Paket bilgileri yükleniyor veya henüz yayınlanmadı."
            title="Paket bulunamadı"
          />
        )}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { paddingHorizontal: 0 },
  body: { paddingHorizontal: spacing.lg, paddingBottom: spacing.xl, gap: spacing.md },
  card: {},
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.sm },
  name: { fontFamily: fonts.display, fontSize: 20, color: colors.text.primary, flex: 1 },
  price: {
    fontFamily: fonts.displayExtra,
    fontSize: 28,
    color: colors.teal[600],
    marginTop: spacing.sm,
    marginBottom: spacing.md,
  },
  period: { fontFamily: fonts.regular, fontSize: 14, color: colors.text.secondary },
  feature: {
    fontFamily: fonts.regular,
    fontSize: 14,
    color: colors.text.secondary,
    lineHeight: 22,
  },
  planCta: { marginTop: spacing.md },
});
