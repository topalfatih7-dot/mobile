import { useLocalSearchParams } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

import { AppHeader } from '@/components/ui/AppHeader';
import { EmptyState } from '@/components/ui/EmptyState';
import { Screen } from '@/components/ui/Screen';
import { useApp } from '@/context/AppContext';
import { colors, fonts, spacing } from '@/constants/theme';

export default function PublicBlogPostScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { posts } = useApp();
  const post = posts.find((p) => p.id === id);

  return (
    <Screen scroll contentStyle={styles.content} edges={{ top: true, bottom: true }}>
      <AppHeader showBack title={post ? String(post.title || 'Yazı') : 'Blog'} />
      <View style={styles.body}>
        {post ? (
          <>
            <Text style={styles.title}>{String(post.title || 'Yazı')}</Text>
            <Text style={styles.bodyText}>
              {String(post.body || post.content || post.excerpt || 'İçerik yakında.')}
            </Text>
          </>
        ) : (
          <EmptyState subtitle="Bu yazı bulunamadı." title="Yazı yok" />
        )}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { paddingHorizontal: 0 },
  body: { paddingHorizontal: spacing.lg, paddingBottom: spacing.xl },
  title: {
    fontFamily: fonts.displayExtra,
    fontSize: 26,
    color: colors.text.primary,
    marginBottom: spacing.lg,
  },
  bodyText: {
    fontFamily: fonts.regular,
    fontSize: 15.5,
    lineHeight: 24,
    color: colors.text.secondary,
  },
});
