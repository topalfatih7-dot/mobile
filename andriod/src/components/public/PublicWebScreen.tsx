import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Linking, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button } from '@/components/ui/Button';
import { MeshBackground } from '@/components/ui/MeshBackground';
import { SafeWebView, isNativeWebViewAvailable } from '@/components/ui/SafeWebView';
import { colors, fonts, spacing } from '@/theme';

type Props = {
  title: string;
  url: string;
};

/** Public marketing — LOCK “native or WebView” */
export function PublicWebScreen({ title, url }: Props) {
  const insets = useSafeAreaInsets();
  const native = isNativeWebViewAvailable();

  return (
    <MeshBackground style={styles.root}>
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <Pressable hitSlop={10} onPress={() => router.back()} style={styles.back}>
          <Ionicons color={colors.brand[600]} name="chevron-back" size={22} />
          <Text style={styles.backText}>Geri</Text>
        </Pressable>
        <Text numberOfLines={1} style={styles.title}>
          {title}
        </Text>
      </View>
      {native ? (
        <SafeWebView
          source={{ uri: url }}
          style={styles.web}
          javaScriptEnabled
          domStorageEnabled
          setSupportMultipleWindows={false}
        />
      ) : (
        <View style={styles.fallback}>
          <Text style={styles.fallbackTitle}>{title}</Text>
          <Text style={styles.fallbackBody}>
            Bu içerik web sitesinde açılır. Expo Go’da gömülü WebView yoktur.
          </Text>
          <Button label="Tarayıcıda aç" onPress={() => void Linking.openURL(url)} />
        </View>
      )}
    </MeshBackground>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.cream[200],
    backgroundColor: 'rgba(255,255,255,0.85)',
    gap: 4,
  },
  back: { flexDirection: 'row', alignItems: 'center' },
  backText: { fontFamily: fonts.sansSemi, fontSize: 15, color: colors.brand[600] },
  title: { fontFamily: fonts.displayExtra, fontSize: 20, color: colors.cream[900] },
  web: { flex: 1, backgroundColor: colors.cream[50] },
  fallback: {
    flex: 1,
    padding: spacing.xl,
    justifyContent: 'center',
    gap: spacing.md,
  },
  fallbackTitle: {
    fontFamily: fonts.displayExtra,
    fontSize: 22,
    color: colors.cream[900],
  },
  fallbackBody: {
    fontFamily: fonts.sans,
    fontSize: 14,
    color: colors.cream[800],
    lineHeight: 20,
  },
});
