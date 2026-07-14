import { router, type Href } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

import { AppHeader } from '@/components/ui/AppHeader';
import { Card } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { Screen } from '@/components/ui/Screen';
import { useApp } from '@/context/AppContext';
import { colors, fonts, spacing } from '@/constants/theme';

export default function PublicBlogIndexScreen() {
  const { posts } = useApp();

  return (
    <Screen scroll contentStyle={styles.content} edges={{ top: true, bottom: true }}>
      <AppHeader showBack subtitle="Yeni Form blog" title="Blog" />
      <View style={styles.body}>
        {posts.length > 0 ? (
          posts.map((post) => (
            <Card
              key={post.id}
              onPress={() => router.push(`/(public)/blog/${post.id}` as Href)}
              padding={spacing.lg}
              style={styles.card}>
              <Text style={styles.title}>{String(post.title || 'Yazı')}</Text>
              {post.excerpt || post.summary ? (
                <Text numberOfLines={2} style={styles.excerpt}>
                  {String(post.excerpt || post.summary)}
                </Text>
              ) : null}
            </Card>
          ))
        ) : (
          <EmptyState subtitle="Blog yazıları yakında burada." title="Yazı yok" />
        )}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { paddingHorizontal: 0 },
  body: { paddingHorizontal: spacing.lg, paddingBottom: spacing.xl },
  card: { marginBottom: spacing.md },
  title: { fontFamily: fonts.display, fontSize: 17, color: colors.text.primary },
  excerpt: {
    fontFamily: fonts.regular,
    fontSize: 14,
    color: colors.text.secondary,
    marginTop: spacing.sm,
    lineHeight: 20,
  },
});
