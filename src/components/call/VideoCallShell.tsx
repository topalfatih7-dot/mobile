import { Ionicons } from '@expo/vector-icons';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';
import { LinearGradient } from 'expo-linear-gradient';
import { router, type Href } from 'expo-router';
import { useCallback, useEffect, useRef, useState, type ComponentType } from 'react';
import {
  ActivityIndicator,
  Linking,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button } from '@/components/ui/Button';
import { FadeIn } from '@/components/ui/FadeIn';
import { MeshBackground } from '@/components/ui/MeshBackground';
import { SafeWebView, isNativeWebViewAvailable } from '@/components/ui/SafeWebView';
import { env } from '@/config/env';
import { isUiOnly } from '@/config/runtime';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import { buildDailyRoomName, getDailyRoomToken } from '@/services/dailyRoom';
import type { VideoCallAccess } from '@/services/videoCallSession';
import { colors, fonts, radius, spacing } from '@/theme';
import type { MemberSession } from '@/utils/sessionBooking';

/** expo-camera native yoksa / Expo Go’da false — crash etmez. */
async function requestCamMicPermissions(): Promise<boolean> {
  try {
    const Constants = (await import('expo-constants')).default;
    if (Constants.appOwnership === 'expo') return false;
    const Cam = await import('expo-camera');
    const cam = await Cam.Camera.requestCameraPermissionsAsync();
    const mic = await Cam.Camera.requestMicrophonePermissionsAsync();
    return Boolean(cam.granted && mic.granted);
  } catch {
    return false;
  }
}

const TYPE_LABEL: Record<string, string> = {
  coach: 'Koç Görüşmesi',
  dietitian: 'Diyetisyen Görüşmesi',
  doctor: 'Doktor Görüşmesi',
};

type Props = {
  sessionType: string;
  sessionId: string;
  isOwner?: boolean;
  backHref?: Href;
  displayName?: string;
  remoteLabel?: string;
  session?: MemberSession;
  joinAccess?: VideoCallAccess;
};

type DailyParticipant = {
  session_id: string;
  user_name?: string;
  local?: boolean;
  tracks?: {
    video?: { state?: string; track?: unknown; persistentTrack?: unknown };
    audio?: { state?: string; track?: unknown; persistentTrack?: unknown };
  };
};

type DailyCall = {
  leave: () => Promise<void>;
  destroy: () => void;
  join: (opts: { url: string; token: string }) => Promise<void>;
  setLocalAudio: (on: boolean) => Promise<void> | void;
  setLocalVideo: (on: boolean) => Promise<void> | void;
  participants: () => Record<string, DailyParticipant>;
  on: (event: string, handler: (...args: unknown[]) => void) => void;
  off: (event: string, handler: (...args: unknown[]) => void) => void;
};

function PulseRing() {
  const progress = useSharedValue(0);
  useEffect(() => {
    progress.value = withRepeat(withTiming(1, { duration: 1800 }), -1);
  }, [progress]);
  const anim = useAnimatedStyle(() => ({
    transform: [{ scale: 1 + progress.value * 0.25 }],
    opacity: 0.6 * (1 - progress.value),
  }));
  return <Animated.View style={[styles.pulseRing, anim, { pointerEvents: 'none' }]} />;
}

function ConnectingDot() {
  const opacity = useSharedValue(0.4);
  useEffect(() => {
    opacity.value = withRepeat(
      withSequence(withTiming(1, { duration: 500 }), withTiming(0.4, { duration: 500 })),
      -1,
    );
  }, [opacity]);
  const anim = useAnimatedStyle(() => ({ opacity: opacity.value }));
  return <Animated.View style={[styles.connectDot, anim]} />;
}

function ControlBtn({
  icon,
  danger,
  onPress,
  label,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  danger?: boolean;
  onPress: () => void;
  label: string;
}) {
  return (
    <Pressable
      accessibilityLabel={label}
      onPress={onPress}
      style={({ pressed }) => [
        styles.ctrlBtn,
        danger && styles.ctrlDanger,
        pressed && { opacity: 0.85 },
      ]}>
      <Ionicons color={colors.white} name={icon} size={22} />
    </Pressable>
  );
}

