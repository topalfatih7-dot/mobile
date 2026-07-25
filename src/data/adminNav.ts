/**
 * Admin drawer — ana proje AdminShell.jsx adminNav ile birebir sıra.
 * LOCK: docs/mobile/03-navigation.md
 * Abonelikler: web'de yok; mobile inventory'de var → listenin sonuna.
 */
import type { ComponentProps } from 'react';
import type { Ionicons } from '@expo/vector-icons';

export type IonName = ComponentProps<typeof Ionicons>['name'];

export type AdminNavItem = {
  href: string;
  icon: IonName;
  label: string;
  end?: boolean;
  applicationsBadge?: boolean;
  chatBadge?: boolean;
  supportBadge?: boolean;
};

export type ResolvedAdminNavItem = AdminNavItem & { badgeCount: number };

export const ADMIN_NAV: AdminNavItem[] = [
  { href: '/(admin)', icon: 'grid-outline', label: 'Genel Bakış', end: true },
  { href: '/(admin)/members', icon: 'people-outline', label: 'Üyeler' },
  { href: '/(admin)/plans', icon: 'cube-outline', label: 'Paketler' },
  { href: '/(admin)/premium', icon: 'ribbon-outline', label: 'Premium Yönetimi' },
  {
    href: '/(admin)/applications',
    icon: 'person-add-outline',
    label: 'Başvurular',
    applicationsBadge: true,
  },
  { href: '/(admin)/library', icon: 'library-outline', label: 'Kütüphane' },
  { href: '/(admin)/staff', icon: 'medkit-outline', label: 'Kadromuz' },
  { href: '/(admin)/payments', icon: 'wallet-outline', label: 'Finans & Ödemeler' },
  { href: '/(admin)/sessions', icon: 'calendar-outline', label: 'Seanslar' },
  {
    href: '/(admin)/messages',
    icon: 'chatbubble-ellipses-outline',
    label: 'Mesajlar',
    chatBadge: true,
  },
  {
    href: '/(admin)/support',
    icon: 'chatbox-ellipses-outline',
    label: 'Destek Talepleri',
    supportBadge: true,
  },
  { href: '/(admin)/blog', icon: 'book-outline', label: 'Blog' },
  { href: '/(admin)/content', icon: 'sparkles-outline', label: 'İçerik' },
  { href: '/(admin)/analytics', icon: 'bar-chart-outline', label: 'Analitik' },
  { href: '/(admin)/ai-costs', icon: 'hardware-chip-outline', label: 'YZ Gider' },
  { href: '/(admin)/activity', icon: 'pulse-outline', label: 'Aktivite' },
  { href: '/(admin)/account', icon: 'shield-outline', label: 'Hesap Ayarları' },
  /** MOBILE DIFF: inventory'de var, web nav'da yok */
  { href: '/(admin)/subscriptions', icon: 'card-outline', label: 'Abonelikler' },
];

export function buildAdminNavItems(
  badges: {
    applicationsCount?: number;
    chatUnreadCount?: number;
    openSupportTicketsCount?: number;
  } = {},
): ResolvedAdminNavItem[] {
  const {
    applicationsCount = 0,
    chatUnreadCount = 0,
    openSupportTicketsCount = 0,
  } = badges;

  return ADMIN_NAV.map((item) => ({
    ...item,
    badgeCount: item.applicationsBadge
      ? applicationsCount
      : item.chatBadge
        ? chatUnreadCount
        : item.supportBadge
          ? openSupportTicketsCount
          : 0,
  }));
}
