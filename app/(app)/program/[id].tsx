import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { ResponsiveCenter } from '@/components/layout/ResponsiveCenter';
import { Card } from '@/components/ui/Card';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { StackHeader } from '@/components/ui/StackHeader';
import { useApp } from '@/context/AppContext';
import { useResponsive } from '@/hooks/useResponsive';
import { fetchProgramById, type DbProgram, type ProgramEntry } from '@/services/db/programs';
import { computeProgramProgress } from '@/services/memberDashboard';
import { completionKey, formatDateISO } from '@/utils/programSchedule';
import { colors, fonts, spacing } from '@/constants/theme';

function entryLabel(entry: ProgramEntry) {
  return entry.name || entry.exerciseName || 'Kayıt';
}

export default function ProgramDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { member, toggleProgramEntry } = useApp();
  const { horizontalPadding } = useResponsive();
  const [program, setProgram] = useState<DbProgram | null>(null);
  const [loading, setLoading] = useState(true);

  const todayStr = formatDateISO(new Date());
  const completed = (member?.completedActivities as Record<string, string[]> | undefined) || {};

  const load = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    try {
      setProgram(await fetchProgramById(id));
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    void load();
  }, [load]);

  const progress = useMemo(
    () => (program ? computeProgramProgress(program, member) : 0),
    [program, member],
  );

  const isDone = (entryId: string, dateStr = todayStr) =>
    (completed[dateStr] || []).includes(completionKey(dateStr, entryId));

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={colors.brand[600]} size="large" />
      </View>
    );
  }

  if (!program) {
    return (
      <View style={styles.root}>
        <StackHeader title="Program" />
        <Text style={styles.empty}>Program bulunamadı.</Text>
      </View>
    );
  }

  return (
    <View style={styles.root}>
      <StatusBar style="dark" />
      <StackHeader subtitle={program.staffName || 'Uzman programı'} title={program.title} />

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <ResponsiveCenter innerStyle={{ paddingHorizontal: horizontalPadding }}>
          <Card padding={spacing.lg}>
            <Text style={styles.desc}>{program.description || 'Program açıklaması yok.'}</Text>
            <View style={styles.progressRow}>
              <Text style={styles.progressLabel}>İlerleme</Text>
              <Text style={styles.progressValue}>%{Math.round(progress * 100)}</Text>
            </View>
            <ProgressBar progress={progress} />
          </Card>

          <Text style={styles.sectionTitle}>Bugünkü kayıtlar</Text>
          {(program.entries || []).length === 0 ? (
            <Text style={styles.empty}>Bu programda henüz kayıt yok.</Text>
          ) : (
            program.entries.map((entry) => {
              const done = isDone(entry.id);
              return (
                <Pressable
                  key={entry.id}
                  onPress={() => void toggleProgramEntry(todayStr, entry.id)}>
                  <Card padding={spacing.md} style={styles.entry}>
                    <Ionicons
                      color={done ? colors.success : colors.ink[300]}
                      name={done ? 'checkmark-circle' : 'ellipse-outline'}
                      size={22}
                    />
                    <View style={styles.entryBody}>
                      <Text style={[styles.entryTitle, done && styles.entryDone]}>{entryLabel(entry)}</Text>
                      {entry.mealType ? (
                        <Text style={styles.entryMeta}>{String(entry.mealType)}</Text>
                      ) : null}
                    </View>
                  </Card>
                </Pressable>
              );
            })
          )}
        </ResponsiveCenter>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.background },
  content: { paddingBottom: spacing.xxl, paddingTop: spacing.md },
  desc: { fontFamily: fonts.regular, fontSize: 14, lineHeight: 21, color: colors.text.secondary },
  progressRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: spacing.lg, marginBottom: spacing.sm },
  progressLabel: { fontFamily: fonts.medium, fontSize: 13, color: colors.text.secondary },
  progressValue: { fontFamily: fonts.bold, fontSize: 13, color: colors.text.primary },
  sectionTitle: {
    fontFamily: fonts.display,
    fontSize: 18,
    color: colors.text.primary,
    marginTop: spacing.xl,
    marginBottom: spacing.md,
  },
  entry: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, marginBottom: spacing.sm },
  entryBody: { flex: 1 },
  entryTitle: { fontFamily: fonts.semibold, fontSize: 15, color: colors.text.primary },
  entryDone: { color: colors.text.muted, textDecorationLine: 'line-through' },
  entryMeta: { fontFamily: fonts.regular, fontSize: 12, color: colors.text.muted, marginTop: 2 },
  empty: {
    fontFamily: fonts.regular,
    fontSize: 14,
    color: colors.text.secondary,
    padding: spacing.lg,
    textAlign: 'center',
  },
});
