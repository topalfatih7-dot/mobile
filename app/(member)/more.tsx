import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { FadeIn } from '@/components/ui/FadeIn';
import { MeshBackground } from '@/components/ui/MeshBackground';
import { useAuth } from '@/context/AuthContext';
import { colors, fonts, radius, spacing } from '@/theme';

const LINKS: {
  title: string;
  subtitle: string;
  href: string;
  icon: keyof typeof Ionicons.glyphMap;
  tint: string;
}[] = [
  { title: 'Mesajlar', subtitle: 'Koç & diyetisyen', href: '/(member)/messages', icon: 'chatbubbles', tint: colors.brand[500] },
  { title: 'Sağlık testi', subtitle: 'Profil analizi', href: '/(member)/health-test', icon: 'fitness', tint: colors.sage[500] },
  { title: 'Kalori', subtitle: 'Metin & foto AI', href: '/(member)/calorie', icon: 'nutrition', tint: colors.warm[500] },
  { title: 'Kütüphane', subtitle: 'Egzersiz videoları', href: '/(member)/library', icon: 'play-circle', tint: colors.gold[500] },
  { title: 'Bildirimler', subtitle: 'Hatırlatmalar', href: '/(member)/notifications', icon: 'notifications', tint: colors.brand[400] },
  { title: 'Destek', subtitle: 'Ticket aç', href: '/(member)/support', icon: 'help-buoy', tint: colors.sage[400] },
  { title: 'Profil', subtitle: 'Üyelik & ödeme', href: '/(member)/profile', icon: 'person', tint: colors.brand[600] },
];

/** 03-navigation — Daha fazla hub (net yönler) */
export default function MoreScreen() {
  const { logout } = useAuth();

  return (
    <MeshBackground style={styles.root}>
      <ScrollView contentContainerStyle={styles.content}>
        <FadeIn>
          <Text style={styles.title}>Daha fazla</Text>
          <Text style={styles.sub}>Tüm üye araçları tek yerde — nereye gideceğini seç.</Text>
        </FadeIn>
        {LINKS.map((link, i) => (
          <FadeIn key={link.href} delay={60 + i * 35}>
            <Pressable
              onPress={() => router.push(link.href as `/`)}
              style={({ pressed }) => [styles.row, pressed && styles.pressed]}>
              <View style={[styles.icon, { backgroundColor: link.tint }]}>
                <Ionicons color={colors.white} name={link.icon} size={20} />
              </View>
              <View style={styles.meta}>
                <Text style={styles.rowTitle}>{link.title}</Text>
                <Text style={styles.rowSub}>{link.subtitle}</Text>
              </View>
              <Ionicons color={colors.cream[300]} name="chevron-forward" size={18} />
            </Pressable>
          </FadeIn>
        ))}
        <FadeIn delay={400}>
          <Pressable
            accessibilityLabel="Çıkış yap"
            accessibilityRole="button"
            onPress={async () => {
              await logout();
              router.replace('/(auth)/login');
            }}
            style={styles.logout}>
            <Text style={styles.logoutText}>Çıkış Yap</Text>
          </Pressable>
        </FadeIn>
      </ScrollView>
    </MeshBackground>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  content: { padding: spacing.lg, paddingBottom: spacing.xxl, gap: spacing.sm },
  title: {
    fontFamily: fonts.displayExtra,
    fontSize: 28,
    color: colors.cream[900],
  },
  sub: {
    fontFamily: fonts.sans,
    fontSize: 14,
    color: colors.cream[800],
    marginBottom: spacing.md,
    marginTop: 4,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.white,
    borderRadius: radius.xl,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.cream[200],
    minHeight: 64,
  },
  pressed: { opacity: 0.92, transform: [{ scale: 0.99 }] },
  icon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  meta: { flex: 1 },
  rowTitle: {
    fontFamily: fonts.sansSemi,
    fontSize: 16,
    color: colors.cream[900],
  },
  rowSub: {
    fontFamily: fonts.sans,
    fontSize: 12,
    color: colors.cream[800],
    marginTop: 2,
  },
  logout: {
    marginTop: spacing.lg,
    alignItems: 'center',
    padding: spacing.md,
  },
  logoutText: {
    fontFamily: fonts.sansSemi,
    fontSize: 15,
    color: colors.danger[600],
  },
});
