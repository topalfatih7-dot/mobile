import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';

import { PanelScaffold } from '@/components/panel/PanelScaffold';
import { EmptyState } from '@/components/ui/EmptyState';
import { FadeIn } from '@/components/ui/FadeIn';
import { InlineSpinner } from '@/components/ui/InlineSpinner';
import { useData } from '@/context/DataContext';
import { formatRelativeDayTr } from '@/utils/relativeTime';
import { colors, fonts, radius, spacing } from '@/theme';

/** LOCK: docs/mobile/screens/admin/blog.md */
export default function AdminBlog() {
  const { loading, posts } = useData();

  return (
    <PanelScaffold showBack subtitle="Yayınlar" title="Blog">
      {loading && posts.length === 0 ? (
        <InlineSpinner fill />
      ) : posts.length === 0 ? (
        <EmptyState title="Henüz yazı yok." />
      ) : (
        posts.map((p, i) => (
          <FadeIn delay={i * 40} key={String(p.id)}>
            <View style={styles.card}>
              <View style={styles.iconBox}>
                <Ionicons color={colors.brand[600]} name="newspaper" size={18} />
              </View>
              <View style={styles.body}>
                <Text numberOfLines={1} style={styles.title}>
                  {String(p.title || '')}
                </Text>
                <Text style={styles.date}>
                  {formatRelativeDayTr(String(p.createdAt || new Date().toISOString()))}
                </Text>
              </View>
              <View style={[styles.badge, p.published ? styles.badgeLive : styles.badgeDraft]}>
                <Text
                  style={[
                    styles.badgeText,
                    p.published ? styles.badgeTextLive : styles.badgeTextDraft,
                  ]}>
                  {p.published ? 'Yayında' : 'Taslak'}
                </Text>
              </View>
            </View>
          </FadeIn>
        ))
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
  },
  iconBox: {
    width: 40,
    height: 40,
    borderRadius: radius.md,
    backgroundColor: colors.brand[50],
    alignItems: 'center',
    justifyContent: 'center',
  },
  body: { flex: 1 },
  title: { fontFamily: fonts.sansSemi, fontSize: 16, color: colors.cream[900] },
  date: { fontFamily: fonts.sans, fontSize: 12, color: colors.cream[800], marginTop: 2 },
  badge: {
    borderRadius: radius.full,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  badgeLive: { backgroundColor: colors.sage[100] },
  badgeDraft: { backgroundColor: colors.cream[200] },
  badgeText: { fontFamily: fonts.sansSemi, fontSize: 11 },
  badgeTextLive: { color: colors.sage[700] },
  badgeTextDraft: { color: colors.cream[800] },
});
