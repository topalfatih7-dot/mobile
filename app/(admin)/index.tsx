import { Ionicons } from '@expo/vector-icons';
import { router, type Href } from 'expo-router';
import type { ComponentProps } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { PanelScaffold } from '@/components/panel/PanelScaffold';
import { Button } from '@/components/ui/Button';
import { FadeIn } from '@/components/ui/FadeIn';
import { InlineSpinner } from '@/components/ui/InlineSpinner';
import { useAuth } from '@/context/AuthContext';
import { useData } from '@/context/DataContext';
import { ADMIN_NAV } from '@/data/adminNav';
import { colors, fonts, radius, spacing } from '@/theme';

type IconName = ComponentProps<typeof Ionicons>['name'];

const NAV_ICONS: Record<string, IconName> = {
  '/(admin)/members': 'people',
  '/(admin)/premium': 'star',
  '/(admin)/sessions': 'calendar',
  '/(admin)/applications': 'document-text',
  '/(admin)/staff': 'id-card',
  '/(admin)/support': 'chatbubble-ellipses',
  '/(admin)/messages': 'mail',
  '/(admin)/library': 'barbell',
  '/(admin)/blog': 'newspaper',
  '/(admin)/content': 'layers',
  '/(admin)/payments': 'card',
  '/(admin)/plans': 'pricetags',
  '/(admin)/subscriptions': 'repeat',
  '/(admin)/analytics': 'stats-chart',
  '/(admin)/activity': 'pulse',
  '/(admin)/ai-costs': 'sparkles',
  '/(admin)/account': 'person-circle',
};

const NAV_GROUPS: Record<'ops' | 'content' | 'system', string[]> = {
  ops: [
    '/(admin)/members',
    '/(admin)/premium',
    '/(admin)/sessions',
    '/(admin)/applications',
    '/(admin)/staff',
    '/(admin)/support',
    '/(admin)/messages',
    '/(admin)/library',
    '/(admin)/payments',
    '/(admin)/plans',
    '/(admin)/subscriptions',
  ],
  content: ['/(admin)/blog', '/(admin)/content'],
  system: ['/(admin)/analytics', '/(admin)/activity', '/(admin)/ai-costs', '/(admin)/account'],
};

