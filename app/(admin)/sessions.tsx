import { StyleSheet, Text, View } from 'react-native';

import { PanelScaffold } from '@/components/panel/PanelScaffold';
import { FadeIn } from '@/components/ui/FadeIn';
import { colors, fonts, radius, spacing } from '@/theme';

const ROWS = [
  {
    id: '1',
    kind: 'coach' as const,
    title: 'Koç Görüşmesi',
    who: 'Demo Üye · Demo Koç',
    when: '2 gün sonra · 10:00',
  },
  {
    id: '2',
    kind: 'dietitian' as const,
    title: 'Diyetisyen Görüşmesi',
    who: 'Demo Üye · Demo Diyetisyen',
    when: '4 gün sonra · 14:00',
  },
];

const KIND_BAR: Record<string, string> = {
  coach: colors.brand[400],
  dietitian: colors.sage[400],
};

/** LOCK: docs/mobile/screens/admin/sessions.md */
export default function AdminSessions() {
  return (
    <PanelScaffold showBack subtitle="Yaklaşan randevular" title="Seanslar">
      {ROWS.map((r, i) => (
        <FadeIn delay={i * 40} key={r.id}>
          <View style={styles.card}>
            <View style={[styles.kindBar, { backgroundColor: KIND_BAR[r.kind] }]} />
            <View style={styles.body}>
              <View style={styles.topRow}>
                <Text style={styles.title}>{r.title}</Text>
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>Planlandı</Text>
                </View>
              </View>
              <Text style={styles.meta}>{r.who}</Text>
              <Text style={styles.when}>{r.when}</Text>
            </View>
          </View>
        </FadeIn>
      ))}
    </PanelScaffold>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    backgroundColor: colors.white,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.cream[200],
    overflow: 'hidden',
  },
  kindBar: { width: 3 },
  body: { flex: 1, padding: spacing.md },
  topRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  title: { flex: 1, fontFamily: fonts.sansSemi, fontSize: 16, color: colors.cream[900] },
  badge: {
    backgroundColor: colors.brand[100],
    borderRadius: radius.full,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  badgeText: { fontFamily: fonts.sansSemi, fontSize: 11, color: colors.brand[700] },
  meta: { fontFamily: fonts.sans, fontSize: 13, color: colors.cream[800], marginTop: 2 },
  when: { fontFamily: fonts.sansSemi, fontSize: 12, color: colors.brand[600], marginTop: 4 },
});
