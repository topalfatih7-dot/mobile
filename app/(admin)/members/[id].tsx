import { useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ProfileInfoGrid } from '@/components/profile/ProfileInfoGrid';
import { ResponsiveCenter } from '@/components/layout/ResponsiveCenter';
import { Card } from '@/components/ui/Card';
import { StackHeader } from '@/components/ui/StackHeader';
import { getPlanLabel } from '@/data/membershipPlans';
import { useResponsive } from '@/hooks/useResponsive';
import { fetchMemberById } from '@/services/db/members';
import { buildPersonalInfoRows } from '@/services/memberProfile';
import type { MemberProfile } from '@/types/session';
import { colors, fonts, spacing } from '@/constants/theme';

export default function AdminMemberDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const { horizontalPadding } = useResponsive();
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

  return (
    <View style={[styles.root, { paddingBottom: insets.bottom }]}>
      <StackHeader subtitle="Üye kaydı detayı" title={member?.name || 'Üye Detayı'} />

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <ResponsiveCenter innerStyle={{ paddingHorizontal: horizontalPadding }}>
          {loading ? (
            <ActivityIndicator color={colors.brand[600]} size="large" style={styles.loader} />
          ) : member ? (
            <>
              <Card padding={spacing.lg} style={styles.summary}>
                <Text style={styles.plan}>{getPlanLabel(member.membership as string)}</Text>
                <Text style={styles.status}>{member.membershipStatus || 'active'}</Text>
                <Text style={styles.email}>{member.email}</Text>
              </Card>
              <ProfileInfoGrid rows={rows} />
            </>
          ) : (
            <Card padding={spacing.lg}>
              <Text style={styles.empty}>Üye bulunamadı.</Text>
            </Card>
          )}
        </ResponsiveCenter>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  content: { paddingTop: spacing.md, paddingBottom: spacing.xxl },
  loader: { marginTop: spacing.xxl },
  summary: { marginBottom: spacing.lg },
  plan: { fontFamily: fonts.displayExtra, fontSize: 22, color: colors.text.primary },
  status: {
    fontFamily: fonts.semibold,
    fontSize: 13,
    color: colors.brand[600],
    marginTop: 4,
    textTransform: 'capitalize',
  },
  email: {
    fontFamily: fonts.regular,
    fontSize: 14,
    color: colors.text.secondary,
    marginTop: spacing.sm,
  },
  empty: { fontFamily: fonts.regular, fontSize: 14, color: colors.text.secondary },
});
