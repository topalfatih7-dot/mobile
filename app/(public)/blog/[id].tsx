/**
 * LOCK: docs/mobile/screens/public/blog-post.md
 * Web parity: BlogPostPage.jsx — native (WebView yok).
 */
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { router, useLocalSearchParams, type Href } from 'expo-router';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';
import { useEffect, useMemo } from 'react';
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
  blogPostHref,
  findBlogPost,
  resolveBlogCover,
} from '@/utils/blog';
import { colors, fonts, radius, spacing } from '@/theme';

export default function BlogPostScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const { posts, loading } = useData();

  const post = useMemo(
    () => findBlogPost(posts, String(id || '')),
    [posts, id],
  );

  const related = useMemo(
    () =>
      (posts || [])
        .filter((p) => p.published && String(p.id) !== String(post?.id))
        .slice(0, 3),
    [posts, post?.id],
  );

  useEffect(() => {
    if (loading) return;
    if (!post || post.published === false) {
      router.replace('/(public)/blog' as Href);
    }
  }, [loading, post]);

  if (!post || post.published === false) {
    return <MeshBackground style={styles.root} />;
  }

  const cover = resolveBlogCover(post);
  const paragraphs = String(post.content || '')
    .split(/\n\n+/)
    .map((p) => p.trim())
    .filter(Boolean);
  const heroHeight = Math.max(200, Math.min(280, Math.round(width * 0.55)));
  const createdAt = post.createdAt ? new Date(String(post.createdAt)) : null;
  const dateLabel =
    createdAt && !Number.isNaN(createdAt.getTime())
      ? format(createdAt, 'd MMMM yyyy', { locale: tr })
      : null;

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
          <View style={styles.heroCard}>
            <View style={[styles.heroMedia, { height: heroHeight }]}>
              <Image
                accessibilityLabel={cover.alt}
                contentFit="cover"
                source={{ uri: cover.url }}
                style={StyleSheet.absoluteFill}
              />
              <LinearGradient
                colors={['transparent', 'rgba(0,0,0,0.35)', 'rgba(0,0,0,0.78)']}
                locations={[0, 0.45, 1]}
                style={StyleSheet.absoluteFill}
              />
              <View style={styles.heroCopy}>
                {post.category ? (
                  <View style={styles.categoryPill}>
                    <Text style={styles.categoryText}>{String(post.category)}</Text>
                  </View>
                ) : null}
                <Text style={styles.title}>{String(post.title || '')}</Text>
                <View style={styles.metaRow}>
                  {post.author ? (
                    <View style={styles.metaItem}>
                      <Ionicons color="rgba(255,255,255,0.9)" name="person-outline" size={14} />
                      <Text style={styles.metaText}>{String(post.author)}</Text>
                    </View>
                  ) : null}
                  {post.readMinutes ? (
                    <View style={styles.metaItem}>
                      <Ionicons color="rgba(255,255,255,0.9)" name="time-outline" size={14} />
                      <Text style={styles.metaText}>{String(post.readMinutes)} dk okuma</Text>
                    </View>
                  ) : null}
                  {dateLabel ? <Text style={styles.metaText}>{dateLabel}</Text> : null}
                </View>
              </View>
            </View>
          </View>
        </FadeIn>

        <FadeIn delay={80}>
          <View style={styles.body}>
            {paragraphs.length > 0 ? (
              paragraphs.map((para, i) => (
                <Text key={`p-${i}`} style={styles.paragraph}>
                  {para}
                </Text>
              ))
            ) : post.excerpt ? (
              <Text style={styles.paragraph}>{String(post.excerpt)}</Text>
            ) : (
              <Text style={styles.paragraphMuted}>Bu yazının metni henüz eklenmemiş.</Text>
            )}
          </View>
        </FadeIn>

        {related.length > 0 ? (
          <FadeIn delay={140}>
            <View style={styles.related}>
              <Text style={styles.relatedTitle}>Diğer yazılar</Text>
              {related.map((p) => (
                <Pressable
                  key={String(p.id)}
                  onPress={() => router.push(blogPostHref(p) as Href)}
                  style={styles.relatedCard}>
                  <View style={styles.relatedCopy}>
                    {p.category ? (
                      <Text style={styles.relatedCategory}>{String(p.category)}</Text>
                    ) : null}
                    <Text numberOfLines={2} style={styles.relatedPostTitle}>
                      {String(p.title || '')}
                    </Text>
                  </View>
                  <Ionicons color={colors.cream[300]} name="arrow-forward" size={18} />
                </Pressable>
              ))}
            </View>
          </FadeIn>
        ) : null}

        <FadeIn delay={180}>
          <View style={styles.disclaimer}>
            <Text style={styles.disclaimerText}>
              Bu içerik genel bilgilendirme amaçlıdır; tıbbi teşhis veya tedavi yerine geçmez.
              Sağlık sorunlarınız için doktorunuza danışın.
            </Text>
          </View>
        </FadeIn>
      </ScrollView>
    </MeshBackground>
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
    gap: spacing.xl,
  },
  heroCard: {
    borderRadius: radius.xl,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.cream[200],
    backgroundColor: colors.white,
    shadowColor: colors.cream[900],
    shadowOpacity: 0.06,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  heroMedia: {
    width: '100%',
    justifyContent: 'flex-end',
  },
  heroCopy: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.lg,
    paddingTop: spacing.xxl,
    gap: spacing.sm,
  },
  categoryPill: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255,255,255,0.22)',
    borderRadius: radius.full,
    paddingHorizontal: 12,
    paddingVertical: 5,
  },
  categoryText: {
    fontFamily: fonts.sansSemi,
    fontSize: 11,
    color: colors.white,
  },
  title: {
    fontFamily: fonts.displayExtra,
    fontSize: 26,
    lineHeight: 32,
    color: colors.white,
  },
  metaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 12,
    marginTop: 4,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  metaText: {
    fontFamily: fonts.sans,
    fontSize: 12,
    color: 'rgba(255,255,255,0.88)',
  },
  body: {
    gap: spacing.md + 4,
  },
  paragraph: {
    fontFamily: fonts.sans,
    fontSize: 16,
    lineHeight: 26,
    color: 'rgba(58,69,80,0.88)',
  },
  paragraphMuted: {
    fontFamily: fonts.sans,
    fontSize: 15,
    lineHeight: 22,
    color: colors.cream[300],
  },
  related: {
    borderTopWidth: 1,
    borderTopColor: colors.cream[200],
    paddingTop: spacing.xl,
    gap: spacing.md,
  },
  relatedTitle: {
    fontFamily: fonts.displayBold,
    fontSize: 20,
    color: colors.cream[900],
  },
  relatedCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.cream[200],
    borderRadius: radius.lg,
    padding: spacing.md,
  },
  relatedCopy: {
    flex: 1,
    gap: 2,
  },
  relatedCategory: {
    fontFamily: fonts.sansSemi,
    fontSize: 11,
    color: colors.brand[600],
  },
  relatedPostTitle: {
    fontFamily: fonts.sansSemi,
    fontSize: 15,
    color: colors.cream[900],
  },
  disclaimer: {
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.cream[200],
    backgroundColor: colors.cream[50],
    padding: spacing.md,
  },
  disclaimerText: {
    fontFamily: fonts.sans,
    fontSize: 11,
    lineHeight: 16,
    textAlign: 'center',
    color: 'rgba(58,69,80,0.5)',
  },
});
