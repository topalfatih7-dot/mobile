import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { router, usePathname, type Href } from 'expo-router';
import { useEffect } from 'react';
import {
  ActivityIndicator,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { BrandLogo } from '@/components/ui/BrandLogo';
import { useScaledTheme } from '@/hooks/useScaledTheme';
import { colors, fonts, radius, spacing } from '@/theme';
import type { IonName } from '@/data/memberNav';

export type PanelDrawerItem = {
  href: string;
  icon: IonName;
  label: string;
  end?: boolean;
  badgeCount?: number;
  healthTestBadge?: boolean;
};

type Accent = 'member' | 'staff' | 'admin';

type Props = {
  open: boolean;
  onClose: () => void;
  items: PanelDrawerItem[];
  accent?: Accent;
  badge?: { label: string; icon?: IonName } | null;
  userName?: string;
  userPhoto?: string | null;
  onLogout?: () => void | Promise<void>;
  loggingOut?: boolean;
  brandHref?: string;
};

const ACCENT_ACTIVE: Record<Accent, { bg: string; fg: string }> = {
  member: { bg: colors.brand[50], fg: colors.brand[700] },
  staff: { bg: colors.brand[500], fg: colors.white },
  admin: { bg: colors.cream[900], fg: colors.white },
};

function pathMatches(pathname: string, href: string, end?: boolean): boolean {
  const clean = (pathname.replace(/\/$/, '') || '/').toLowerCase();
  const hrefPath = href.includes('(')
    ? href.replace(/\/\([^)]+\)/g, '') || '/'
    : href;
  const normHref = (hrefPath.replace(/\/$/, '') || '/').toLowerCase();

  if (end) {
    return (
      clean === normHref ||
      clean.endsWith(normHref) ||
      (normHref === '' &&
        (clean === '/' || clean.endsWith('/staff') || clean.endsWith('/admin')))
    );
  }
  return clean === normHref || clean.startsWith(`${normHref}/`) || clean.includes(normHref);
}

