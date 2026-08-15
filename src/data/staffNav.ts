/**
 * Personel drawer — ana proje StaffShell.jsx staffNavForRole ile birebir sıra.
 * LOCK: docs/mobile/03-navigation.md
 */
import type { ComponentProps } from 'react';
import type { Ionicons } from '@expo/vector-icons';

export type IonName = ComponentProps<typeof Ionicons>['name'];

export type StaffNavItem = {
  href: string;
  icon: IonName;
  label: string;
  end?: boolean;
  chatBadge?: boolean;
  collabChatBadge?: boolean;
  adminChatBadge?: boolean;
  notifBadge?: boolean;
};

export type ResolvedStaffNavItem = StaffNavItem & { badgeCount: number };

function normalizeStaffRole(role: string | null | undefined): 'coach' | 'dietitian' | 'doctor' {
  const r = String(role || 'coach').toLowerCase();
  if (r === 'dietitian' || r === 'diyetisyen') return 'dietitian';
  if (r === 'doctor' || r === 'doktor') return 'doctor';
  return 'coach';
}

export function staffNavForRole(role: string | null | undefined): StaffNavItem[] {
  const base: StaffNavItem[] = [
    { href: '/(staff)', icon: 'grid-outline', label: 'Genel Bakış', end: true },
    { href: '/(staff)/profile', icon: 'person-circle-outline', label: 'Profilim' },
    { href: '/(staff)/clients', icon: 'people-outline', label: 'Danışanlarım' },
    {
      href: '/(staff)/notifications',
      icon: 'notifications-outline',
      label: 'Bildirimler',
      notifBadge: true,
    },
    {
      href: '/(staff)/messages',
      icon: 'chatbubble-ellipses-outline',
      label: 'Mesajlar',
      chatBadge: true,
    },
  ];

  const normalized = normalizeStaffRole(role);
  if (normalized === 'coach' || normalized === 'dietitian' || normalized === 'doctor') {
    base.push({
      href: '/(staff)/messages/collab',
      icon: 'people-circle-outline',
      label: 'Ekip Mesajları',
      collabChatBadge: true,
    });
  }
  base.push({
    href: '/(staff)/messages/admin',
    icon: 'shield-outline',
    label: 'Admin Mesajları',
    adminChatBadge: true,
  });

  if (normalized === 'doctor') {
    return [
      ...base,
      { href: '/(staff)/payments', icon: 'wallet-outline', label: 'Ödeme Yönetimi' },
    ];
  }

  if (normalized === 'dietitian') {
    return [
      ...base,
      { href: '/(staff)/lists', icon: 'list-outline', label: 'Listeler' },
      { href: '/(staff)/payments', icon: 'wallet-outline', label: 'Ödeme Yönetimi' },
    ];
  }

  const items: StaffNavItem[] = [
    ...base,
    { href: '/(staff)/programs', icon: 'clipboard-outline', label: 'Programlar' },
    { href: '/(staff)/library', icon: 'library-outline', label: 'Kütüphane' },
    { href: '/(staff)/payments', icon: 'wallet-outline', label: 'Ödeme Yönetimi' },
  ];
  return items;
}

export function buildStaffNavItems(
  role: string | null | undefined,
  badges: {
    chatUnreadCount?: number;
    staffAdminUnreadCount?: number;
    staffCollabUnreadCount?: number;
    notificationUnreadCount?: number;
  } = {},
): ResolvedStaffNavItem[] {
  const {
    chatUnreadCount = 0,
    staffAdminUnreadCount = 0,
    staffCollabUnreadCount = 0,
    notificationUnreadCount = 0,
  } = badges;

  return staffNavForRole(role).map((item) => ({
    ...item,
    badgeCount: item.chatBadge
      ? chatUnreadCount
      : item.adminChatBadge
        ? staffAdminUnreadCount
        : item.collabChatBadge
          ? staffCollabUnreadCount
          : item.notifBadge
            ? notificationUnreadCount
            : 0,
  }));
}
