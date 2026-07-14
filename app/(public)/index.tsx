import { LinearGradient } from 'expo-linear-gradient';
import { router, type Href } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { BrandMark } from '@/components/brand/BrandMark';
import { Button } from '@/components/ui/Button';
import { Screen } from '@/components/ui/Screen';
import { BRAND } from '@/config/brand';
import { colors, fonts, gradients, spacing } from '@/constants/theme';

const QUICK_LINKS: { label: string; href: Href }[] = [
  { label: 'Üyelik', href: '/(public)/membership' as Href },
  { label: 'Hakkımızda', href: '/(public)/about' as Href },
  { label: 'Hikâyeler', href: '/(public)/stories' as Href },
  { label: 'Blog', href: '/(public)/blog' as Href },
  { label: 'Ekip', href: '/(public)/team' as Href },
  { label: 'Kurumsal', href: '/(public)/corporate' as Href },
];

export default function PublicLandingScreen() {
  return (
    <Screen aurora scroll contentStyle={styles.content} edges={{ top: true, bottom: true }}>
      <StatusBar style="dark" />
      <View style={styles.hero}>
        <BrandMark size={56} />
        <Text style={styles.brand}>{BRAND.name}</Text>
        <Text style={styles.tagline}>{BRAND.tagline}</Text>
        <LinearGradient colors={gradients.primary} style={styles.accentBar} />
        <Text style={styles.lead}>
          Kişisel koçluk, beslenme ve wellness — tek uygulamada, Lumina deneyimiyle.
        </Text>
      </View>

      <View style={styles.cta}>
        <Button label="Giriş Yap" onPress={() => router.push('/(auth)/login')} />
        <Button
          label="Kayıt Ol"
          onPress={() => router.push('/(auth)/register')}
          style={styles.secondaryBtn}
          variant="secondary"
        />
        <Button
          label="Üyelik paketlerini incele"
          onPress={() => router.push('/(public)/membership' as Href)}
          style={styles.secondaryBtn}
          variant="ghost"
        />
      </View>

      <View style={styles.links}>
        {QUICK_LINKS.map((link) => (
          <Pressable key={link.label} onPress={() => router.push(link.href)} style={styles.linkChip}>
            <Text style={styles.linkText}>{link.label}</Text>
          </Pressable>
        ))}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: spacing.lg,
    justifyContent: 'center',
  },
  hero: {
    alignItems: 'flex-start',
    marginBottom: spacing.xl,
  },
  brand: {
    marginTop: spacing.lg,
    fontFamily: fonts.displayExtra,
    fontSize: 40,
    color: colors.text.primary,
    letterSpacing: -0.5,
  },
  tagline: {
    marginTop: spacing.sm,
    fontFamily: fonts.medium,
    fontSize: 15,
    color: colors.champagne[600],
  },
  accentBar: {
    width: 64,
    height: 4,
    borderRadius: 2,
    marginTop: spacing.lg,
    marginBottom: spacing.md,
  },
  lead: {
    fontFamily: fonts.regular,
    fontSize: 16,
    lineHeight: 24,
    color: colors.text.secondary,
  },
  cta: { gap: spacing.sm, marginBottom: spacing.xl },
  secondaryBtn: { marginTop: 0 },
  links: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    paddingBottom: spacing.xl,
  },
  linkChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: 999,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  linkText: {
    fontFamily: fonts.semibold,
    fontSize: 13,
    color: colors.teal[700],
  },
});
