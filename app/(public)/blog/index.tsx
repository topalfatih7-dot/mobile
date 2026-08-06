/**
 * LOCK: docs/mobile/screens/public/blog-list.md
 * Web parity: BlogPage.jsx — native (WebView yok).
 */
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { router, type Href } from 'expo-router';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';
import { useMemo, useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { FadeIn } from '@/components/ui/FadeIn';
import { MeshBackground } from '@/components/ui/MeshBackground';
import { useData } from '@/context/DataContext';
import {
  BLOG_CATEGORIES,
  blogPostHref,
  resolveBlogCover,
} from '@/utils/blog';
import { colors, fonts, radius, spacing } from '@/theme';

export default function BlogListScreen() {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const { posts } = useData();
  const [category, setCategory] = useState<string>('all');

  const published = useMemo(
    () =>
      (posts || [])
        .filter((p) => p.published)
        .slice()
        .sort((a, b) => {
          const ta = new Date(String(a.createdAt || 0)).getTime();
          const tb = new Date(String(b.createdAt || 0)).getTime();
          return tb - ta;
        }),
    [posts],
  );

  const filtered =
    category === 'all' ? published : published.filter((p) => p.category === category);
  const featured = filtered[0];
  const rest = filtered.slice(1);
  const featuredHeight = Math.max(180, Math.min(220, Math.round(width * 0.48)));

  return (
    <MeshBackground style={styles.root}>
      <View style={[styles.topBar, { paddingTop: insets.top + 8 }]}>
        <Pressable
          accessibilityRole="button"
          hitSlop={10}
          onPress={() => router.back()}
          style={styles.backBtn}>
          <Ionicons color={colors.brand[600]} name="chevron-back" size={22} />
          <Text style={styles.backText}>Geri</Text>
        </Pressable>
      </View>

      <ScrollView
        contentContainerStyle={[
          styles.scroll,
          { paddingBottom: insets.bottom + spacing.xxl },
        ]}
        showsVerticalScrollIndicator={false}>
        <FadeIn>
          <View style={styles.heroIntro}>
            <View style={styles.badge}>
              <Ionicons color={colors.brand[600]} name="book-outline" size={14} />
              <Text style={styles.badgeText}>Yeni Form Blog</Text>
            </View>
            <Text style={styles.heroTitle}>Sağlık, beslenme ve motivasyon</Text>
            <Text style={styles.heroSub}>
              Dönüşüm yolculuğunuzda size eşlik edecek uzman içerikler. Herkesin erişimine açık.
            </Text>
          </View>
        </FadeIn>

        <FadeIn delay={60}>
          <ScrollView
            horizontal
            contentContainerStyle={styles.chips}
            showsHorizontalScrollIndicator={false}>
            <Chip
              active={category === 'all'}
              label="Tümü"
              onPress={() => setCategory('all')}
            />
            {BLOG_CATEGORIES.map((c) => (
              <Chip
                key={c}
                active={category === c}
                label={c}
                onPress={() => setCategory(c)}
              />
            ))}
          </ScrollView>
        </FadeIn>

        {filtered.length === 0 ? (
          <View style={styles.empty}>
            <Ionicons color={colors.cream[300]} name="book-outline" size={36} />
            <Text style={styles.emptyTitle}>Henüz yazı yok</Text>
            <Text style={styles.emptyBody}>
              Bu kategoride yayınlanmış bir makale bulunmuyor.
            </Text>
          </View>
        ) : (
          <View style={styles.list}>
            {featured ? (
              <FadeIn delay={100}>
                <Pressable
                  onPress={() => router.push(blogPostHref(featured) as Href)}
                  style={styles.featuredCard}>
                  <BlogCoverImage height={featuredHeight} post={featured} />
                  <View style={styles.featuredBody}>
                    {featured.category ? (
                      <View style={styles.featuredPill}>
                        <Text style={styles.featuredPillText}>
                          {String(featured.category)}
                        </Text>
                      </View>
                    ) : null}
                    <Text style={styles.featuredTitle}>{String(featured.title || '')}</Text>
                    {featured.excerpt ? (
                      <Text numberOfLines={3} style={styles.featuredExcerpt}>
                        {String(featured.excerpt)}
                      </Text>
                    ) : null}
                    <MetaRow post={featured} />
                    <View style={styles.readCta}>
                      <Text style={styles.readCtaText}>Yazıyı oku</Text>
                      <Ionicons color={colors.brand[600]} name="arrow-forward" size={16} />
                    </View>
                  </View>
                </Pressable>
              </FadeIn>
            ) : null}

            {rest.map((p, i) => (
              <FadeIn key={String(p.id)} delay={120 + i * 40}>
                <Pressable
                  onPress={() => router.push(blogPostHref(p) as Href)}
                  style={styles.card}>
                  <BlogCoverImage height={140} post={p} />
                  <View style={styles.cardBody}>
                    {p.category ? (
                      <Text style={styles.cardCategory}>{String(p.category)}</Text>
                    ) : null}
                    <Text numberOfLines={2} style={styles.cardTitle}>
                      {String(p.title || '')}
                    </Text>
                    {p.excerpt ? (
                      <Text numberOfLines={3} style={styles.cardExcerpt}>
                        {String(p.excerpt)}
                      </Text>
                    ) : null}
                    <MetaRow compact post={p} />
                  </View>
                </Pressable>
              </FadeIn>
            ))}
          </View>
        )}
      </ScrollView>
    </MeshBackground>
  );
}

function Chip({
  label,
  active,
  onPress,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={[styles.chip, active ? styles.chipActive : styles.chipIdle]}>
      <Text style={[styles.chipText, active ? styles.chipTextActive : null]}>{label}</Text>
    </Pressable>
  );
}

function BlogCoverImage({
  post,
  height,
}: {
  post: Record<string, unknown>;
  height: number;
}) {
  const cover = resolveBlogCover(post);
  return (
    <View style={[styles.coverWrap, { height }]}>
      <Image
        accessibilityLabel={cover.alt}
        contentFit="cover"
        source={{ uri: cover.url }}
        style={StyleSheet.absoluteFill}
      />
      <LinearGradient
        colors={['transparent', 'rgba(0,0,0,0.28)']}
        style={StyleSheet.absoluteFill}
      />
    </View>
  );
}

function MetaRow({
  post,
  compact,
}: {
  post: Record<string, unknown>;
  compact?: boolean;
}) {
  const createdAt = post.createdAt ? new Date(String(post.createdAt)) : null;
  const dateLabel =
    createdAt && !Number.isNaN(createdAt.getTime())
      ? format(createdAt, compact ? 'd MMM' : 'd MMM yyyy', { locale: tr })
      : null;

  return (
    <View style={styles.metaRow}>
      {!compact && post.author ? (
        <View style={styles.metaItem}>
          <Ionicons color={colors.cream[300]} name="person-outline" size={13} />
          <Text style={styles.metaText}>{String(post.author)}</Text>
        </View>
      ) : null}
      {post.readMinutes ? (
        <View style={styles.metaItem}>
          <Ionicons color={colors.cream[300]} name="time-outline" size={13} />
          <Text style={styles.metaText}>{String(post.readMinutes)} dk</Text>
        </View>
      ) : null}
      {dateLabel ? <Text style={styles.metaText}>{dateLabel}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  topBar: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.sm,
  },
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 2,
  },
  backText: {
    fontFamily: fonts.sansSemi,
    fontSize: 15,
    color: colors.brand[600],
  },
  scroll: {
    paddingHorizontal: spacing.lg,
    gap: spacing.lg,
  },
  heroIntro: {
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.md,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.brand[50],
    borderRadius: radius.full,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  badgeText: {
    fontFamily: fonts.sansSemi,
    fontSize: 12,
    color: colors.brand[700],
  },
  heroTitle: {
    fontFamily: fonts.displayExtra,
    fontSize: 26,
    lineHeight: 32,
    textAlign: 'center',
    color: colors.cream[900],
  },
  heroSub: {
    fontFamily: fonts.sans,
    fontSize: 14,
    lineHeight: 21,
    textAlign: 'center',
    color: 'rgba(58,69,80,0.7)',
    maxWidth: 340,
  },
  chips: {
    gap: 8,
    paddingVertical: 2,
  },
  chip: {
    borderRadius: radius.full,
    paddingHorizontal: 16,
    paddingVertical: 9,
  },
  chipActive: {
    backgroundColor: colors.brand[500],
  },
  chipIdle: {
    backgroundColor: colors.cream[100],
  },
  chipText: {
    fontFamily: fonts.sansSemi,
    fontSize: 13,
    color: colors.cream[800],
  },
  chipTextActive: {
    color: colors.white,
  },
  list: {
    gap: spacing.lg,
  },
  featuredCard: {
    borderRadius: radius.xl,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.cream[200],
    backgroundColor: colors.white,
  },
  featuredBody: {
    padding: spacing.lg,
    gap: spacing.sm,
  },
  featuredPill: {
    alignSelf: 'flex-start',
    backgroundColor: colors.brand[100],
    borderRadius: radius.full,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  featuredPillText: {
    fontFamily: fonts.sansSemi,
    fontSize: 11,
    color: colors.brand[700],
  },
  featuredTitle: {
    fontFamily: fonts.displayBold,
    fontSize: 22,
    lineHeight: 28,
    color: colors.cream[900],
  },
  featuredExcerpt: {
    fontFamily: fonts.sans,
    fontSize: 14,
    lineHeight: 21,
    color: 'rgba(58,69,80,0.7)',
  },
  readCta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 4,
  },
  readCtaText: {
    fontFamily: fonts.sansSemi,
    fontSize: 14,
    color: colors.brand[600],
  },
  card: {
    borderRadius: radius.lg,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.cream[200],
    backgroundColor: colors.white,
  },
  cardBody: {
    padding: spacing.md,
    gap: 6,
  },
  cardCategory: {
    fontFamily: fonts.sansSemi,
    fontSize: 11,
    color: colors.brand[600],
  },
  cardTitle: {
    fontFamily: fonts.displayBold,
    fontSize: 17,
    lineHeight: 22,
    color: colors.cream[900],
  },
  cardExcerpt: {
    fontFamily: fonts.sans,
    fontSize: 13,
    lineHeight: 19,
    color: 'rgba(58,69,80,0.6)',
  },
  coverWrap: {
    width: '100%',
    backgroundColor: colors.cream[100],
    overflow: 'hidden',
  },
  metaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 10,
    marginTop: 4,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaText: {
    fontFamily: fonts.sans,
    fontSize: 11,
    color: 'rgba(58,69,80,0.5)',
  },
  empty: {
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.xxl * 2,
  },
  emptyTitle: {
    fontFamily: fonts.displayBold,
    fontSize: 18,
    color: colors.cream[900],
  },
  emptyBody: {
    fontFamily: fonts.sans,
    fontSize: 14,
    textAlign: 'center',
    color: 'rgba(58,69,80,0.6)',
  },
});
