import { Ionicons } from '@expo/vector-icons';
import { router, type Href } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { ProgressBar } from '@/components/ui/ProgressBar';
import type { FeaturedProgramData } from '@/data/programs';
import { colors, fonts, radius, spacing } from '@/constants/theme';

const WHITE_GRADIENT = ['#ffffff', '#ffffff'] as const;

export function FeaturedProgram({ program }: { program: FeaturedProgramData }) {
  const p = program;

  return (
    <Card gradient={p.gradient} padding={spacing.lg}>
      <View style={styles.tagRow}>
        <View style={styles.tag}>
          <Ionicons color={colors.white} name="flame" size={13} />
          <Text style={styles.tagText}>{p.tag}</Text>
        </View>
        <Ionicons color="rgba(255,255,255,0.5)" name="barbell" size={28} />
      </View>

      <Text style={styles.title}>{p.title}</Text>
      <Text style={styles.meta}>
        {p.weeks} hafta · {p.nextLabel}
      </Text>

      <View style={styles.progress}>
        <ProgressBar
          gradient={WHITE_GRADIENT}
          height={8}
          progress={p.progress}
          trackColor="rgba(255,255,255,0.28)"
        />
      </View>

      <View style={styles.bottom}>
        <Text style={styles.sessions}>
          {p.sessionsDone}/{p.sessionsTotal} seans tamamlandı
        </Text>
        <Button
          fullWidth={false}
          label="Devam Et"
          onPress={() => router.push(`/program/${program.id}` as Href)}
          rightIcon="play"
          size="sm"
          variant="secondary"
        />
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  tagRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  tag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: radius.full,
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  tagText: {
    fontFamily: fonts.semibold,
    fontSize: 11.5,
    color: colors.white,
  },
  title: {
    fontFamily: fonts.displayExtra,
    fontSize: 24,
    color: colors.white,
    marginTop: spacing.md,
  },
  meta: {
    fontFamily: fonts.medium,
    fontSize: 13,
    color: 'rgba(255,255,255,0.88)',
    marginTop: 4,
  },
  progress: {
    marginTop: spacing.lg,
  },
  bottom: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: spacing.md,
  },
  sessions: {
    flex: 1,
    fontFamily: fonts.semibold,
    fontSize: 13,
    color: colors.white,
  },
});
