import { Ionicons } from '@expo/vector-icons';
import { router, type Href } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Avatar } from '@/components/ui/Avatar';
import { ResponsiveCenter } from '@/components/layout/ResponsiveCenter';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { useApp } from '@/context/AppContext';
import { useStaffDashboard } from '@/hooks/useStaffDashboard';
import { useResponsive } from '@/hooks/useResponsive';
import { normalizeStaffRole, staffRoleLabel } from '@/utils/staffAccess';
import { colors, fonts, gradients, radius, spacing } from '@/constants/theme';

type QuickLink = { label: string; href: Href; icon: keyof typeof Ionicons.glyphMap };

function staffProfileLinks(role?: string | null): QuickLink[] {
  const normalized = normalizeStaffRole(role);
  const links: QuickLink[] = [];

  if (normalized === 'dietitian') {
    links.push({ label: 'Listeler', href: '/(staff)/lists' as Href, icon: 'list' });
  } else {
    links.push({ label: 'Programlar', href: '/(staff)/programs' as Href, icon: 'clipboard' });
    links.push({ label: 'Kütüphane', href: '/(staff)/library' as Href, icon: 'library' });
  }

  links.push({ label: 'Ödeme Yönetimi', href: '/(staff)/payments' as Href, icon: 'wallet' });
  return links;
}

export default function StaffProfileScreen() {
  const insets = useSafeAreaInsets();
  const { user, staff, logout } = useApp();
  const { roleLabel, stats } = useStaffDashboard();
  const { horizontalPadding } = useResponsive();
  const links = staffProfileLinks(staff?.role);

  const onLogout = async () => {
    await logout();
    router.replace('/');
  };

  return (
    <View style={styles.root}>
      <StatusBar style="dark" />
      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingTop: insets.top + spacing.xl, paddingBottom: insets.bottom + spacing.xl },
        ]}
        showsVerticalScrollIndicator={false}>
        <ResponsiveCenter innerStyle={{ paddingHorizontal: horizontalPadding }}>
          <View style={styles.header}>
            <Avatar gradient={gradients.teal} name={user.name} ring size={84} />
            <Text style={styles.name}>{user.name}</Text>
            <Text style={styles.email}>{user.email}</Text>
            <View style={styles.rolePill}>
              <Ionicons color={colors.white} name="briefcase" size={14} />
              <Text style={styles.roleText}>{staffRoleLabel(staff?.role)}</Text>
            </View>
          </View>

          <Card padding={spacing.lg} style={styles.card}>
            <Text style={styles.cardTitle}>Panel Özeti</Text>
            <Text style={styles.cardLine}>{roleLabel}</Text>
            <Text style={styles.cardLine}>
              {stats.clientCount} danışan · {stats.programCount} program
            </Text>
          </Card>

          <Text style={styles.sectionTitle}>Kısayollar</Text>
          {links.map((link) => (
            <Pressable
              key={link.label}
              onPress={() => router.push(link.href)}
              style={styles.linkRow}>
              <View style={styles.linkIcon}>
                <Ionicons color={colors.teal[600]} name={link.icon} size={18} />
              </View>
              <Text style={styles.linkLabel}>{link.label}</Text>
              <Ionicons color={colors.ink[300]} name="chevron-forward" size={18} />
            </Pressable>
          ))}

          <Button label="Çıkış Yap" onPress={onLogout} style={styles.logout} variant="secondary" />
        </ResponsiveCenter>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.canvas },
  content: { flexGrow: 1 },
  header: { alignItems: 'center', marginBottom: spacing.xl },
  name: {
    fontFamily: fonts.displayExtra,
    fontSize: 24,
    color: colors.text.primary,
    marginTop: spacing.md,
  },
  email: {
    fontFamily: fonts.regular,
    fontSize: 14,
    color: colors.text.secondary,
    marginTop: 4,
  },
  rolePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: spacing.sm,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: radius.full,
    backgroundColor: colors.teal[600],
  },
  roleText: { fontFamily: fonts.semibold, fontSize: 12.5, color: colors.white },
  card: { marginBottom: spacing.xl },
  cardTitle: { fontFamily: fonts.bold, fontSize: 16, color: colors.text.primary },
  cardLine: {
    fontFamily: fonts.regular,
    fontSize: 14,
    color: colors.text.secondary,
    marginTop: spacing.sm,
    lineHeight: 20,
  },
  sectionTitle: {
    fontFamily: fonts.display,
    fontSize: 16,
    color: colors.text.primary,
    marginBottom: spacing.md,
  },
  linkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    marginBottom: spacing.sm,
  },
  linkIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.teal[50],
    marginRight: spacing.md,
  },
  linkLabel: {
    flex: 1,
    fontFamily: fonts.semibold,
    fontSize: 15,
    color: colors.text.primary,
  },
  logout: { marginTop: spacing.xl },
});