function initials(name: string) {
  return name
    .split(' ')
    .filter(Boolean)
    .map((part) => part[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();
}

/** Ana proje PanelMobileMenu — soldan slide-in drawer */
export function PanelDrawer({
  open,
  onClose,
  items,
  accent = 'member',
  badge,
  userName,
  userPhoto,
  onLogout,
  loggingOut = false,
  brandHref,
}: Props) {
  const insets = useSafeAreaInsets();
  const t = useScaledTheme();
  const pathname = usePathname();
  const hiddenX = -(t.drawerWidth + 32);
  const translateX = useSharedValue(hiddenX);
  const backdrop = useSharedValue(0);
  const active = ACCENT_ACTIVE[accent];
  const photo = String(userPhoto || '').trim();
  const avatarSize = t.ss(40);

  useEffect(() => {
    if (open) {
      translateX.value = withTiming(0, { duration: 250 });
      backdrop.value = withTiming(1, { duration: 200 });
    } else {
      translateX.value = withTiming(hiddenX, { duration: 220 });
      backdrop.value = withTiming(0, { duration: 200 });
    }
  }, [open, hiddenX, translateX, backdrop]);

  const asideStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));
  const overlayStyle = useAnimatedStyle(() => ({
    opacity: backdrop.value,
  }));

  const navigate = (href: string) => {
    onClose();
    router.push(href as Href);
  };

  const goBrand = () => {
    if (brandHref) navigate(brandHref);
    else onClose();
  };

  const handleLogout = async () => {
    if (loggingOut || !onLogout) return;
    onClose();
    await onLogout();
  };

  return (
    <Modal animationType="none" onRequestClose={onClose} transparent visible={open}>
      <View style={styles.root}>
        <Animated.View style={[styles.overlay, overlayStyle]}>
          <Pressable
            accessibilityLabel="Menüyü kapat"
            onPress={onClose}
            style={StyleSheet.absoluteFill}
          />
        </Animated.View>

        <Animated.View
          style={[
            styles.aside,
            asideStyle,
            {
              paddingTop: insets.top,
              paddingBottom: insets.bottom + 8,
              width: t.drawerWidth,
            },
          ]}>
          <View style={styles.asideHeader}>
            <Pressable onPress={goBrand} style={styles.logoPress}>
              <BrandLogo size="sm" variant="logo" />
            </Pressable>
            <Pressable
              accessibilityLabel="Menüyü kapat"
              hitSlop={8}
              onPress={onClose}
              style={styles.closeBtn}>
              <Ionicons color={colors.cream[800]} name="close" size={t.icon.md} />
            </Pressable>
          </View>

          {(badge || userName) && (
            <View style={styles.userBlock}>
              <View style={styles.userRow}>
                {photo ? (
                  <Image
                    accessibilityLabel={userName || 'Profil fotoğrafı'}
                    contentFit="cover"
                    source={{ uri: photo }}
                    style={[styles.avatar, { width: avatarSize, height: avatarSize, borderRadius: avatarSize / 2 }]}
                  />
                ) : (
                  <View
                    style={[
                      styles.avatarFallback,
                      { width: avatarSize, height: avatarSize, borderRadius: avatarSize / 2 },
                    ]}>
                    <Text style={styles.avatarLetter}>{initials(userName || '?') || '?'}</Text>
                  </View>
                )}
                <View style={styles.userMeta}>
                  {badge ? (
                    <View
                      style={[
                        styles.roleBadge,
                        accent === 'admin'
                          ? { backgroundColor: colors.cream[900] }
                          : { backgroundColor: colors.brand[500] },
                      ]}>
                      {badge.icon ? (
                        <Ionicons color={colors.white} name={badge.icon} size={12} />
                      ) : null}
                      <Text style={styles.roleBadgeText}>{badge.label}</Text>
                    </View>
                  ) : null}
                  {userName ? (
                    <Text numberOfLines={1} style={styles.userName}>
                      {userName}
                    </Text>
                  ) : null}
                </View>
              </View>
            </View>
          )}

          <ScrollView
            contentContainerStyle={styles.nav}
            showsVerticalScrollIndicator={false}
            style={styles.navScroll}>
            {items.map((item) => {
              const isActive = pathMatches(pathname, item.href, item.end);
              const count = item.badgeCount || 0;
              return (
                <Pressable
                  key={`${item.href}-${item.label}`}
                  accessibilityRole="button"
                  onPress={() => navigate(item.href)}
                  style={({ pressed }) => [
                    styles.navItem,
                    { minHeight: Math.max(t.hit, t.ss(48)) },
                    isActive && { backgroundColor: active.bg },
                    pressed && !isActive && styles.navPressed,
                  ]}>
                  <Ionicons
                    color={isActive ? active.fg : colors.cream[900]}
                    name={item.icon}
                    size={t.icon.md}
                  />
                  <Text
                    numberOfLines={1}
                    style={[
                      styles.navLabel,
                      {
                        color: isActive ? active.fg : 'rgba(26,35,50,0.85)',
                        fontSize: t.type.body,
                      },
                    ]}>
                    {item.label}
                  </Text>
                  {count > 0 ? (
                    <View
                      style={[
                        styles.badge,
                        item.healthTestBadge
                          ? { backgroundColor: colors.warm[500] }
                          : { backgroundColor: colors.danger[500] },
                      ]}>
                      <Text style={styles.badgeText}>
                        {item.healthTestBadge ? '!' : count > 9 ? '9+' : String(count)}
                      </Text>
                    </View>
                  ) : null}
                </Pressable>
              );
            })}
          </ScrollView>

          {onLogout ? (
            <View style={styles.footer}>
              <Pressable
                disabled={loggingOut}
                onPress={() => void handleLogout()}
                style={({ pressed }) => [
                  styles.logoutBtn,
                  pressed && styles.navPressed,
                  loggingOut && { opacity: 0.6 },
                ]}>
                {loggingOut ? (
                  <ActivityIndicator color={colors.white} size="small" />
                ) : (
                  <Ionicons color={colors.white} name="log-out-outline" size={18} />
                )}
                <Text style={styles.logoutText}>
                  {loggingOut ? 'Çıkış yapılıyor…' : 'Çıkış Yap'}
                </Text>
              </Pressable>
            </View>
          ) : null}
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  overlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(26,35,50,0.4)',
  },
  aside: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 288,
    maxWidth: '82%',
    backgroundColor: colors.white,
    borderRightWidth: 1,
    borderRightColor: colors.cream[200],
    boxShadow: '4px 0px 16px rgba(0,0,0,0.18)',
    elevation: 12,
  },
  asideHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.cream[100],
    gap: 8,
  },
  logoPress: { flexShrink: 1, minWidth: 0 },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  userBlock: {
    paddingHorizontal: spacing.md,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.cream[100],
  },
  userRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    minWidth: 0,
  },
  avatar: {
    backgroundColor: colors.cream[100],
    flexShrink: 0,
  },
  avatarFallback: {
    backgroundColor: colors.brand[100],
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  avatarLetter: {
    fontFamily: fonts.sansSemi,
    fontSize: 13,
    color: colors.brand[700],
  },
  userMeta: { flex: 1, minWidth: 0, gap: 4 },
  roleBadge: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderRadius: radius.full,
    paddingHorizontal: 10,
    paddingVertical: 4,
    maxWidth: '100%',
  },
  roleBadgeText: {
    fontFamily: fonts.sansSemi,
    fontSize: 10,
    color: colors.white,
    letterSpacing: 0.4,
    textTransform: 'uppercase',
    flexShrink: 1,
  },
  userName: {
    fontFamily: fonts.sans,
    fontSize: 13,
    color: 'rgba(58,69,80,0.7)',
    flexShrink: 1,
  },
  navScroll: { flex: 1 },
  nav: { padding: 12, gap: 6 },
  navItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    minHeight: 48,
  },
  navPressed: { backgroundColor: colors.cream[100] },
  navLabel: {
    flex: 1,
    minWidth: 0,
    fontFamily: fonts.sansSemi,
    fontSize: 15,
    lineHeight: 20,
  },
  badge: {
    minWidth: 20,
    height: 20,
    borderRadius: radius.full,
    paddingHorizontal: 6,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  badgeText: {
    fontFamily: fonts.sansBold,
    fontSize: 10,
    color: colors.white,
  },
  footer: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.cream[100],
    padding: 12,
  },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    borderRadius: 12,
    minHeight: 48,
    paddingHorizontal: 14,
    paddingVertical: 12,
    backgroundColor: colors.danger[500],
  },
  logoutText: {
    fontFamily: fonts.sansSemi,
    fontSize: 15,
    color: colors.white,
    flexShrink: 1,
  },
});
