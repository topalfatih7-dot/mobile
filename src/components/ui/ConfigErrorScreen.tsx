import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { BrandMark } from '@/components/brand/BrandMark';
import { ResponsiveCenter } from '@/components/layout/ResponsiveCenter';
import { missingEnvKeys } from '@/config/env';
import { useResponsive } from '@/hooks/useResponsive';
import { colors, fonts, radius, spacing } from '@/constants/theme';

export function ConfigErrorScreen() {
  const insets = useSafeAreaInsets();
  const { horizontalPadding } = useResponsive();
  const missing = missingEnvKeys();

  return (
    <ScrollView
      contentContainerStyle={[
        styles.content,
        { paddingTop: insets.top + spacing.xl, paddingBottom: insets.bottom + spacing.xl },
      ]}>
      <ResponsiveCenter innerStyle={{ paddingHorizontal: horizontalPadding }}>
      <View style={styles.logoWrap}>
        <BrandMark size={56} />
        <Text style={styles.brand}>Yeni Form</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.title}>Yapılandırma Gerekli</Text>
        <Text style={styles.body}>
          Mobil uygulama web ile aynı Supabase projesine bağlanır. Lütfen{' '}
          <Text style={styles.code}>EXPO_PUBLIC_SUPABASE_URL</Text> ve{' '}
          <Text style={styles.code}>EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY</Text> değerlerini
          tanımlayın.
        </Text>

        <View style={styles.hintBox}>
          <Text style={styles.hintTitle}>Yerel geliştirme</Text>
          <Text style={styles.hintBody}>
            {`mobile/.env.example dosyasını mobile/.env olarak kopyalayın.\nWeb projesindeki VITE_SUPABASE_* değerlerinin aynısını EXPO_PUBLIC_* ile yazın.`}
          </Text>

          {missing.length > 0 ? (
            <View style={styles.missingWrap}>
              <Text style={styles.missingTitle}>Eksik değişkenler</Text>
              {missing.map((key) => (
                <Text key={key} style={styles.missingItem}>
                  • {key}
                </Text>
              ))}
            </View>
          ) : null}
        </View>

        <Text style={styles.footerHint}>Değişiklikten sonra: npx expo start -c</Text>
      </View>
      </ResponsiveCenter>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: {
    flexGrow: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
    backgroundColor: colors.background,
  },
  logoWrap: {
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  brand: {
    marginTop: spacing.sm,
    fontFamily: fonts.displayExtra,
    fontSize: 22,
    color: colors.text.primary,
  },
  card: {
    width: '100%',
    maxWidth: 400,
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.ink[100],
  },
  title: {
    fontFamily: fonts.displayExtra,
    fontSize: 20,
    color: colors.text.primary,
    textAlign: 'center',
  },
  body: {
    marginTop: spacing.sm,
    fontFamily: fonts.regular,
    fontSize: 14,
    lineHeight: 22,
    color: colors.text.secondary,
    textAlign: 'center',
  },
  code: {
    fontFamily: fonts.semibold,
    fontSize: 12,
    color: colors.brand[700],
  },
  hintBox: {
    marginTop: spacing.lg,
    padding: spacing.md,
    borderRadius: radius.lg,
    backgroundColor: colors.brand[50],
  },
  hintTitle: {
    fontFamily: fonts.semibold,
    fontSize: 13,
    color: colors.text.primary,
  },
  hintBody: {
    marginTop: spacing.xs,
    fontFamily: fonts.regular,
    fontSize: 12,
    lineHeight: 18,
    color: colors.text.secondary,
  },
  missingWrap: {
    marginTop: spacing.md,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.brand[100],
  },
  missingTitle: {
    fontFamily: fonts.semibold,
    fontSize: 12,
    color: colors.coral[600],
    marginBottom: spacing.xs,
  },
  missingItem: {
    fontFamily: fonts.medium,
    fontSize: 11.5,
    color: colors.coral[600],
    lineHeight: 18,
  },
  footerHint: {
    marginTop: spacing.md,
    fontFamily: fonts.medium,
    fontSize: 11.5,
    color: colors.text.muted,
    textAlign: 'center',
  },
});
