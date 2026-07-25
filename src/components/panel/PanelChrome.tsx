import { Ionicons } from '@expo/vector-icons';
import { router, type Href } from 'expo-router';
import { useMemo, useState, type ReactNode } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { PanelDrawer, type PanelDrawerItem } from '@/components/panel/PanelDrawer';
import { PanelTopBar } from '@/components/panel/PanelTopBar';
import { useAuth } from '@/context/AuthContext';
import { colors } from '@/theme';
import type { IonName } from '@/data/memberNav';

type Accent = 'member' | 'staff' | 'admin';

type Props = {
  accent: Accent;
  items: PanelDrawerItem[];
  children: ReactNode;
  badge?: { label: string; icon?: IonName } | null;
  userName?: string;
  brandHref: string;
  /** Üye paneli: bildirim zili */
  showNotificationBell?: boolean;
  notificationUnreadCount?: number;
  notificationsHref?: string;
};

/** TopBar + Drawer chrome — 3 panel layout’u sarmalar */
export function PanelChrome({
  accent,
  items,
  children,
  badge,
  userName,
  brandHref,
  showNotificationBell = false,
  notificationUnreadCount = 0,
  notificationsHref = '/(member)/notifications',
}: Props) {
  const { logout } = useAuth();
  const [open, setOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  const headerRight = useMemo(() => {
    if (!showNotificationBell) return null;
    return (
      <Pressable
        accessibilityLabel="Bildirimler"
        hitSlop={8}
        onPress={() => router.push(notificationsHref as Href)}
        style={({ pressed }) => [styles.bellBtn, pressed && { opacity: 0.85 }]}>
        <Ionicons color={colors.cream[800]} name="notifications-outline" size={22} />
        {notificationUnreadCount > 0 ? <View style={styles.bellDot} /> : null}
      </Pressable>
    );
  }, [showNotificationBell, notificationUnreadCount, notificationsHref]);

  const handleLogout = async () => {
    setLoggingOut(true);
    try {
      await logout();
      router.replace('/(auth)/login');
    } finally {
      setLoggingOut(false);
    }
  };

  return (
    <View style={styles.root}>
      <PanelTopBar
        accent={accent}
        headerRight={headerRight}
        onMenuPress={() => setOpen(true)}
      />
      <View style={styles.body}>{children}</View>
      <PanelDrawer
        accent={accent}
        badge={badge}
        brandHref={brandHref}
        items={items}
        loggingOut={loggingOut}
        onClose={() => setOpen(false)}
        onLogout={handleLogout}
        open={open}
        userName={userName}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.cream[50] },
  body: { flex: 1 },
  bellBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bellDot: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.danger[500],
  },
});
