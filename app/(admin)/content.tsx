/**
 * LOCK: docs/mobile/screens/admin/content.md — site_content list
 */
import { Ionicons } from '@expo/vector-icons';
import type { ComponentProps } from 'react';
import { useCallback, useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { PanelScaffold } from '@/components/panel/PanelScaffold';
import { EmptyState } from '@/components/ui/EmptyState';
import { FadeIn } from '@/components/ui/FadeIn';
import { InlineSpinner } from '@/components/ui/InlineSpinner';
import { isUiOnly } from '@/config/runtime';
import { requireSupabase, supabase } from '@/services/supabase';
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
  testimonial: {
    label: 'Yorum',
    icon: 'chatbubble-ellipses',
    bg: colors.mint[50],
    fg: colors.sage[700],
  },
};

type ContentRow = {
  id: string;
  kind: string;
  title: string;
};

function titleFromData(kind: string, data: Record<string, unknown>): string {
  if (kind === 'faq') return String(data.q || data.question || 'SSS');
  if (kind === 'testimonial') return String(data.name || data.quote || 'Yorum');
  if (kind === 'success_story') return String(data.name || data.title || 'Başarı hikâyesi');
  return String(data.title || data.name || data.text || kind);
}

export default function AdminContent() {
  const [items, setItems] = useState<ContentRow[]>([]);
  const [busy, setBusy] = useState(true);

  const reload = useCallback(async () => {
    setBusy(true);
    try {
      if (isUiOnly() || !supabase) {
        setItems([]);
        return;
      }
      const client = requireSupabase();
      const { data, error } = await client
        .from('site_content')
        .select('id, kind, data, sort')
        .order('sort', { ascending: true });
      if (error) throw error;
      const rows = (data || [])
        .filter((r) =>
          ['success_story', 'faq', 'tip', 'testimonial', 'daily_tip'].includes(String(r.kind)),
        )
        .map((r) => ({
          id: String(r.id),
          kind: String(r.kind === 'daily_tip' ? 'tip' : r.kind),
          title: titleFromData(String(r.kind), (r.data as Record<string, unknown>) || {}),
        }));
      setItems(rows);
    } catch {
      setItems([]);
    } finally {
      setBusy(false);
    }
  }, []);

  useEffect(() => {
    void reload();
  }, [reload]);

  return (
    <PanelScaffold showBack subtitle="Site içerikleri" title="İçerik">
      {busy ? (
        <InlineSpinner fill />
      ) : items.length === 0 ? (
        <EmptyState title="İçerik kaydı yok." />
      ) : (
        items.map((i, idx) => {
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
        })
      )}
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
