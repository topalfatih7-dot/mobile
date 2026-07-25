import { Ionicons } from '@expo/vector-icons';
import type { ComponentProps } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { PanelScaffold } from '@/components/panel/PanelScaffold';
import { FadeIn } from '@/components/ui/FadeIn';
import { colors, fonts, radius, spacing } from '@/theme';

type IconName = ComponentProps<typeof Ionicons>['name'];

const KIND: Record<string, { label: string; icon: IconName; bg: string; fg: string }> = {
  success_story: {
    label: 'Başarı hikâyesi',
    icon: 'trophy',
    bg: colors.sage[100],
    fg: colors.sage[700],
  },
  faq: { label: 'SSS', icon: 'help-circle', bg: colors.brand[100], fg: colors.brand[700] },
  tip: { label: 'İpucu', icon: 'bulb', bg: colors.warm[100], fg: colors.warm[500] },
};

/** LOCK: docs/mobile/screens/admin/content.md */
export default function AdminContent() {
  const items = [
    { id: '1', kind: 'success_story', title: 'Demo başarı hikâyesi' },
    { id: '2', kind: 'faq', title: 'Sık sorulan sorular' },
    { id: '3', kind: 'tip', title: 'Günün ipucu havuzu' },
  ];
  return (
    <PanelScaffold showBack subtitle="Site içerikleri" title="İçerik">
      {items.map((i, idx) => {
        const kind = KIND[i.kind] || KIND.tip;
        return (
          <FadeIn delay={idx * 40} key={i.id}>
            <View style={styles.card}>
              <View style={[styles.iconBox, { backgroundColor: kind.bg }]}>
                <Ionicons color={kind.fg} name={kind.icon} size={18} />
              </View>
              <Text numberOfLines={1} style={styles.title}>
                {i.title}
              </Text>
              <View style={[styles.badge, { backgroundColor: kind.bg }]}>
                <Text style={[styles.badgeText, { color: kind.fg }]}>{kind.label}</Text>
              </View>
            </View>
          </FadeIn>
        );
      })}
    </PanelScaffold>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.white,
    borderRadius: radius.xl,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.cream[200],
    minHeight: 48,
  },
  iconBox: {
    width: 40,
    height: 40,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: { flex: 1, fontFamily: fonts.sansSemi, fontSize: 15, color: colors.cream[900] },
  badge: {
    borderRadius: radius.full,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  badgeText: { fontFamily: fonts.sansSemi, fontSize: 11 },
});
