import { router, type Href } from 'expo-router';
import { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';

import { Button } from '@/components/ui/Button';
import { FadeIn } from '@/components/ui/FadeIn';
import { MeshBackground } from '@/components/ui/MeshBackground';
import {
  ALL_PLANS,
  DURATION_OPTIONS,
  formatTry,
  getTierPrice,
  isOneTimeBillingPlan,
  RECOMMENDED_DURATION_MONTHS,
  RECOMMENDED_PLAN,
  sortPlansForDisplay,
} from '@/data/membershipPlans';
import { colors, fonts, radius, spacing } from '@/theme';

/** LOCK: docs/mobile/screens/public/membership.md */
export default function MembershipScreen() {
  const insets = useSafeAreaInsets();
  const [months, setMonths] = useState(RECOMMENDED_DURATION_MONTHS);
  const plans = useMemo(() => sortPlansForDisplay(ALL_PLANS), []);

  const cta = (planId: string) => {
    const m = isOneTimeBillingPlan(planId) ? 1 : months;
    router.push(`/(auth)/onboarding?plan=${planId}&months=${m}` as Href);
  };

  return (
    <MeshBackground style={styles.root}>
      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingTop: insets.top + spacing.lg, paddingBottom: insets.bottom + spacing.xxl },
        ]}
        showsVerticalScrollIndicator={false}>
        <FadeIn>
          <Pressable onPress={() => router.back()} style={styles.back}>
            <Text style={styles.backText}>← Geri</Text>
          </Pressable>
          <Text style={styles.title}>Size en uygun planı seçin</Text>
          <Text style={styles.sub}>
            Ücretsiz başlayın veya uzman destekli paketlerden birini seçin. Gizli ücret yok.
          </Text>
        </FadeIn>

        <FadeIn delay={80} style={styles.how}>
          <Text style={styles.howTitle}>Nasıl üye olunur?</Text>
          {['Planınızı seçin', 'Güvenle kayıt olun', 'Hemen başlayın'].map((t, i) => (
            <View key={t} style={styles.howRow}>
              <View style={styles.howNum}>
                <Text style={styles.howNumText}>{i + 1}</Text>
              </View>
              <Text style={styles.howText}>{t}</Text>
            </View>
          ))}
        </FadeIn>

        <FadeIn delay={120}>
          <View style={styles.durationRow}>
            {DURATION_OPTIONS.map((opt) => (
              <Pressable
                key={opt.months}
                onPress={() => setMonths(opt.months)}
                style={[styles.durationChip, months === opt.months && styles.durationOn]}>
                <Text style={[styles.durationText, months === opt.months && styles.durationTextOn]}>
                  {opt.label}
                </Text>
              </Pressable>
            ))}
          </View>
        </FadeIn>

        {plans.map((plan, i) => {
          const price = getTierPrice(plan.id, isOneTimeBillingPlan(plan.id) ? 1 : months);
          const recommended = plan.id === RECOMMENDED_PLAN;
          return (
            <FadeIn key={plan.id} delay={140 + i * 40}>
              <LinearGradient
                colors={
                  recommended
                    ? [colors.brand[500], colors.sage[500]]
                    : [colors.white, colors.cream[50]]
                }
                style={[styles.card, recommended && styles.cardRec]}>
                <View style={recommended ? undefined : styles.cardInner}>
                  {recommended ? (
                    <Text style={styles.recBadge}>Önerilen · VIP</Text>
                  ) : null}
                  <Text style={[styles.cardName, recommended && styles.onDark]}>{plan.name}</Text>
                  <Text style={[styles.cardPrice, recommended && styles.onDark]}>
                    {plan.id === 'free' ? 'Ücretsiz' : formatTry(price || plan.price)}
                  </Text>
                  <Text style={[styles.cardBlurb, recommended && styles.onDarkMuted]}>
                    {plan.blurb}
                  </Text>
                  <Button
                    label={plan.id === 'free' ? 'Ücretsiz başla' : 'Bu planla devam'}
                    onPress={() => cta(plan.id)}
                    style={{ marginTop: spacing.md }}
                    variant={recommended ? 'glass' : 'primary'}
                  />
                </View>
              </LinearGradient>
            </FadeIn>
          );
        })}
      </ScrollView>
    </MeshBackground>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  content: { paddingHorizontal: spacing.lg, gap: spacing.md },
  back: { paddingVertical: 6, marginBottom: 4 },
  backText: { fontFamily: fonts.sansSemi, color: colors.brand[700], fontSize: 14 },
  title: {
    fontFamily: fonts.displayExtra,
    fontSize: 30,
    color: colors.cream[900],
    letterSpacing: -0.4,
  },
  sub: {
    fontFamily: fonts.sans,
    fontSize: 15,
    lineHeight: 22,
    color: colors.cream[800],
    marginTop: 6,
  },
  how: {
    backgroundColor: colors.white,
    borderRadius: radius.xl,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.cream[200],
    gap: spacing.sm,
  },
  howTitle: {
    fontFamily: fonts.displayBold,
    fontSize: 16,
    color: colors.cream[900],
    marginBottom: 4,
  },
  howRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  howNum: {
    width: 28,
    height: 28,
    borderRadius: 10,
    backgroundColor: colors.brand[100],
    alignItems: 'center',
    justifyContent: 'center',
  },
  howNumText: { fontFamily: fonts.sansSemi, color: colors.brand[700], fontSize: 13 },
  howText: { fontFamily: fonts.sansMedium, fontSize: 14, color: colors.cream[900] },
  durationRow: { flexDirection: 'row', gap: spacing.sm },
  durationChip: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 10,
    borderRadius: radius.lg,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.cream[200],
  },
  durationOn: { borderColor: colors.brand[500], backgroundColor: colors.brand[50] },
  durationText: { fontFamily: fonts.sansMedium, fontSize: 13, color: colors.cream[800] },
  durationTextOn: { fontFamily: fonts.sansSemi, color: colors.brand[700] },
  card: {
    borderRadius: 24,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.cream[200],
    overflow: 'hidden',
  },
  cardRec: { borderWidth: 0 },
  cardInner: {},
  recBadge: {
    alignSelf: 'flex-start',
    fontFamily: fonts.sansSemi,
    fontSize: 11,
    color: colors.white,
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: radius.full,
    overflow: 'hidden',
    marginBottom: spacing.sm,
  },
  cardName: {
    fontFamily: fonts.displayBold,
    fontSize: 22,
    color: colors.cream[900],
  },
  cardPrice: {
    fontFamily: fonts.displayExtra,
    fontSize: 26,
    color: colors.brand[700],
    marginTop: 4,
  },
  cardBlurb: {
    fontFamily: fonts.sans,
    fontSize: 14,
    color: colors.cream[800],
    marginTop: 6,
    lineHeight: 20,
  },
  onDark: { color: colors.white },
  onDarkMuted: { color: 'rgba(255,255,255,0.9)' },
});
