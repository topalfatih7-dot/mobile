import { useLocalSearchParams } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

import { AppHeader } from '@/components/ui/AppHeader';
import { EmptyState } from '@/components/ui/EmptyState';
import { Screen } from '@/components/ui/Screen';
import { getLegalDocument } from '@/data/legalDocuments';
import { colors, fonts, spacing } from '@/constants/theme';

export default function PublicLegalScreen() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const doc = slug ? getLegalDocument(slug) : null;

  return (
    <Screen scroll contentStyle={styles.content} edges={{ top: true, bottom: true }}>
      <AppHeader showBack subtitle={doc ? `Güncelleme: ${doc.updatedAt}` : undefined} title={doc?.title || 'Yasal'} />
      <View style={styles.body}>
        {doc ? (
          doc.sections.map((section) => (
            <View key={section.heading} style={styles.section}>
              <Text style={styles.heading}>{section.heading}</Text>
              <Text style={styles.bodyText}>{section.body}</Text>
            </View>
          ))
        ) : (
          <EmptyState subtitle="Bu yasal belge bulunamadı." title="Belge yok" />
        )}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { paddingHorizontal: 0 },
  body: { paddingHorizontal: spacing.lg, paddingBottom: spacing.xl },
  section: { marginBottom: spacing.xl },
  heading: {
    fontFamily: fonts.display,
    fontSize: 17,
    color: colors.text.primary,
    marginBottom: spacing.sm,
  },
  bodyText: {
    fontFamily: fonts.regular,
    fontSize: 14.5,
    lineHeight: 22,
    color: colors.text.secondary,
  },
});
