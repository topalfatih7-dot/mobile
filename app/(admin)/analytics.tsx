import { Ionicons } from '@expo/vector-icons';
import type { ComponentProps } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { PanelScaffold } from '@/components/panel/PanelScaffold';
import { FadeIn } from '@/components/ui/FadeIn';
import { InlineSpinner } from '@/components/ui/InlineSpinner';
import { useData } from '@/context/DataContext';
import { colors, fonts, radius, spacing } from '@/theme';

type IconName = ComponentProps<typeof Ionicons>['name'];

/** LOCK: docs/mobile/screens/admin/analytics.md — sade sayılar */
export default function AdminAnalytics() {
  const { loading, platform } = useData();
  const s = platform.adminStats;
  const rows: { label: string; value: number; icon: IconName; bg: string; fg: string }[] = [
    {
      label: 'Toplam üye',
      value: s.members,
      icon: 'people',
      bg: colors.brand[50],
      fg: colors.brand[600],
    },
    {
      label: 'Personel',
      value: s.staff,
      icon: 'id-card',
      bg: colors.sage[50],
      fg: colors.sage[600],
    },
    {
      label: 'Açık talep',
      value: s.openTickets,
      icon: 'help-buoy',
      bg: colors.warm[50],
      fg: colors.warm[500],
    },
    {
      label: 'Başvuru',
      value: s.pendingApps,
      icon: 'document-text',
      bg: `${colors.gold[400]}1F`,
      fg: colors.gold[500],
    },
  ];
  return (
    <PanelScaffold showBack subtitle="Platform özeti" title="Analitik">
      {loading && platform.members.length === 0 ? (
        <InlineSpinner fill />
      ) : (
        <FadeIn>
          <View style={styles.group}>
            {rows.map((r, i) => (
              <View key={r.label}>
                {i > 0 ? <View style={styles.divider} /> : null}
                <View style={styles.row}>
                  <View style={[styles.iconBox, { backgroundColor: r.bg }]}>
                    <Ionicons color={r.fg} name={r.icon} size={18} />
                  </View>
                  <Text style={styles.label}>{r.label}</Text>
                  <Text style={styles.val}>{r.value}</Text>
                </View>
              </View>
            ))}
          </View>
        </FadeIn>
      )}
    </PanelScaffold>
  );
}

const styles = StyleSheet.create({
  group: {
    backgroundColor: colors.white,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.cream[200],
    paddingHorizontal: spacing.md,
  },
  divider: { height: 1, backgroundColor: colors.cream[200] },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.md,
    minHeight: 48,
  },
  iconBox: {
    width: 36,
    height: 36,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: { flex: 1, fontFamily: fonts.sans, fontSize: 14, color: colors.cream[800] },
  val: { fontFamily: fonts.displayExtra, fontSize: 18, color: colors.brand[700] },
});
