import * as WebBrowser from 'expo-web-browser';
import { router, type Href } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';

import { AppHeader } from '@/components/ui/AppHeader';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { PressableScale } from '@/components/ui/PressableScale';
import { Screen } from '@/components/ui/Screen';
import { useApp } from '@/context/AppContext';
import {
  fetchLibraryExercises,
  resolveExerciseVideoUrl,
  type LibraryExercise,
} from '@/services/db/exercises';
import { memberHasFullVideoAccess } from '@/utils/memberPackages';
import { colors, fonts, radius, spacing } from '@/constants/theme';

export default function LibraryScreen() {
  const { exerciseCount, member } = useApp();
  const [loading, setLoading] = useState(true);
  const [exercises, setExercises] = useState<LibraryExercise[]>([]);
  const [selected, setSelected] = useState<LibraryExercise | null>(null);
  const [opening, setOpening] = useState(false);
  const allowVideo = memberHasFullVideoAccess(member);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setExercises(await fetchLibraryExercises());
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const openVideo = async (ex: LibraryExercise) => {
    if (!allowVideo) {
      setSelected(ex);
      return;
    }
    setOpening(true);
    try {
          const url = await resolveExerciseVideoUrl(ex.videoUrl);
      if (!url) {
        setSelected(ex);
        return;
      }
      await WebBrowser.openBrowserAsync(url);
    } finally {
      setOpening(false);
    }
  };

  return (
    <Screen scroll contentStyle={styles.screen}>
      <StatusBar style="dark" />
      <AppHeader
        showBack
        subtitle={exerciseCount > 0 ? `${exerciseCount} egzersiz` : 'Hareket kütüphanesi'}
        title="Kütüphane"
      />

      <View style={styles.content}>
        {selected ? (
          <View style={styles.detail}>
            <Text style={styles.name}>{selected.name}</Text>
            <Text style={styles.meta}>
              {selected.bodyPart} · {selected.sportType}
            </Text>
            {selected.description ? <Text style={styles.desc}>{selected.description}</Text> : null}
            {!allowVideo ? (
              <Text style={styles.lock}>Video oynatma paketinizde yok — metin açıklaması gösteriliyor.</Text>
            ) : null}
            <Button label="Listeye dön" onPress={() => setSelected(null)} variant="secondary" />
          </View>
        ) : null}

        {loading ? (
          <ActivityIndicator color={colors.teal[600]} style={styles.loader} />
        ) : exercises.length === 0 ? (
          <View style={styles.emptyWrap}>
            <EmptyState
              subtitle="Egzersizler yüklendiğinde burada listelenir."
              title="Kütüphane boş"
            />
            <Button label="Programlara git" onPress={() => router.push('/programs' as Href)} variant="secondary" />
          </View>
        ) : (
          <View style={styles.list}>
            {exercises.map((ex) => (
              <PressableScale key={ex.id} onPress={() => void openVideo(ex)} style={styles.card}>
                <Text style={styles.name}>{ex.name}</Text>
                <Text style={styles.meta}>
                  {ex.bodyPart} · {ex.sportType}
                </Text>
                {ex.description ? <Text style={styles.desc} numberOfLines={2}>{ex.description}</Text> : null}
              </PressableScale>
            ))}
            {opening ? <ActivityIndicator color={colors.teal[600]} /> : null}
          </View>
        )}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  screen: { paddingHorizontal: 0, paddingBottom: spacing.xxl },
  content: { paddingHorizontal: spacing.lg, gap: spacing.md },
  loader: { marginTop: spacing.xl },
  emptyWrap: { gap: spacing.md },
  list: { gap: spacing.sm },
  card: {
    padding: spacing.md,
    borderRadius: radius.lg,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  detail: {
    padding: spacing.lg,
    borderRadius: radius.lg,
    backgroundColor: colors.teal[50],
    borderWidth: 1,
    borderColor: colors.teal[200],
    gap: spacing.sm,
  },
  name: { fontFamily: fonts.semibold, fontSize: 15.5, color: colors.text.primary },
  meta: { marginTop: 4, fontFamily: fonts.medium, fontSize: 12.5, color: colors.teal[700] },
  desc: { marginTop: 6, fontFamily: fonts.regular, fontSize: 13.5, lineHeight: 20, color: colors.text.secondary },
  lock: { fontFamily: fonts.medium, fontSize: 13, color: colors.champagne, marginVertical: spacing.sm },
});
