import { Ionicons } from '@expo/vector-icons';
import { router, type Href } from 'expo-router';
import type { ComponentProps, ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { AppHeader } from '@/components/ui/AppHeader';
import { Card } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { Screen } from '@/components/ui/Screen';
import { colors, fonts, spacing } from '@/constants/theme';

type IconName = ComponentProps<typeof Ionicons>['name'];

type AdminPanelProps = {
  title: string;
  subtitle?: string;
  emptyTitle?: string;
  emptySubtitle?: string;
  children?: ReactNode;
  showBack?: boolean;
};

/** Ortak admin panel kabuğu — liste veya EmptyState. */
export function AdminPanelScreen({
  title,
  subtitle,
  emptyTitle = 'Kayıt yok',
  emptySubtitle = 'Bu bölüm için henüz veri bulunmuyor.',
  children,
  showBack = true,
}: AdminPanelProps) {
  const childList = Array.isArray(children) ? children : children != null ? [children] : [];
  const hasContent = childList.some((c) => c != null && c !== false);

  return (
    <Screen scroll contentStyle={styles.content} edges={{ top: true, bottom: true }}>
      <AppHeader showBack={showBack} subtitle={subtitle} title={title} />
      <View style={styles.body}>
        {hasContent ? children : <EmptyState subtitle={emptySubtitle} title={emptyTitle} />}
      </View>
    </Screen>
  );
}

type AdminNavItem = {
  label: string;
  href: Href;
  icon: IconName;
  hint?: string;
};

export function AdminNavGrid({ items }: { items: AdminNavItem[] }) {
  return (
    <View style={styles.grid}>
      {items.map((item) => (
        <Card
          key={item.label}
          onPress={() => router.push(item.href)}
          padding={spacing.md}
          style={styles.navCard}>
          <View style={styles.navIcon}>
            <Ionicons color={colors.teal[600]} name={item.icon} size={20} />
          </View>
          <Text style={styles.navLabel}>{item.label}</Text>
          {item.hint ? <Text style={styles.navHint}>{item.hint}</Text> : null}
        </Card>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  content: { paddingHorizontal: 0 },
  body: { paddingHorizontal: spacing.lg, paddingBottom: spacing.xl },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  navCard: {
    width: '48%',
    marginBottom: spacing.sm,
  },
  navIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.teal[50],
    marginBottom: spacing.sm,
  },
  navLabel: {
    fontFamily: fonts.semibold,
    fontSize: 14,
    color: colors.text.primary,
  },
  navHint: {
    fontFamily: fonts.regular,
    fontSize: 11.5,
    color: colors.text.muted,
    marginTop: 4,
  },
});
