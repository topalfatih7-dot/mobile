import { router, useLocalSearchParams, type Href } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';

import { ProfileInfoGrid } from '@/components/profile/ProfileInfoGrid';
import { AppHeader } from '@/components/ui/AppHeader';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { Screen } from '@/components/ui/Screen';
import { describeHealthTest } from '@/data/healthTest';
import { getPlanLabel } from '@/data/membershipPlans';
import { fetchMemberById } from '@/services/db/members';
import { buildPersonalInfoRows } from '@/services/memberProfile';
import type { MemberProfile } from '@/types/session';
import { colors, fonts, spacing } from '@/constants/theme';

export default function StaffClientHealthScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [member, setMember] = useState<MemberProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void (async () => {
      if (!id) return;
      setLoading(true);
      try {
        setMember(await fetchMemberById(id));
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  const rows = buildPersonalInfoRows(member, member?.email || '');
  const healthSections = useMemo(() => {
    const ht = (member?.healthTest as Record<string, unknown> | undefined) || null;
    if (!ht) return [];
    const gender = (member?.gender as string | undefined) || undefined;
    const pkg = (member?.packageConfig as Record<string, unknown> | null) || null;
    return (describeHealthTest as (ht: unknown, gender?: string, pkg?: unknown) => {
      id: string;
      title: string;
      items: { label: string; value: string }[];
    }[])(ht, gender, pkg);
  }, [member]);

  const rawPairs = useMemo(() => {
    const ht = member?.healthTest;
    if (!ht || typeof ht !== 'object' || Array.isArray(ht)) return [];
    return Object.entries(ht as Record<string, unknown>)
      .filter(([k, v]) => k !== 'completedSections' && v !== '' && v != null)
      .map(([key, value]) => ({
        key,
        value: Array.isArray(value) ? value.join(', ') : String(value),
      }));
  }, [member]);

  return (
    <Screen scroll contentStyle={styles.content} edges={{ top: true, bottom: true }}>
      <AppHeader
        showBack
        subtitle="Danışan sağlık profili"
        title={member?.name || 'Sağlık Profili'}
      />

      {loading ? (
        <ActivityIndicator color={colors.teal[600]} size="large" style={styles.loader} />
      ) : member ? (
        <View style={styles.body}>
          <Card padding={spacing.lg} style={styles.summary}>
            <Text style={styles.plan}>{getPlanLabel(member.membership as string)}</Text>
            <Text style={styles.status}>{String(member.membershipStatus || 'active')}</Text>
            <Text style={styles.email}>{member.email}</Text>
          </Card>

          <Text style={styles.section}>Kişisel & ölçüm bilgileri</Text>
          <ProfileInfoGrid rows={rows} />

          <Text style={[styles.section, styles.sectionTop]}>Sağlık testi cevapları</Text>
          {healthSections.length > 0 ? (
            healthSections.map((sec) => (
              <Card key={sec.id} padding={spacing.md} style={styles.healthCard}>
                <Text style={styles.healthTitle}>{sec.title}</Text>
                {sec.items.map((item, i) => (
                  <View key={`${sec.id}-${i}`} style={styles.kv}>
                    <Text style={styles.k}>{item.label}</Text>
                    <Text style={styles.v}>{item.value}</Text>
                  </View>
                ))}
              </Card>
            ))
          ) : rawPairs.length > 0 ? (
            <Card padding={spacing.md} style={styles.healthCard}>
              {rawPairs.map((pair) => (
                <View key={pair.key} style={styles.kv}>
                  <Text style={styles.k}>{pair.key}</Text>
                  <Text style={styles.v}>{pair.value}</Text>
                </View>
              ))}
            </Card>
          ) : (
            <EmptyState
              subtitle="Bu danışan henüz sağlık testi cevaplarını kaydetmemiş."
              title="Cevap yok"
            />
          )}

          <Button
            label="Programa git"
            onPress={() => router.push(`/(staff)/clients/${id}/program` as Href)}
            style={styles.cta}
            variant="secondary"
          />
        </View>
      ) : (
        <EmptyState subtitle="Bu danışan kaydı bulunamadı veya erişiminiz yok." title="Danışan bulunamadı" />
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { paddingHorizontal: 0 },
  body: { paddingHorizontal: spacing.lg, paddingBottom: spacing.xl },
  loader: { marginTop: spacing.xxl },
  summary: { marginBottom: spacing.lg },
  plan: { fontFamily: fonts.displayExtra, fontSize: 22, color: colors.text.primary },
  status: {
    fontFamily: fonts.semibold,
    fontSize: 13,
    color: colors.teal[600],
    marginTop: 4,
    textTransform: 'capitalize',
  },
  email: {
    fontFamily: fonts.regular,
    fontSize: 14,
    color: colors.text.secondary,
    marginTop: spacing.sm,
  },
  section: {
    fontFamily: fonts.display,
    fontSize: 16,
    color: colors.text.primary,
    marginBottom: spacing.md,
  },
  sectionTop: { marginTop: spacing.xl },
  healthCard: { marginBottom: spacing.md },
  healthTitle: {
    fontFamily: fonts.semibold,
    fontSize: 14,
    color: colors.teal[700],
    marginBottom: spacing.sm,
  },
  kv: { marginBottom: spacing.sm },
  k: { fontFamily: fonts.medium, fontSize: 12, color: colors.text.muted },
  v: { fontFamily: fonts.regular, fontSize: 14, color: colors.text.primary, marginTop: 2 },
  cta: { marginTop: spacing.xl },
});
