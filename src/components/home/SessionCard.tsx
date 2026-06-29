import { router, type Href } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';

import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import type { NextSession } from '@/data/dashboard';
import { canAccessCallRoom, canJoinSession } from '@/services/videoCallSession';
import { colors, fonts, gradients, radius, spacing } from '@/constants/theme';

export function SessionCard({ session }: { session: NextSession }) {
  const roomAccess = canAccessCallRoom({
    id: session.id,
    date: session.rawDate,
    time: session.time,
    status: 'scheduled',
    durationMin: session.durationMin,
  });
  const joinCheck = canJoinSession({
    id: session.id,
    date: session.rawDate,
    time: session.time,
    status: 'scheduled',
    durationMin: session.durationMin,
  });

  const onJoin = () => {
    router.push(`/call/${session.sessionType}/${session.id}` as Href);
  };

  return (
    <Card gradient={gradients.brand} padding={spacing.lg}>
      <View style={styles.top}>
        <View style={styles.coach}>
          <View style={styles.avatar}>
            <Ionicons color={colors.white} name="person" size={22} />
          </View>
          <View>
            <Text style={styles.role}>{session.role}</Text>
            <Text style={styles.name}>{session.coach}</Text>
          </View>
        </View>

        <View style={styles.typePill}>
          <Ionicons color={colors.white} name="videocam" size={13} />
          <Text style={styles.typeText}>{session.type}</Text>
        </View>
      </View>

      <View style={styles.divider} />

      <View style={styles.bottom}>
        <View style={styles.timeRow}>
          <Ionicons color="rgba(255,255,255,0.92)" name="time-outline" size={16} />
          <Text style={styles.time}>
            {session.date}, {session.time} · {session.durationMin} dk
          </Text>
        </View>

        <Button
          disabled={!roomAccess.ok}
          fullWidth={false}
          label={joinCheck.ok ? 'Katıl' : 'Oda'}
          onPress={onJoin}
          rightIcon="arrow-forward"
          size="sm"
          variant="secondary"
        />
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  top: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  coach: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  avatar: {
    width: 46,
    height: 46,
    borderRadius: 23,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  role: {
    fontFamily: fonts.medium,
    fontSize: 12,
    color: 'rgba(255,255,255,0.82)',
  },
  name: {
    fontFamily: fonts.display,
    fontSize: 16.5,
    color: colors.white,
    marginTop: 1,
  },
  typePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: radius.full,
    backgroundColor: 'rgba(255,255,255,0.18)',
  },
  typeText: {
    fontFamily: fonts.semibold,
    fontSize: 11.5,
    color: colors.white,
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.18)',
    marginVertical: spacing.md,
  },
  bottom: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flex: 1,
  },
  time: {
    fontFamily: fonts.semibold,
    fontSize: 13.5,
    color: colors.white,
  },
});
