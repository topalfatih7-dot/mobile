import { Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { ProfileInfoGrid } from '@/components/profile/ProfileInfoGrid';
import { ResponsiveCenter } from '@/components/layout/ResponsiveCenter';
import { Card } from '@/components/ui/Card';
import { StackHeader } from '@/components/ui/StackHeader';
import { useApp } from '@/context/AppContext';
import { useResponsive } from '@/hooks/useResponsive';
import { buildMembershipSummary, buildPersonalInfoRows } from '@/services/memberProfile';
import { colors, fonts, radius, spacing } from '@/constants/theme';

function formatDate(iso?: string) {
  if (!iso) return '—';
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return date.toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' });
}

export default function MembershipScreen() {
  const { member, user } = useApp();
  const { horizontalPadding } = useResponsive();
  const summary = buildMembershipSummary(member);
  const infoRows = buildPersonalInfoRows(member, user.email);

  return (
    <View style={styles.root}>
      <StatusBar style="dark" />
      <StackHeader subtitle="Aktif paket ve haklarınız" title="Üyeliğim" />

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

          <Text style={styles.sectionTitle}>Kişisel Bilgiler</Text>
          <ProfileInfoGrid rows={infoRows} />

          <Card padding={spacing.md} style={styles.note}>
            <Text style={styles.noteText}>
              Plan değişikliği veya üyelik sorularınız için destek ekibimizle iletişime geçebilirsiniz.
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
    marginBottom: spacing.md,
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
