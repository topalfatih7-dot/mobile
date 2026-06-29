import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { ResponsiveCenter } from '@/components/layout/ResponsiveCenter';
import { Card } from '@/components/ui/Card';
import { StackHeader } from '@/components/ui/StackHeader';
import { useApp } from '@/context/AppContext';
import { useResponsive } from '@/hooks/useResponsive';
import { colors, fonts, radius, spacing } from '@/constants/theme';

type WeightPoint = { date?: string; value?: number; weight?: number };

export default function MeasurementsScreen() {
  const { member } = useApp();
  const { horizontalPadding } = useResponsive();

  const weight = member?.weight != null ? String(member.weight) : '—';
  const height = member?.height != null ? String(member.height) : '—';
  const history = ((member?.progress as { weight?: WeightPoint[] } | undefined)?.weight) || [];

  return (
    <View style={styles.root}>
      <StatusBar style="dark" />
      <StackHeader subtitle="Kilo ve vücut ölçüleri" title="Ölçümlerim" />

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <ResponsiveCenter innerStyle={{ paddingHorizontal: horizontalPadding }}>
          <View style={styles.grid}>
            <Card padding={spacing.lg} style={styles.metric}>
              <Text style={styles.metricLabel}>Kilo</Text>
              <Text style={styles.metricValue}>
                {weight}
                {weight !== '—' ? <Text style={styles.metricUnit}> kg</Text> : null}
              </Text>
            </Card>
            <Card padding={spacing.lg} style={styles.metric}>
              <Text style={styles.metricLabel}>Boy</Text>
              <Text style={styles.metricValue}>
                {height}
                {height !== '—' ? <Text style={styles.metricUnit}> cm</Text> : null}
              </Text>
            </Card>
          </View>

          <Pressable onPress={() => router.push('/profile/edit')} style={styles.editLink}>
            <Text style={styles.editLinkText}>Ölçüleri güncelle</Text>
          </Pressable>

          <Text style={styles.sectionTitle}>Kilo geçmişi</Text>
          {history.length > 0 ? (
            history
              .slice()
              .reverse()
              .map((row, index) => {
                const value = row.value ?? row.weight;
                return (
                  <Card key={`${row.date}-${index}`} padding={spacing.md} style={styles.historyRow}>
                    <Text style={styles.historyDate}>{row.date || '—'}</Text>
                    <Text style={styles.historyValue}>{value != null ? `${value} kg` : '—'}</Text>
                  </Card>
                );
              })
          ) : (
            <Card padding={spacing.lg}>
              <Text style={styles.empty}>Henüz kilo kaydı yok. Profilden güncellediğinizde burada görünür.</Text>
            </Card>
          )}
        </ResponsiveCenter>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  content: { paddingBottom: spacing.xxl, paddingTop: spacing.md },
  grid: { flexDirection: 'row', gap: spacing.md },
  metric: { flex: 1 },
  metricLabel: { fontFamily: fonts.medium, fontSize: 13, color: colors.text.secondary },
  metricValue: { fontFamily: fonts.displayExtra, fontSize: 28, color: colors.text.primary, marginTop: 6 },
  metricUnit: { fontFamily: fonts.medium, fontSize: 14, color: colors.text.muted },
  editLink: { alignSelf: 'flex-start', marginTop: spacing.md, marginBottom: spacing.xl },
  editLinkText: { fontFamily: fonts.semibold, fontSize: 14, color: colors.brand[600] },
  sectionTitle: {
    fontFamily: fonts.display,
    fontSize: 18,
    color: colors.text.primary,
    marginBottom: spacing.md,
  },
  historyRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  historyDate: { fontFamily: fonts.medium, fontSize: 14, color: colors.text.secondary },
  historyValue: { fontFamily: fonts.bold, fontSize: 15, color: colors.text.primary },
  empty: { fontFamily: fonts.regular, fontSize: 14, lineHeight: 21, color: colors.text.secondary },
});