/** LOCK video-call.md — Daily native SDK + WebView fallback */
export function VideoCallShell({
  sessionType,
  sessionId,
  isOwner = false,
  backHref,
  displayName,
  remoteLabel,
  session,
  joinAccess,
}: Props) {
  const insets = useSafeAreaInsets();
  const { member, staff } = useAuth();
  const { toast } = useToast();
  const [sheetOpen, setSheetOpen] = useState(false);
  const [joining, setJoining] = useState(false);
  const [tokenError, setTokenError] = useState('');
  const [inCall, setInCall] = useState(false);
  const [webViewUrl, setWebViewUrl] = useState<string | null>(null);
  const [micOn, setMicOn] = useState(true);
  const [camOn, setCamOn] = useState(true);
  const [participants, setParticipants] = useState<DailyParticipant[]>([]);
  const [DailyMediaView, setDailyMediaView] = useState<ComponentType<{
    videoTrack: unknown;
    audioTrack: unknown;
    mirror?: boolean;
    style?: object;
  }> | null>(null);
  const callRef = useRef<DailyCall | null>(null);

  // Camera/mic permission state (6B)
  const [permsDenied, setPermsDenied] = useState(false);

  useEffect(() => {
    if (isUiOnly()) return;
    let alive = true;
    void requestCamMicPermissions().then((granted) => {
      if (!alive) return;
      if (!granted) setPermsDenied(true);
    });
    return () => { alive = false; };
    // Only run once on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const label = TYPE_LABEL[sessionType] || 'Görüntülü görüşme';
  const userName =
    String(displayName || member?.name || staff?.name || 'Katılımcı').trim() ||
    'Katılımcı';
  const canJoin = joinAccess?.ok ?? true;

  const shortId =
    String(sessionId || '').length > 10
      ? `${String(sessionId).slice(0, 10)}…`
      : String(sessionId || '');

  const syncParticipants = useCallback(() => {
    const call = callRef.current;
    if (!call) return;
    try {
      const map = call.participants() || {};
      setParticipants(Object.values(map));
    } catch {
      /* ignore */
    }
  }, []);

  const destroyCall = async () => {
    const call = callRef.current;
    callRef.current = null;
    if (call) {
      try {
        await call.leave();
      } catch {
        /* ignore */
      }
      try {
        call.destroy();
      } catch {
        /* ignore */
      }
    }
    setInCall(false);
    setWebViewUrl(null);
    setParticipants([]);
  };

  const leave = () => {
    void destroyCall();
    if (backHref) router.replace(backHref);
    else router.back();
  };

  useEffect(() => {
    return () => {
      void destroyCall();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- unmount cleanup
  }, []);

  const toggleMic = async () => {
    const call = callRef.current;
    if (!call) return;
    const next = !micOn;
    try {
      await call.setLocalAudio(next);
      setMicOn(next);
    } catch {
      toast('Mikrofon değiştirilemedi.', 'warning');
    }
  };

  const toggleCam = async () => {
    const call = callRef.current;
    if (!call) return;
    const next = !camOn;
    try {
      await call.setLocalVideo(next);
      setCamOn(next);
    } catch {
      toast('Kamera değiştirilemedi.', 'warning');
    }
  };

  const joinCall = async () => {
    setTokenError('');
    const sid = String(sessionId || '').trim();
    if (!sid) {
      const message = 'Randevu bulunamadı.';
      setTokenError(message);
      toast(message, 'error');
      return;
    }

    if (!canJoin) {
      const message = joinAccess?.reason || 'Bu görüşmeye şu anda katılamazsınız.';
      setTokenError(message);
      toast(message, 'warning');
      return;
    }

    if (isUiOnly()) {
      setSheetOpen(true);
      return;
    }

    setJoining(true);
    try {
      const granted = await requestCamMicPermissions();
      if (!granted) {
        toast(
          'Kamera ve mikrofon izni gerekli (veya native kamera modülü yok — dev-client rebuild).',
          'warning',
        );
        return;
      }

      // Web parity: sessionType + sessionId (server builds room / isOwner)
      const tokenRes = await getDailyRoomToken({
        sessionType,
        sessionId: sid,
        userName,
      });
      if (!tokenRes.ok) {
        setTokenError(tokenRes.error);
        toast(tokenRes.error, 'error');
        return;
      }

      const fallbackRoom =
        tokenRes.roomName || buildDailyRoomName(sessionType, sid);
      const url =
        tokenRes.roomUrl ||
        (env.dailyDomain ? `https://${env.dailyDomain}/${fallbackRoom}` : null);

      if (!url) {
        const message = 'Görüşme odası URL bulunamadı.';
        setTokenError(message);
        toast(message, 'error');
        return;
      }

      try {
        const DailyMod = await import('@daily-co/react-native-daily-js');
        const Daily = DailyMod.default;
        const MediaView = DailyMod.DailyMediaView as ComponentType<{
          videoTrack: unknown;
          audioTrack: unknown;
          mirror?: boolean;
          style?: object;
        }>;
        if (MediaView) setDailyMediaView(() => MediaView);

        const call = Daily.createCallObject() as unknown as DailyCall;
        const onPart = () => syncParticipants();
        call.on('participant-joined', onPart);
        call.on('participant-updated', onPart);
        call.on('participant-left', onPart);
        call.on('joined-meeting', onPart);

        await call.join({ url, token: tokenRes.token });
        callRef.current = call;
        setMicOn(true);
        setCamOn(true);
        setInCall(true);
        syncParticipants();
        return;
      } catch {
        if (!isNativeWebViewAvailable()) {
          const message =
            'Görüşme için development build gerekir (Daily / WebView native).';
          setTokenError(message);
          toast(message, 'error');
          return;
        }
        const wvUrl = `${url}${url.includes('?') ? '&' : '?'}t=${encodeURIComponent(tokenRes.token)}`;
        setWebViewUrl(wvUrl);
        setInCall(true);
      }
    } catch (e: unknown) {
      const err = e as { message?: string };
      const message = String(err?.message || 'Görüşmeye katılılamadı.');
      setTokenError(message);
      toast(message, 'error');
    } finally {
      setJoining(false);
    }
  };

  const local = participants.find((p) => p.local);
  const remote = participants.find((p) => !p.local);
  const remoteVideo =
    remote?.tracks?.video?.persistentTrack || remote?.tracks?.video?.track || null;
  const remoteAudio =
    remote?.tracks?.audio?.persistentTrack || remote?.tracks?.audio?.track || null;
  const localVideo =
    local?.tracks?.video?.persistentTrack || local?.tracks?.video?.track || null;

  // 6B: Camera/mic denied — show settings redirect UI (non-blocking for demo/Expo Go)
  if (permsDenied && !isUiOnly()) {
    return (
      <MeshBackground style={styles.root}>
        <LinearGradient
          colors={[colors.brand[800], colors.brand[900], '#0f1720']}
          style={StyleSheet.absoluteFill}
        />
        <View
          style={[
            styles.content,
            { paddingTop: insets.top + 16, paddingBottom: insets.bottom + 20 },
          ]}>
          <Pressable
            accessibilityLabel="Geri dön"
            hitSlop={12}
            onPress={() => {
              if (backHref) router.replace(backHref);
              else router.back();
            }}
            style={styles.back}>
            <Ionicons color={colors.white} name="chevron-back" size={22} />
            <Text style={styles.backText}>Geri Dön</Text>
          </Pressable>

          <View style={styles.permDeniedCard}>
            <View style={styles.permIcon}>
              <Ionicons color={colors.warm[500]} name="videocam-off" size={36} />
            </View>
            <Text style={styles.permTitle}>İzin Gerekli</Text>
            <Text style={styles.permBody}>
              Video görüşme için kamera ve mikrofon izni gerekli. Lütfen ayarlardan
              izin verin.
            </Text>
            <Pressable
              onPress={() => void Linking.openSettings()}
              style={styles.settingsBtn}>
              <Ionicons color={colors.white} name="settings" size={18} />
              <Text style={styles.settingsBtnText}>Ayarları Aç</Text>
            </Pressable>
            <Pressable
              onPress={() => {
                if (backHref) router.replace(backHref);
                else router.back();
              }}
              style={styles.backBtn}>
              <Text style={styles.backBtnText}>Geri Dön</Text>
            </Pressable>
          </View>
        </View>
      </MeshBackground>
    );
  }

  if (inCall && webViewUrl) {
    return (
      <View style={styles.callRoot}>
        <SafeWebView
          allowsInlineMediaPlayback
          mediaPlaybackRequiresUserAction={false}
          source={{ uri: webViewUrl }}
          style={{ flex: 1 }}
        />
        <Pressable
          accessibilityLabel="Görüşmeden ayrıl"
          hitSlop={12}
          onPress={leave}
          style={[styles.callLeave, { top: insets.top + 12 }]}>
          <Ionicons color={colors.white} name="close" size={22} />
          <Text style={styles.backText}>Ayrıl</Text>
        </Pressable>
      </View>
    );
  }

  if (inCall) {
    return (
      <View style={[styles.callRoot, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
        <LinearGradient
          colors={[colors.brand[900], '#0f1720']}
          style={StyleSheet.absoluteFill}
        />
        <View style={styles.callHeader}>
          <Text style={styles.callTitle}>{label}</Text>
          <View style={styles.liveRow}>
            <View style={styles.liveDot} />
            <Text style={styles.liveText}>Canlı</Text>
          </View>
        </View>

        <View style={styles.stageArea}>
          <View style={styles.remoteTile}>
            {DailyMediaView && remoteVideo ? (
              <DailyMediaView
                audioTrack={remoteAudio}
                mirror={false}
                style={StyleSheet.absoluteFill}
                videoTrack={remoteVideo}
              />
            ) : (
              <View style={styles.waiting}>
                <ActivityIndicator color={colors.white} />
                <Text style={styles.waitingText}>
                  {remote ? 'Kamera kapalı' : 'Karşı taraf bekleniyor…'}
                </Text>
              </View>
            )}
            <Text style={styles.tileLabel}>
              {remote?.user_name || remoteLabel || (isOwner ? 'Üye' : 'Uzman')}
            </Text>
          </View>

          <View style={styles.pip}>
            {DailyMediaView && localVideo && camOn ? (
              <DailyMediaView
                audioTrack={null}
                mirror
                style={StyleSheet.absoluteFill}
                videoTrack={localVideo}
              />
            ) : (
              <View style={styles.pipPlaceholder}>
                <Ionicons color={colors.white} name="person" size={22} />
              </View>
            )}
            <Text style={styles.pipLabel}>Sen</Text>
          </View>
        </View>

        <View style={styles.controls}>
          <ControlBtn
            icon={micOn ? 'mic' : 'mic-off'}
            label={micOn ? 'Sesi kapat' : 'Sesi aç'}
            danger={!micOn}
            onPress={() => void toggleMic()}
          />
          <ControlBtn
            icon={camOn ? 'videocam' : 'videocam-off'}
            label={camOn ? 'Kamerayı kapat' : 'Kamerayı aç'}
            danger={!camOn}
            onPress={() => void toggleCam()}
          />
          <ControlBtn danger icon="call" label="Ayrıl" onPress={leave} />
        </View>
      </View>
    );
  }

  return (
    <MeshBackground style={styles.root}>
      <LinearGradient
        colors={[colors.brand[800], colors.brand[900], '#0f1720']}
        style={StyleSheet.absoluteFill}
      />
      <View
        style={[
          styles.content,
          { paddingTop: insets.top + 16, paddingBottom: insets.bottom + 20 },
        ]}>
        <Pressable
          accessibilityLabel="Görüşmeden ayrıl"
          hitSlop={12}
          onPress={leave}
          style={styles.back}>
          <Ionicons color={colors.white} name="chevron-back" size={22} />
          <Text style={styles.backText}>Ayrıl</Text>
        </Pressable>

        <FadeIn style={styles.preStage}>
          <View style={styles.avatarWrap}>
            <PulseRing />
            <View style={styles.avatar}>
              <Ionicons color={colors.white} name="videocam" size={36} />
            </View>
          </View>
          <Text style={styles.title}>{label}</Text>
          <View style={styles.connectRow}>
            <ConnectingDot />
            <Text style={styles.connectText}>
              {joinAccess?.statusLabel || 'Görüşme odası hazırlanıyor…'}
            </Text>
          </View>
          {!canJoin && joinAccess?.reason ? (
            <Text style={styles.joinNotice}>{joinAccess.reason}</Text>
          ) : null}
        </FadeIn>

        <View style={styles.cards}>
          <FadeIn delay={80}>
            <View style={styles.card}>
              <View style={styles.cardRow}>
                <Text style={styles.cardLabel}>Randevu</Text>
                <Text style={styles.cardValue}>
                  {session?.date
                    ? format(new Date(session.date), 'd MMMM yyyy · HH:mm', {
                        locale: tr,
                      })
                    : shortId}
                </Text>
              </View>
              <View style={styles.cardRow}>
                <Text style={styles.cardLabel}>
                  {isOwner ? 'Danışan' : 'Uzman'}
                </Text>
                <Text style={styles.cardValue}>
                  {remoteLabel || (isOwner ? 'Danışan' : 'Uzman')}
                </Text>
              </View>
              <View style={styles.cardRow}>
                <Text style={styles.cardLabel}>Rol</Text>
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>
                    {isOwner ? 'Uzman (host)' : 'Üye'}
                  </Text>
                </View>
              </View>
            </View>
          </FadeIn>
        </View>

        <Button
          disabled={!canJoin}
          label={joining ? 'Bağlanılıyor…' : 'Görüşmeye katıl'}
          loading={joining}
          onPress={() => void joinCall()}
          rightIcon={joining ? undefined : 'videocam'}
        />
        {tokenError ? (
          <View style={styles.tokenError}>
            <Text style={styles.tokenErrorText}>{tokenError}</Text>
            {canJoin ? (
              <Pressable onPress={() => void joinCall()}>
                <Text style={styles.retryText}>Tekrar dene</Text>
              </Pressable>
            ) : null}
          </View>
        ) : null}
        <Button label="Geri dön" onPress={leave} variant="glass" />
      </View>

      <Modal
        animationType="slide"
        onRequestClose={() => setSheetOpen(false)}
        transparent
        visible={sheetOpen}>
        <Pressable onPress={() => setSheetOpen(false)} style={styles.sheetOverlay} />
        <View style={[styles.sheet, { paddingBottom: insets.bottom + spacing.md }]}>
          <View style={styles.sheetHandle} />
          <Text style={styles.sheetTitle}>Çok yakında</Text>
          <Text style={styles.sheetBody}>
            Görüntülü görüşme demo modda kullanılamaz. Gerçek oturumda buradan
            katılabilirsin.
          </Text>
          <Button
            label="Anladım"
            onPress={() => setSheetOpen(false)}
            style={{ alignSelf: 'stretch' }}
          />
        </View>
      </Modal>
    </MeshBackground>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  callRoot: { flex: 1, backgroundColor: '#0f1720' },
  callLeave: {
    position: 'absolute',
    right: spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(15,23,32,0.65)',
    borderRadius: radius.full,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  callHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: 12,
  },
  callTitle: { fontFamily: fonts.displayBold, fontSize: 18, color: colors.white },
  liveRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  liveDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.danger[500],
  },
  liveText: { fontFamily: fonts.sansSemi, fontSize: 12, color: colors.white },
  stageArea: { flex: 1, paddingHorizontal: spacing.md, paddingBottom: spacing.md },
  remoteTile: {
    flex: 1,
    borderRadius: 20,
    overflow: 'hidden',
    backgroundColor: '#111827',
  },
  waiting: {
    ...StyleSheet.absoluteFill,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  waitingText: { fontFamily: fonts.sans, fontSize: 13, color: 'rgba(255,255,255,0.7)' },
  tileLabel: {
    position: 'absolute',
    left: 12,
    bottom: 12,
    fontFamily: fonts.sansSemi,
    fontSize: 13,
    color: colors.white,
  },
  pip: {
    position: 'absolute',
    right: spacing.lg,
    bottom: spacing.lg,
    width: 110,
    height: 150,
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.35)',
    backgroundColor: '#1f2937',
  },
  pipPlaceholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pipLabel: {
    position: 'absolute',
    left: 8,
    bottom: 8,
    fontFamily: fonts.sansSemi,
    fontSize: 10,
    color: colors.white,
  },
  controls: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 16,
    paddingVertical: 16,
  },
  ctrlBtn: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(255,255,255,0.14)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  ctrlDanger: { backgroundColor: colors.danger[500] },
  content: {
    flex: 1,
    paddingHorizontal: spacing.lg,
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  back: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  backText: { fontFamily: fonts.sansSemi, fontSize: 15, color: colors.white },
  preStage: { alignItems: 'center', gap: spacing.sm, marginTop: spacing.xxl },
  avatarWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  pulseRing: {
    position: 'absolute',
    width: 96,
    height: 96,
    borderRadius: 32,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.15)',
    backgroundColor: 'rgba(255,255,255,0.06)',
  },
  avatar: {
    width: 96,
    height: 96,
    borderRadius: 32,
    backgroundColor: 'rgba(255,255,255,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontFamily: fonts.displayExtra,
    fontSize: 26,
    color: colors.white,
    textAlign: 'center',
  },
  connectRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 2 },
  connectDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.mint[400],
  },
  connectText: {
    fontFamily: fonts.sans,
    fontSize: 13,
    color: 'rgba(255,255,255,0.75)',
  },
  joinNotice: {
    marginTop: spacing.sm,
    borderRadius: radius.md,
    backgroundColor: 'rgba(244,165,116,0.16)',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    fontFamily: fonts.sans,
    fontSize: 12,
    lineHeight: 18,
    color: colors.warm[100],
    textAlign: 'center',
  },
  cards: { gap: spacing.md },
  card: {
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    borderRadius: 20,
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
  },
  cardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    minHeight: 44,
  },
  cardLabel: {
    flex: 1,
    fontFamily: fonts.sans,
    fontSize: 13,
    color: 'rgba(255,255,255,0.6)',
  },
  cardValue: { fontFamily: fonts.sansSemi, fontSize: 13, color: colors.white },
  badge: {
    backgroundColor: 'rgba(255,255,255,0.14)',
    borderRadius: radius.full,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  badgeText: { fontFamily: fonts.sansSemi, fontSize: 12, color: colors.white },
  tokenError: {
    alignItems: 'center',
    gap: spacing.xs,
    borderRadius: radius.md,
    backgroundColor: 'rgba(220,38,38,0.14)',
    padding: spacing.sm,
  },
  tokenErrorText: {
    fontFamily: fonts.sans,
    fontSize: 12,
    lineHeight: 18,
    color: colors.danger[100],
    textAlign: 'center',
  },
  retryText: {
    fontFamily: fonts.sansSemi,
    fontSize: 13,
    color: colors.white,
    textDecorationLine: 'underline',
  },
  sheetOverlay: { flex: 1, backgroundColor: 'rgba(15,23,32,0.55)' },
  sheet: {
    backgroundColor: colors.white,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.sm,
    alignItems: 'center',
    gap: spacing.sm,
  },
  sheetHandle: {
    width: 40,
    height: 4,
    borderRadius: radius.full,
    backgroundColor: colors.cream[200],
    marginBottom: spacing.sm,
  },
  sheetTitle: { fontFamily: fonts.displayExtra, fontSize: 20, color: colors.cream[900] },
  sheetBody: {
    fontFamily: fonts.sans,
    fontSize: 14,
    color: colors.cream[800],
    textAlign: 'center',
    lineHeight: 21,
    marginBottom: spacing.sm,
  },
  permDeniedCard: {
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    borderRadius: 24,
    padding: spacing.xl,
    alignItems: 'center',
    gap: spacing.md,
  },
  permIcon: {
    width: 72,
    height: 72,
    borderRadius: 24,
    backgroundColor: colors.warm[100],
    alignItems: 'center',
    justifyContent: 'center',
  },
  permTitle: {
    fontFamily: fonts.displayExtra,
    fontSize: 22,
    color: colors.white,
    textAlign: 'center',
  },
  permBody: {
    fontFamily: fonts.sans,
    fontSize: 14,
    color: 'rgba(255,255,255,0.75)',
    textAlign: 'center',
    lineHeight: 21,
  },
  settingsBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    height: 48,
    paddingHorizontal: spacing.xl,
    borderRadius: radius.xl,
    backgroundColor: colors.brand[500],
    alignSelf: 'stretch',
    justifyContent: 'center',
  },
  settingsBtnText: { fontFamily: fonts.sansSemi, fontSize: 15, color: colors.white },
  backBtn: {
    height: 44,
    paddingHorizontal: spacing.xl,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.25)',
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'stretch',
  },
  backBtnText: {
    fontFamily: fonts.sansSemi,
    fontSize: 14,
    color: 'rgba(255,255,255,0.75)',
  },
});
