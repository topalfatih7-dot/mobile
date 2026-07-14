import { router, type Href } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';

import { AppHeader } from '@/components/ui/AppHeader';
import { EmptyState } from '@/components/ui/EmptyState';
import { Screen } from '@/components/ui/Screen';
import { useApp } from '@/context/AppContext';
import { fetchLibraryExercises, type LibraryExercise } from '@/services/db/exercises';
import { normalizeStaffRole } from '@/utils/staffAccess';
import { colors, fonts, radius, spacing } from '@/constants/theme';

/** Web `StaffLibraryGate` — diyetisyen → listeler; koç/doktor → egzersiz kütüphanesi. */
export default function StaffLibraryScreen() {
  const { staff, exerciseCount } = useApp();
  const role = normalizeStaffRole(staff?.role);
  const [loading, setLoading] = useState(true);
  const [exercises, setExercises] = useState<LibraryExercise[]>([]);

  useEffect(() => {
    if (role === 'dietitian') {
      router.replace('/(staff)/lists' as Href);
    }
  }, [role]);

  const load = useCallback(async () => {
    if (role === 'dietitian') return;
    setLoading(true);
    try {
      setExercises(await fetchLibraryExercises());
    } finally {
      setLoading(false);
    }
  }, [role]);

  useEffect(() => {
    void load();
  }, [load]);

  if (role === 'dietitian') return null;

  return (
    <Screen scroll contentStyle={styles.content} edges={{ top: true, bottom: true }}>
      <AppHeader
        showBack
        subtitle={exerciseCount > 0 ? `${exerciseCount} egzersiz` : 'Egzersiz kütüphanesi'}
        title="Kütüphane"
      />
      <View style={styles.body}>
        {loading ? (
          <ActivityIndicator color={colors.teal[600]} size="large" style={styles.loader} />
        ) : exercises.length === 0 ? (
          <EmptyState subtitle="Egzersiz kütüphanesi henüz yüklenmedi." title="Kütüphane boş" />
        ) : (
          exercises.map((ex) => (
            <View key={ex.id} style={styles.card}>
              <Text style={styles.name}>{ex.name}</Text>
              <Text style={styles.meta}>
                {ex.bodyPart} · {ex.sportType}
              </Text>
              {ex.description ? <Text style={styles.desc}>{ex.description}</Text> : null}
            </View>
          ))
        )}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { paddingHorizontal: 0 },
  body: { paddingHorizontal: spacing.lg, paddingBottom: spacing.xl, gap: spacing.sm },
  loader: { marginTop: spacing.xxl },
  card: {
    padding: spacing.md,
    borderRadius: radius.lg,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  name: { fontFamily: fonts.semibold, fontSize: 15, color: colors.text.primary },
  meta: { fontFamily: fonts.medium, fontSize: 12, color: colors.teal[600], marginTop: 4 },
  desc: {
    fontFamily: fonts.regular,
    fontSize: 13,
    color: colors.text.secondary,
    marginTop: spacing.sm,
    lineHeight: 18,
  },
});
