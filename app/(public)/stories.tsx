import { StyleSheet, Text, View } from 'react-native';

import { AppHeader } from '@/components/ui/AppHeader';
import { Card } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { Screen } from '@/components/ui/Screen';
import { useApp } from '@/context/AppContext';
import { colors, fonts, spacing } from '@/constants/theme';

export default function PublicStoriesScreen() {
  const { successStories, testimonials } = useApp();
  const items = successStories.length > 0 ? successStories : testimonials;

  return (
    <Screen scroll contentStyle={styles.content} edges={{ top: true, bottom: true }}>
      <AppHeader showBack subtitle="Üye başarı hikâyeleri" title="Hikâyeler" />
      <View style={styles.body}>
        {items.length > 0 ? (
          items.map((item, index) => (
            <Card key={String(item.id || index)} padding={spacing.lg} style={styles.card}>
              <Text style={styles.title}>
                {String(item.title || item.name || item.author || 'Başarı hikâyesi')}
              </Text>
              <Text style={styles.bodyText}>
                {String(item.body || item.quote || item.text || item.content || '')}
              </Text>
            </Card>
          ))
        ) : (
          <EmptyState
            subtitle="Başarı hikâyeleri yayınlandığında burada görünecek."
            title="Henüz hikâye yok"
          />
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
  bodyText: {
    fontFamily: fonts.regular,
    fontSize: 14.5,
    color: colors.text.secondary,
    marginTop: spacing.sm,
    lineHeight: 22,
  },
});
