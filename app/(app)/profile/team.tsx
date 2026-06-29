import { Ionicons } from '@expo/vector-icons';
import { router, type Href } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';

import { Avatar } from '@/components/ui/Avatar';
import { ResponsiveCenter } from '@/components/layout/ResponsiveCenter';
import { Card } from '@/components/ui/Card';
import { PressableScale } from '@/components/ui/PressableScale';
import { StackHeader } from '@/components/ui/StackHeader';
import { useApp } from '@/context/AppContext';
import { colors, fonts, gradients, radius, spacing, type Gradient } from '@/constants/theme';
import { packageIncludesCoach, packageIncludesDietitian } from '@/data/membershipPlans';
import { useResponsive } from '@/hooks/useResponsive';
import { fetchStaffByIds } from '@/services/db/staff';
import { getMemberPackageConfig } from '@/services/memberProfile';
import type { StaffProfile } from '@/types/session';

type TeamMember = {
  id: string;
  role: 'coach' | 'dietitian';
  title: string;
  name: string;
  subtitle: string;
  gradient: Gradient;
  threadId?: string;
};

function StaffCard({ member, onMessage }: { member: TeamMember; onMessage?: () => void }) {
  return (
    <Card padding={spacing.md} style={styles.staffCard}>
      <View style={styles.staffRow}>
        <Avatar gradient={member.gradient} name={member.name} size={54} />
        <View style={styles.staffBody}>
          <Text style={styles.staffRole}>{member.title}</Text>
          <Text style={styles.staffName}>{member.name}</Text>
          <Text style={styles.staffSub}>{member.subtitle}</Text>
        </View>
      </View>

      {onMessage ? (
        <PressableScale onPress={onMessage} scaleTo={0.98} style={styles.messageBtn}>
          <Ionicons color={colors.brand[600]} name="chatbubble-ellipses-outline" size={18} />
          <Text style={styles.messageText}>Mesaj Gönder</Text>
        </PressableScale>
      ) : null}
    </Card>
  );
}

export default function TeamScreen() {
  const { member, conversations } = useApp();
  const { horizontalPadding } = useResponsive();
  const [staff, setStaff] = useState<StaffProfile[]>([]);
  const [loading, setLoading] = useState(true);

  const packageConfig = getMemberPackageConfig(member);
  const hasCoach = packageIncludesCoach(packageConfig);
  const hasDietitian = packageIncludesDietitian(packageConfig);

  useEffect(() => {
    void (async () => {
      setLoading(true);
      const ids = [member?.assignedCoachId, member?.assignedDietitianId].filter(
        (id): id is string => typeof id === 'string' && id.length > 0,
      );
      const rows = await fetchStaffByIds(ids);
      setStaff(rows);
      setLoading(false);
    })();
  }, [member?.assignedCoachId, member?.assignedDietitianId]);

  const coach = staff.find((s) => s.id === member?.assignedCoachId);
  const dietitian = staff.find((s) => s.id === member?.assignedDietitianId);

  const team = useMemo(() => {
    const items: TeamMember[] = [];

    if (hasCoach) {
      const thread = conversations.find((c) => c.role === 'Kişisel Koç');
      items.push({
        id: coach?.id || 'coach',
        role: 'coach',
        title: 'Kişisel Koç',
        name: coach?.name || thread?.name || 'Henüz atanmadı',
        subtitle: coach ? 'Aktif koçunuz' : 'Paketinize koç atandığında burada görünür',
        gradient: gradients.coral,
        threadId: thread?.id,
      });
    }

    if (hasDietitian) {
      const thread = conversations.find((c) => c.role === 'Diyetisyen');
      items.push({
        id: dietitian?.id || 'dietitian',
        role: 'dietitian',
        title: 'Diyetisyen',
        name: dietitian?.name || thread?.name || 'Henüz atanmadı',
        subtitle: dietitian ? 'Aktif diyetisyeniniz' : 'Paketinize diyetisyen atandığında burada görünür',
        gradient: gradients.forest,
        threadId: thread?.id,
      });
    }

    return items;
  }, [coach, dietitian, conversations, hasCoach, hasDietitian]);

  return (
    <View style={styles.root}>
      <StatusBar style="dark" />
      <StackHeader subtitle="Atanmış uzmanlarınız" title="Koçum & Diyetisyenim" />

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <ResponsiveCenter innerStyle={{ paddingHorizontal: horizontalPadding }}>
          {loading ? (
            <ActivityIndicator color={colors.brand[600]} size="large" style={styles.loader} />
          ) : team.length === 0 ? (
            <Card padding={spacing.lg}>
              <Text style={styles.emptyTitle}>Uzman ataması yok</Text>
              <Text style={styles.emptyBody}>
                Mevcut paketinizde birebir koç veya diyetisyen görüşmesi bulunmuyor. Planınızı
                yükselttiğinizde uzmanlarınız burada listelenir.
              </Text>
            </Card>
          ) : (
            team.map((item) => (
              <StaffCard
                key={item.id}
                member={item}
                onMessage={
                  item.threadId
                    ? () => router.push(`/messages/${item.threadId}` as Href)
                    : undefined
                }
              />
            ))
          )}
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
    paddingTop: spacing.md,
    paddingBottom: spacing.xxl,
  },
  loader: {
    marginTop: spacing.xxl,
  },
  staffCard: {
    marginBottom: spacing.md,
  },
  staffRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  staffBody: {
    flex: 1,
    marginLeft: spacing.md,
  },
  staffRole: {
    fontFamily: fonts.semibold,
    fontSize: 11.5,
    color: colors.brand[600],
  },
  staffName: {
    fontFamily: fonts.display,
    fontSize: 17,
    color: colors.text.primary,
    marginTop: 2,
  },
  staffSub: {
    fontFamily: fonts.regular,
    fontSize: 13,
    color: colors.text.secondary,
    marginTop: 3,
  },
  messageBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    marginTop: spacing.md,
    paddingVertical: 12,
    borderRadius: radius.md,
    backgroundColor: colors.brand[50],
    borderWidth: 1,
    borderColor: colors.brand[100],
  },
  messageText: {
    fontFamily: fonts.semibold,
    fontSize: 14,
    color: colors.brand[700],
  },
  emptyTitle: {
    fontFamily: fonts.display,
    fontSize: 18,
    color: colors.text.primary,
  },
  emptyBody: {
    fontFamily: fonts.regular,
    fontSize: 14,
    lineHeight: 21,
    color: colors.text.secondary,
    marginTop: spacing.sm,
  },
});
