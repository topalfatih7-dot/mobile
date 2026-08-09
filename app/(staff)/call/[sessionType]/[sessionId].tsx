import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams, type Href } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { VideoCallShell } from '@/components/call/VideoCallShell';
import { Button } from '@/components/ui/Button';
import { LoadingScreen } from '@/components/ui/LoadingScreen';
import { MeshBackground } from '@/components/ui/MeshBackground';
import { useAuth } from '@/context/AuthContext';
import { useData } from '@/context/DataContext';
import {
  normalizeVideoSessionType,
  resolveStaffCallContext,
} from '@/services/videoCallSession';
import { colors, fonts, radius, spacing } from '@/theme';

/** LOCK: docs/mobile/screens/staff/video-call.md */
export default function StaffVideoCall() {
  const { sessionType, sessionId } = useLocalSearchParams<{
    sessionType: string;
    sessionId: string;
  }>();
  const { staff } = useAuth();
  const { platform, loading, refreshData } = useData();
  const [refreshing, setRefreshing] = useState(false);
  const [clock, setClock] = useState(0);

  const rawType = String(sessionType || 'coach');
  const rawId = String(sessionId || '');
  const normalizedType = normalizeVideoSessionType(rawType);
  const backHref = '/(staff)' as Href;

  useEffect(() => {
    const timer = setInterval(() => setClock((value) => value + 1), 30_000);
    return () => clearInterval(timer);
  }, []);

  const resolved = useMemo(
    () =>
      resolveStaffCallContext({
        staff: staff as Record<string, unknown> | null,
        members: (platform.members || []) as Record<string, unknown>[],
        sessionType: rawType,
        sessionId: rawId,
      }),
    [staff, platform.members, rawType, rawId, clock],
  );

  const retry = async () => {
    setRefreshing(true);
    try {
      await refreshData();
    } finally {
      setRefreshing(false);
      setClock((value) => value + 1);
    }
  };

  if (loading || refreshing) {
    return <LoadingScreen label="Randevu kontrol ediliyor…" />;
  }

  if (!resolved.context || resolved.error) {
    return (
      <MeshBackground style={styles.root}>
        <View style={styles.errorCard}>
          <View style={styles.errorIcon}>
            <Ionicons color={colors.warm[500]} name="warning" size={28} />
          </View>
          <Text style={styles.errorTitle}>Görüşme Bulunamadı</Text>
          <Text style={styles.errorText}>
            {resolved.error || 'Randevu bulunamadı.'}
          </Text>
          <Button label="Tekrar dene" onPress={() => void retry()} size="md" />
          <Button
            label="Geri Dön"
            onPress={() => router.replace(backHref)}
            size="md"
            variant="secondary"
          />
        </View>
      </MeshBackground>
    );
  }

  return (
    <VideoCallShell
      backHref={backHref}
      displayName={resolved.context.displayName}
      isOwner
      joinAccess={resolved.context.joinCheck}
      remoteLabel={resolved.context.remoteLabel}
      session={resolved.context.session}
      sessionId={rawId}
      sessionType={resolved.context.sessionType || normalizedType}
    />
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.lg,
  },
  errorCard: {
    width: '100%',
    maxWidth: 440,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.cream[200],
    backgroundColor: colors.white,
    padding: spacing.xl,
    gap: spacing.md,
  },
  errorIcon: {
    width: 52,
    height: 52,
    borderRadius: radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.warm[100],
  },
  errorTitle: {
    fontFamily: fonts.displayExtra,
    fontSize: 21,
    color: colors.cream[900],
  },
  errorText: {
    fontFamily: fonts.sans,
    fontSize: 14,
    lineHeight: 21,
    color: colors.cream[800],
  },
});