/** LOCK: docs/mobile/screens/admin/overview.md */
export default function AdminOverview() {
  const { email, logout } = useAuth();
  const { loading, platform } = useData();
  const s = platform.adminStats;
  const unassigned = platform.members.filter(
    (m) => !m.assignedCoachId && !m.assignedDietitianId && !m.assignedDoctorId,
  ).length;

  const kpis: {
    label: string;
    value: number;
    icon: IconName;
    iconBg: string;
    iconColor: string;
  }[] = [
    {
      label: 'Üye',
      value: s.members,
      icon: 'people',
      iconBg: colors.brand[50],
      iconColor: colors.brand[600],
    },
    {
      label: 'Aktif seans',
      value: 0,
      icon: 'videocam',
      iconBg: colors.sage[50],
      iconColor: colors.sage[600],
    },
    {
      label: 'Açık talep',
      value: s.openTickets,
      icon: 'help-buoy',
      iconBg: colors.warm[50],
      iconColor: colors.warm[500],
    },
    {
      label: 'Atamasız üye',
      value: unassigned,
      icon: 'person-add',
      iconBg: `${colors.gold[400]}1F`,
      iconColor: colors.gold[500],
    },
  ];

  return (
    <PanelScaffold subtitle="Yeni Form operasyon paneli" title="Genel bakış">
      {loading && platform.members.length === 0 ? (
        <InlineSpinner fill />
      ) : (
        <>
      <View style={styles.kpiGrid}>
        {kpis.map((k, i) => (
          <FadeIn delay={i * 40} key={k.label} style={styles.kpiWrap}>
            <View style={styles.kpi}>
              <View style={[styles.kpiIcon, { backgroundColor: k.iconBg }]}>
                <Ionicons color={k.iconColor} name={k.icon} size={20} />
              </View>
              <Text style={styles.kpiVal}>{k.value}</Text>
              <Text style={styles.kpiLabel}>{k.label}</Text>
            </View>
          </FadeIn>
        ))}
      </View>

      {(['ops', 'content', 'system'] as const).map((group) => (
        <FadeIn delay={60} key={group}>
          <Text style={styles.group}>
            {group === 'ops' ? 'Operasyon' : group === 'content' ? 'İçerik' : 'Sistem'}
          </Text>
          <View style={styles.rows}>
            {ADMIN_NAV.filter((n) => NAV_GROUPS[group].includes(n.href)).map((n) => (
              <Pressable
                key={n.href}
                onPress={() => router.push(n.href as Href)}
                style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}>
                <View style={styles.rowIcon}>
                  <Ionicons
                    color={colors.brand[600]}
                    name={NAV_ICONS[n.href] ?? n.icon ?? 'ellipse'}
                    size={16}
                  />
                </View>
                <Text style={styles.rowText}>{n.label}</Text>
                <Ionicons color={colors.cream[300]} name="chevron-forward" size={18} />
              </Pressable>
            ))}
          </View>
        </FadeIn>
      ))}

      <FadeIn delay={120}>
        <View style={styles.account}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{(email || 'A').charAt(0).toUpperCase()}</Text>
          </View>
          <View style={styles.accountInfo}>
            <Text numberOfLines={1} style={styles.accountEmail}>
              {email}
            </Text>
            <View style={styles.roleBadge}>
              <Text style={styles.roleBadgeText}>admin</Text>
            </View>
          </View>
          <Button
            label="Çıkış Yap"
            onPress={async () => {
              await logout();
              router.replace('/(auth)/login');
            }}
            size="md"
            variant="ghost"
          />
        </View>
      </FadeIn>
        </>
      )}
    </PanelScaffold>
  );
}

const styles = StyleSheet.create({
  kpiGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  kpiWrap: { width: '48%', flexGrow: 1 },
  kpi: {
    backgroundColor: colors.white,
    borderRadius: radius.xl,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.cream[200],
    gap: 6,
  },
  kpiIcon: {
    width: 36,
    height: 36,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  kpiVal: { fontFamily: fonts.displayExtra, fontSize: 28, color: colors.cream[900] },
  kpiLabel: { fontFamily: fonts.sans, fontSize: 12, color: colors.cream[800] },
  group: {
    fontFamily: fonts.sansSemi,
    fontSize: 12,
    color: colors.brand[600],
    textTransform: 'uppercase',
    marginTop: spacing.md,
    marginBottom: spacing.sm,
    letterSpacing: 0.5,
  },
  rows: { gap: spacing.sm },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm + 4,
    backgroundColor: colors.white,
    borderRadius: radius.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.cream[200],
    minHeight: 48,
  },
  rowPressed: { backgroundColor: colors.cream[100] },
  rowIcon: {
    width: 32,
    height: 32,
    borderRadius: radius.md,
    backgroundColor: colors.brand[50],
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowText: { flex: 1, fontFamily: fonts.sansSemi, fontSize: 15, color: colors.cream[900] },
  account: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm + 4,
    backgroundColor: colors.white,
    borderRadius: radius.xl,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.cream[200],
    marginTop: spacing.md,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: radius.full,
    backgroundColor: colors.brand[600],
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { fontFamily: fonts.sansSemi, fontSize: 16, color: colors.white },
  accountInfo: { flex: 1, gap: 4 },
  accountEmail: { fontFamily: fonts.sansSemi, fontSize: 14, color: colors.cream[900] },
  roleBadge: {
    alignSelf: 'flex-start',
    backgroundColor: colors.gold[400],
    borderRadius: radius.full,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  roleBadgeText: { fontFamily: fonts.sansSemi, fontSize: 10, color: colors.white },
});
