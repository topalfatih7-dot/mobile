import * as WebBrowser from 'expo-web-browser';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useMemo } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ResponsiveCenter } from '@/components/layout/ResponsiveCenter';
import { Button } from '@/components/ui/Button';
import { buildRoomUrl, isVideoCallConfigured, SESSION_TYPE_META } from '@/config/videoCall';
import { useResponsive } from '@/hooks/useResponsive';
import { canAccessCallRoom, canJoinSession, type VideoSession } from '@/services/videoCallSession';
import { colors, fonts, gradients, radius, spacing } from '@/constants/theme';

type VideoCallPanelProps = {
  session: VideoSession;
  sessionType: 'coach' | 'dietitian';
  displayName: string;
  remoteLabel: string;
  side: 'member' | 'staff';
};

export function VideoCallPanel({
  session,
  sessionType,
  displayName,
  remoteLabel,
  side,
}: VideoCallPanelProps) {
  const insets = useSafeAreaInsets();
  const { horizontalPadding } = useResponsive();
  const meta = SESSION_TYPE_META[sessionType];
  const roomAccess = useMemo(() => canAccessCallRoom(session), [session]);
  const joinCheck = useMemo(() => canJoinSession(session), [session]);
  const roomUrl = buildRoomUrl(sessionType, session.id);
  const configured = isVideoCallConfigured();
  const canEnter =
    roomAccess.ok && ('canEnterRoom' in joinCheck ? joinCheck.canEnterRoom : joinCheck.ok);

  const onJoin = async () => {
    if (!roomUrl) return;
    await WebBrowser.openBrowserAsync(roomUrl, {
      presentationStyle: WebBrowser.WebBrowserPresentationStyle.FULL_SCREEN,
      enableBarCollapsing: true,
    });
  };

  return (
    <View style={[styles.root, { paddingTop: insets.top + spacing.md }]}>
      <ResponsiveCenter innerStyle={{ paddingHorizontal: horizontalPadding }}>
        <Pressable accessibilityLabel="Geri" onPress={() => router.back()} style={styles.back}>
          <Ionicons color={colors.text.primary} name="chevron-back" size={22} />
        </Pressable>

        <View style={styles.hero}>
          <View style={[styles.iconWrap, { backgroundColor: colors.brand[50] }]}>
            <Ionicons color={colors.brand[600]} name="videocam" size={28} />
          </View>
          <Text style={styles.title}>{meta.label}</Text>
          <Text style={styles.subtitle}>
            {displayName} · {remoteLabel}
          </Text>
          <Text style={styles.time}>
            {session.date} {session.time ? `· ${session.time}` : ''}
          </Text>
        </View>

        {!configured ? (
          <View style={styles.notice}>
            <Text style={styles.noticeTitle}>Video altyapısı yapılandırılmadı</Text>
            <Text style={styles.noticeBody}>
              `EXPO_PUBLIC_DAILY_DOMAIN` değerini mobile/.env dosyasına ekleyin (web ile aynı:
              yeniform.daily.co).
            </Text>
          </View>
        ) : null}

        {roomAccess.ok ? (
          <View style={styles.statusCard}>
            <Text style={styles.statusLabel}>
              {'statusLabel' in joinCheck ? joinCheck.statusLabel : 'Görüşme odası'}
            </Text>
            {'reason' in joinCheck && joinCheck.reason ? (
              <Text style={styles.statusHint}>{joinCheck.reason}</Text>
            ) : null}
          </View>
        ) : (
          <View style={[styles.statusCard, styles.statusCardMuted]}>
            <Text style={styles.statusLabel}>{roomAccess.reason}</Text>
          </View>
        )}

        <Button
          disabled={!configured || !canEnter}
          label={'ok' in joinCheck && joinCheck.ok ? 'Görüşmeye Katıl' : 'Görüşme Odası'}
          leftIcon="videocam"
          onPress={() => void onJoin()}
          size="lg"
          style={styles.join}
        />

        <Text style={styles.hint}>
          Görüşme Daily.co üzerinden açılır. {side === 'member' ? 'Koçunuz' : 'Danışanınız'} aynı
          odada bekliyor olabilir.
        </Text>
      </ResponsiveCenter>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.background,
  },
  back: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.lg,
  },
  hero: {
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  iconWrap: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  title: {
    fontFamily: fonts.displayExtra,
    fontSize: 24,
    color: colors.text.primary,
  },
  subtitle: {
    fontFamily: fonts.medium,
    fontSize: 15,
    color: colors.text.secondary,
    marginTop: spacing.xs,
  },
  time: {
    fontFamily: fonts.regular,
    fontSize: 14,
    color: colors.text.muted,
    marginTop: spacing.sm,
  },
  notice: {
    borderRadius: radius.lg,
    backgroundColor: colors.amber[50],
    borderWidth: 1,
    borderColor: colors.amber[100],
    padding: spacing.md,
    marginBottom: spacing.lg,
  },
  noticeTitle: {
    fontFamily: fonts.semibold,
    fontSize: 14,
    color: colors.text.primary,
  },
  noticeBody: {
    fontFamily: fonts.regular,
    fontSize: 13,
    lineHeight: 20,
    color: colors.text.secondary,
    marginTop: spacing.xs,
  },
  statusCard: {
    borderRadius: radius.lg,
    backgroundColor: colors.brand[50],
    padding: spacing.md,
    marginBottom: spacing.lg,
  },
  statusCardMuted: {
    backgroundColor: colors.ink[50],
  },
  statusLabel: {
    fontFamily: fonts.semibold,
    fontSize: 14,
    color: colors.text.primary,
  },
  statusHint: {
    fontFamily: fonts.regular,
    fontSize: 13,
    color: colors.text.secondary,
    marginTop: spacing.xs,
  },
  join: {
    marginBottom: spacing.md,
  },
  hint: {
    fontFamily: fonts.regular,
    fontSize: 12.5,
    lineHeight: 18,
    color: colors.text.muted,
    textAlign: 'center',
  },
});
