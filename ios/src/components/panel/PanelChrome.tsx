import { Ionicons } from '@expo/vector-icons';
import { router, usePathname, type Href } from 'expo-router';
import { useMemo, useState, type ReactNode } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { PanelDrawer, type PanelDrawerItem } from '@/components/panel/PanelDrawer';
import { PanelTopBar } from '@/components/panel/PanelTopBar';
import { useAuth } from '@/context/AuthContext';
import { useScaledTheme } from '@/hooks/useScaledTheme';
import { colors } from '@/theme';
import type { IonName } from '@/data/memberNav';

type Accent = 'member' | 'staff' | 'admin';

type Props = {
  accent: Accent;
  items: PanelDrawerItem[];
  children: ReactNode;
  badge?: { label: string; icon?: IonName } | null;
  userName?: string;
  userPhoto?: string | null;
  brandHref: string;
  /** Üye paneli: bildirim zili */
  showNotificationBell?: boolean;
  notificationUnreadCount?: number;
  notificationsHref?: string;
  profileHref?: string;
};

/** TopBar + Drawer chrome — 3 panel layout’u sarmalar */
export function PanelChrome({
  accent,
  items,
  children,
  badge,
  userName,
  userPhoto,
  brandHref,
  showNotificationBell = false,
  notificationUnreadCount = 0,
  notificationsHref = '/(member)/notifications',
  profileHref,
}: Props) {
  const { logout, loggingOut } = useAuth();
  const pathname = usePathname();
  const t = useScaledTheme();
  const hit = t.ss(36);
  const [open, setOpen] = useState(false);

  // Web VideoCallPage shell dışı — call ekranında top bar / drawer yok
  const isCallScreen = /\/call\//.test(String(pathname || ''));

  const headerRight = useMemo(() => {
    if (!showNotificationBell) return null;
    return (
      <Pressable
        accessibilityLabel="Bildirimler"
        hitSlop={8}
        onPress={() => router.push(notificationsHref as Href)}
        style={({ pressed }) => [
          styles.bellBtn,
          { width: hit, height: hit },
          pressed && { opacity: 0.85 },
        ]}>
        <Ionicons color={colors.cream[800]} name="notifications-outline" size={t.icon.md} />
        {notificationUnreadCount > 0 ? <View style={styles.bellDot} /> : null}
      </Pressable>
    );
  }, [showNotificationBell, notificationUnreadCount, notificationsHref, hit, t.icon.md]);

  const handleLogout = async () => {
    if (loggingOut) return;
    setOpen(false);
    try {
      await logout();
      router.replace('/(auth)/login');
    } catch {
      /* overlay AuthContext’te kapanır */
    }
  };

  return (
    <View style={[styles.root, isCallScreen && styles.callRoot]}>
      {!isCallScreen ? (
        <PanelTopBar
          accent={accent}
          headerRight={headerRight}
          onLogoPress={() => router.replace(brandHref as Href)}
          onMenuPress={() => setOpen(true)}
        />
      ) : null}
      <View style={styles.body}>{children}</View>
      {!isCallScreen ? (
        <PanelDrawer
          accent={accent}
          badge={badge}
          brandHref={brandHref}
          items={items}
          loggingOut={loggingOut}
          onClose={() => setOpen(false)}
          onLogout={handleLogout}
          open={open}
          profileHref={profileHref}
          userName={userName}
          userPhoto={userPhoto}
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.cream[50] },
  callRoot: { backgroundColor: '#0f1720' },
  body: { flex: 1, minWidth: 0 },
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
