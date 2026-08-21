/**
 * Üye paneli drawer — ana proje memberNav.js ile birebir sıra.
 * LOCK: docs/mobile/03-navigation.md
 */
import type { ComponentProps } from 'react';
import type { Ionicons } from '@expo/vector-icons';

import { canOfferWebPurchase } from '@/services/webCheckoutHandoff';

export type IonName = ComponentProps<typeof Ionicons>['name'];

export type MemberNavItem = {
  href: string;
  icon: IonName;
  label: string;
  end?: boolean;
  chatBadge?: boolean;
  notificationsBadge?: boolean;
  supportBadge?: boolean;
  healthTestBadge?: boolean;
};

export const MEMBER_NAV: MemberNavItem[] = [
  { href: '/(member)/profile', icon: 'settings-outline', label: 'Profil' },
  { href: '/(member)/dashboard', icon: 'grid-outline', label: 'Panel', end: true },
  {
    href: '/(member)/health-test',
    icon: 'heart-outline',
    label: 'Kişisel Sağlık Analizi',
    healthTestBadge: true,
  },
  { href: '/(member)/calendar', icon: 'calendar-outline', label: 'Takvim' },
  { href: '/(member)/calorie', icon: 'flame-outline', label: 'Kalori Hesapla' },
  {
    href: '/(member)/messages',
    icon: 'chatbubble-ellipses-outline',
    label: 'Mesajlar',
    chatBadge: true,
  },
  { href: '/(member)/schedule', icon: 'calendar-number-outline', label: 'Randevularım' },
  { href: '/(member)/programs', icon: 'clipboard-outline', label: 'Programlarım' },
  { href: '/(member)/library', icon: 'library-outline', label: 'Kütüphane' },
  {
    href: '/(member)/notifications',
    icon: 'notifications-outline',
    label: 'Bildirimler',
    notificationsBadge: true,
  },
  {
    href: '/(member)/support',
    icon: 'help-circle-outline',
    label: 'Destek',
    supportBadge: true,
  },
  { href: '/(member)/profile/payments', icon: 'wallet-outline', label: 'Ödeme Yönetimi' },
];

export const MEMBER_UPGRADE_NAV: MemberNavItem = {
  href: '/(public)/membership',
  icon: 'ribbon-outline',
  label: 'Planları İncele',
};

export type MemberNavBadges = {
  membership?: string;
  chatUnreadCount?: number;
  notificationUnreadCount?: number;
  openSupportTicketsCount?: number;
  healthTestIncomplete?: boolean;
};

export type ResolvedNavItem = MemberNavItem & { badgeCount: number };

export function buildMemberNavItems(opts: MemberNavBadges = {}): ResolvedNavItem[] {
  const {
    membership,
    chatUnreadCount = 0,
    notificationUnreadCount = 0,
    openSupportTicketsCount = 0,
    healthTestIncomplete = false,
  } = opts;

  const base =
    membership === 'free' && canOfferWebPurchase()
      ? [...MEMBER_NAV, MEMBER_UPGRADE_NAV]
      : MEMBER_NAV;

  return base.map((item) => ({
    ...item,
    badgeCount: item.chatBadge
      ? chatUnreadCount
      : item.notificationsBadge
        ? notificationUnreadCount
        : item.supportBadge
          ? openSupportTicketsCount
          : item.healthTestBadge && healthTestIncomplete
            ? 1
            : 0,
  }));
}
