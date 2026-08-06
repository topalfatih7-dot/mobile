import { Ionicons } from '@expo/vector-icons';
import type { ComponentProps } from 'react';
import { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { PanelScaffold } from '@/components/panel/PanelScaffold';
import { EmptyState } from '@/components/ui/EmptyState';
import { FadeIn } from '@/components/ui/FadeIn';
import { InlineSpinner } from '@/components/ui/InlineSpinner';
import { useData } from '@/context/DataContext';
import { formatRelativeTimeTr } from '@/utils/relativeTime';
import { colors, fonts, radius, spacing } from '@/theme';

type IconName = ComponentProps<typeof Ionicons>['name'];

const TYPE_CONFIG: Record<string, { icon: IconName; iconColor: string }> = {
  login: { icon: 'log-in', iconColor: colors.brand[600] },
  premium: { icon: 'star', iconColor: colors.gold[500] },
  support: { icon: 'chatbubble-ellipses', iconColor: colors.warm[500] },
  staff_apply: { icon: 'people', iconColor: colors.sage[600] },
  payment: { icon: 'card', iconColor: colors.brand[500] },
};

/** LOCK: docs/mobile/screens/admin/activity.md */
export default function AdminActivity() {
  const { loading, platform } = useData();
  const rows = useMemo(() => {
    return (platform.activities || []).slice(0, 40).map((a) => {
      const type = String(a.type || '');
      const cfg = TYPE_CONFIG[type] || {
        icon: 'ellipse' as IconName,
        iconColor: colors.cream[800],
      };
      return {
        id: String(a.id),
        text: String(a.text || a.message || a.type || 'Aktivite'),
        at: a.createdAt ? formatRelativeTimeTr(String(a.createdAt)) : '',
        ...cfg,
      };
    });
  }, [platform.activities]);

  return (
    <PanelScaffold showBack subtitle="Son olaylar" title="Aktivite">
      {loading && rows.length === 0 ? (
        <InlineSpinner fill />
      ) : rows.length === 0 ? (
        <EmptyState title="Henüz aktivite yok." />
      ) : (
        rows.map((r, i) => (
          <FadeIn delay={i * 40} key={r.id}>
            <View style={styles.item}>
              <View style={styles.timeline}>
                <View style={styles.iconBox}>
                  <Ionicons color={r.iconColor} name={r.icon} size={16} />
                </View>
                {i < rows.length - 1 ? <View style={styles.line} /> : null}
              </View>
              <View style={styles.card}>
                <Text style={styles.text}>{r.text}</Text>
                <Text style={styles.at}>{r.at}</Text>
              </View>
            </View>
          </FadeIn>
        ))
      )}
    </PanelScaffold>
  );
}

const styles = StyleSheet.create({
  item: { flexDirection: 'row', gap: spacing.sm },
  timeline: { alignItems: 'center' },
  iconBox: {
    width: 36,
    height: 36,
    borderRadius: radius.md,
    backgroundColor: colors.cream[100],
    alignItems: 'center',
    justifyContent: 'center',
  },
  line: { flex: 1, width: 1, backgroundColor: colors.cream[200], marginVertical: 2 },
  card: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.white,
    borderRadius: radius.xl,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.cream[200],
    marginBottom: spacing.sm,
    minHeight: 48,
  },
  text: { flex: 1, fontFamily: fonts.sansSemi, fontSize: 14, color: colors.cream[900] },
  at: { fontFamily: fonts.sans, fontSize: 11, color: colors.cream[800], textAlign: 'right' },
});
