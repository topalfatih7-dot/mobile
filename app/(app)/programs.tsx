import { StatusBar } from 'expo-status-bar';
import { useMemo, useState } from 'react';
import { RefreshControl, ScrollView, StyleSheet, View } from 'react-native';

import { ResponsiveCenter } from '@/components/layout/ResponsiveCenter';
import { FeaturedProgram } from '@/components/programs/FeaturedProgram';
import { ProgramCard } from '@/components/programs/ProgramCard';
import { Chip } from '@/components/ui/Chip';
import { EmptyState } from '@/components/ui/EmptyState';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { useApp } from '@/context/AppContext';
import { PROGRAM_CATEGORIES } from '@/data/programs';
import { useResponsive } from '@/hooks/useResponsive';
import { colors, spacing } from '@/constants/theme';

export default function ProgramsScreen() {
  const { programs, featuredProgram, syncing, refresh } = useApp();
  const { programCardWidth, horizontalPadding } = useResponsive();
  const [category, setCategory] = useState('Tümü');

  const list = useMemo(
    () => (category === 'Tümü' ? programs : programs.filter((p) => p.category === category)),
    [category, programs],
  );

  return (
    <View style={styles.root}>
      <StatusBar style="dark" />
      <ScreenHeader subtitle="Sana özel hazırlanan planlar" title="Programlarım" />

      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl onRefresh={refresh} refreshing={syncing} tintColor={colors.brand[600]} />}
        showsVerticalScrollIndicator={false}>
        <ResponsiveCenter innerStyle={{ paddingHorizontal: horizontalPadding }}>
          {featuredProgram ? <FeaturedProgram program={featuredProgram} /> : null}

          {programs.length === 0 ? (
            <EmptyState
              subtitle="Koçun veya diyetisyenin sana program atadığında burada görünecek."
              title="Henüz program yok"
            />
          ) : (
            <>
              <View style={styles.chips}>
                <ScrollView
                  contentContainerStyle={styles.chipsRow}
                  horizontal
                  showsHorizontalScrollIndicator={false}>
                  {PROGRAM_CATEGORIES.map((c) => (
                    <Chip active={c === category} key={c} label={c} onPress={() => setCategory(c)} />
                  ))}
                </ScrollView>
              </View>

              <SectionHeader title={category === 'Tümü' ? 'Tüm Programlar' : category} />
              <View style={styles.grid}>
                {list.map((program) => (
                  <ProgramCard key={program.id} program={program} width={programCardWidth} />
                ))}
              </View>
            </>
          )}
        </ResponsiveCenter>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    paddingBottom: spacing.xxl,
  },
  chips: {
    marginHorizontal: -spacing.lg,
    marginVertical: spacing.lg,
  },
  chipsRow: {
    paddingHorizontal: spacing.lg,
    gap: spacing.sm,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
});
