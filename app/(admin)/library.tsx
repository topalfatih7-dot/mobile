import { Ionicons } from '@expo/vector-icons';
import { useCallback, useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { PanelScaffold } from '@/components/panel/PanelScaffold';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { FadeIn } from '@/components/ui/FadeIn';
import { InlineSpinner } from '@/components/ui/InlineSpinner';
import { useToast } from '@/context/ToastContext';
import { fetchExercisesPage } from '@/services/exerciseLibrary';
import { colors, fonts, radius, spacing } from '@/theme';

const DIFFICULTY: Record<string, { label: string; bg: string; fg: string }> = {
  beginner: { label: 'Başlangıç', bg: colors.sage[100], fg: colors.sage[700] },
  intermediate: { label: 'Orta', bg: colors.brand[100], fg: colors.brand[700] },
};

const LOCATIONS: Record<string, string> = {
  home: 'Ev',
  gym: 'Salon',
  office: 'Ofis',
};

/** LOCK: docs/mobile/screens/admin/library.md */
export default function AdminLibrary() {
  const { toast } = useToast();
  const [exercises, setExercises] = useState<Record<string, unknown>[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetchExercisesPage({ page: 1, pageSize: 200 });
      setExercises(res.items);
    } catch {
      setExercises([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <PanelScaffold showBack subtitle="Egzersiz kütüphanesi" title="Kütüphane">
      {loading && exercises.length === 0 ? (
        <InlineSpinner fill />
      ) : exercises.length === 0 ? (
        <EmptyState title="Egzersiz yok." />
      ) : (
        exercises.map((ex, i) => {
          const difficulty = DIFFICULTY[String(ex.difficulty)];
          const locations = (ex.locations as string[]) || [];
          const videoPending = Boolean(ex.videoPending);
          return (
            <FadeIn delay={i * 40} key={String(ex.id)}>
              <View style={styles.card}>
                <View style={styles.thumb}>
                  {videoPending ? (
                    <Ionicons color={colors.brand[300]} name="videocam-off" size={22} />
                  ) : (
                    <Ionicons color={colors.brand[600]} name="videocam" size={22} />
                  )}
                </View>
                <View style={styles.body}>
                  <Text numberOfLines={1} style={styles.title}>
                    {String(ex.name)}
                  </Text>
                  <View style={styles.metaRow}>
                    <Text style={styles.meta}>{String(ex.bodyPart)}</Text>
                    {difficulty ? (
                      <View style={[styles.badge, { backgroundColor: difficulty.bg }]}>
                        <Text style={[styles.badgeText, { color: difficulty.fg }]}>
                          {difficulty.label}
                        </Text>
                      </View>
                    ) : null}
                    {videoPending ? (
                      <View style={[styles.badge, styles.badgeWarn]}>
                        <Text style={[styles.badgeText, styles.badgeTextWarn]}>
                          Video bekleniyor
                        </Text>
                      </View>
                    ) : null}
                  </View>
                  <View style={styles.chips}>
                    {locations.map((loc) => (
                      <View key={loc} style={styles.chip}>
                        <Text style={styles.chipText}>{LOCATIONS[loc] || loc}</Text>
                      </View>
                    ))}
                  </View>
                </View>
              </View>
            </FadeIn>
          );
        })
      )}
      <Button
        label="Video yükle"
        onPress={() => toast('Video yükleme yakında aktif olacak.', 'info')}
        variant="secondary"
      />
    </PanelScaffold>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    gap: spacing.md,
    backgroundColor: colors.white,
    borderRadius: radius.xl,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.cream[200],
  },
  thumb: {
    width: 56,
    height: 56,
    borderRadius: radius.lg,
    backgroundColor: colors.cream[100],
    alignItems: 'center',
    justifyContent: 'center',
  },
  body: { flex: 1 },
  title: { fontFamily: fonts.sansSemi, fontSize: 15, color: colors.cream[900] },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginTop: 4,
  },
  meta: { fontFamily: fonts.sans, fontSize: 12, color: colors.cream[800] },
  badge: {
    borderRadius: radius.full,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  badgeText: { fontFamily: fonts.sansSemi, fontSize: 10 },
  badgeWarn: { backgroundColor: colors.warm[100] },
  badgeTextWarn: { color: colors.warm[500] },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 6 },
  chip: {
    backgroundColor: colors.cream[100],
    borderRadius: radius.full,
    paddingHorizontal: 10,
    paddingVertical: 3,
  },
  chipText: { fontFamily: fonts.sans, fontSize: 11, color: colors.cream[800] },
});
