import { Ionicons } from '@expo/vector-icons';
import type { ComponentProps } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { PanelScaffold } from '@/components/panel/PanelScaffold';
import { FadeIn } from '@/components/ui/FadeIn';
import { colors, fonts, radius, spacing } from '@/theme';

type IconName = ComponentProps<typeof Ionicons>['name'];

const ROWS: { id: string; text: string; at: string; icon: IconName; iconColor: string }[] = [
  { id: '1', text: 'Demo Üye giriş yaptı', at: 'Az önce', icon: 'log-in', iconColor: colors.brand[600] },
  {
    id: '2',
    text: "Demo Üye'ye Vip Paket atandı",
    at: '10 dk önce',
    icon: 'star',
    iconColor: colors.gold[500],
  },
  {
    id: '3',
    text: 'Yeni destek talebi',
    at: '1 saat önce',
    icon: 'chatbubble-ellipses',
    iconColor: colors.warm[500],
  },
];

/** LOCK: docs/mobile/screens/admin/activity.md */
export default function AdminActivity() {
  return (
    <PanelScaffold showBack subtitle="Son olaylar" title="Aktivite">
      {ROWS.map((r, i) => (
        <FadeIn delay={i * 40} key={r.id}>
          <View style={styles.item}>
            <View style={styles.timeline}>
              <View style={styles.iconBox}>
                <Ionicons color={r.iconColor} name={r.icon} size={16} />
              </View>
              {i < ROWS.length - 1 ? <View style={styles.line} /> : null}
            </View>
            <View style={styles.card}>
              <Text style={styles.text}>{r.text}</Text>
              <Text style={styles.at}>{r.at}</Text>
            </View>
          </View>
        </FadeIn>
      ))}
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
