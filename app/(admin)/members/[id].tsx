import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router, useLocalSearchParams } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

import { PanelScaffold } from '@/components/panel/PanelScaffold';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { FadeIn } from '@/components/ui/FadeIn';
import { InlineSpinner } from '@/components/ui/InlineSpinner';
import { useData } from '@/context/DataContext';
import { getPlanLabel } from '@/data/membershipPlans';
import { colors, fonts, radius, spacing } from '@/theme';

const TEAM_ROWS: {
  key: 'assignedCoachId' | 'assignedDietitianId' | 'assignedDoctorId';
  label: string;
}[] = [
  { key: 'assignedCoachId', label: 'Koç' },
  { key: 'assignedDietitianId', label: 'Diyetisyen' },
  { key: 'assignedDoctorId', label: 'Doktor' },
];

/** LOCK: members.md + member-health.md */
export default function AdminMemberDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { loading, platform, staffById } = useData();
  const m = platform.members.find((c) => String(c.id) === String(id));

  if (loading && !m) {
    return (
      <PanelScaffold showBack subtitle="Üye detay + sağlık özeti" title="Üye">
        <InlineSpinner fill />
      </PanelScaffold>
    );
  }

  if (!m) {
    return (
      <PanelScaffold showBack subtitle="Üye detay + sağlık özeti" title="Üye">
        <EmptyState title="Üye bulunamadı." />
      </PanelScaffold>
    );
  }

  const plan = String(m.membership || 'free');

  return (
    <PanelScaffold showBack subtitle="Üye detay + sağlık özeti" title={String(m.name)}>
      <FadeIn>
        <View style={styles.profileCard}>
          <LinearGradient
            colors={[colors.brand[50], colors.white]}
            style={styles.profileGradient}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{String(m.name).charAt(0).toUpperCase()}</Text>
            </View>
            <View style={styles.profileHead}>
              <Text style={styles.profileName}>{String(m.name)}</Text>
              <View style={[styles.planBadge, plan === 'free' && styles.planBadgeBasic]}>
                <Text
                  style={[styles.planBadgeText, plan === 'free' && styles.planBadgeTextBasic]}>
                  {getPlanLabel(plan)}
                </Text>
              </View>
            </View>
          </LinearGradient>
          <View style={styles.profileRows}>
            <View style={styles.infoRow}>
              <View style={styles.infoIcon}>
                <Ionicons color={colors.cream[800]} name="mail" size={15} />
              </View>
              <Text style={styles.infoValue}>{String(m.email)}</Text>
            </View>
            <View style={styles.infoRow}>
              <View style={styles.infoIcon}>
                <Ionicons color={colors.cream[800]} name="call" size={15} />
              </View>
              <Text style={styles.infoValue}>{String(m.phone || '')}</Text>
            </View>
          </View>
        </View>
      </FadeIn>

      <FadeIn delay={60}>
        <View style={styles.card}>
          <Text style={styles.section}>Atanan ekip</Text>
          {TEAM_ROWS.map((row) => {
            const staffId = m[row.key] ? String(m[row.key]) : null;
            const staff = staffId ? staffById[staffId] : null;
            return (
              <View key={row.key} style={styles.teamRow}>
                <Text style={styles.teamRole}>{row.label}</Text>
                <Text style={[styles.teamName, !staff && styles.teamUnassigned]}>
                  {staff ? String(staff.name) : 'Atanmadı'}
                </Text>
              </View>
            );
          })}
        </View>
      </FadeIn>

      <FadeIn delay={120}>
        <View style={styles.card}>
          <Text style={styles.section}>Sağlık özeti</Text>
          <View style={styles.healthEmpty}>
            <Ionicons color={colors.sage[600]} name="pulse" size={22} />
            <View style={styles.healthTextWrap}>
              <Text style={styles.healthTitle}>Sağlık testi henüz tamamlanmadı</Text>
              <Text style={styles.healthDesc}>
                Üye testi tamamladığında analiz burada görünür.
              </Text>
            </View>
          </View>
        </View>
      </FadeIn>

      <FadeIn delay={180}>
        <Button
          label="Paketi düzenle"
          onPress={() => router.push('/(admin)/premium')}
          variant="secondary"
        />
      </FadeIn>
    </PanelScaffold>
  );
}

const styles = StyleSheet.create({
  profileCard: {
    backgroundColor: colors.white,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.cream[200],
    overflow: 'hidden',
  },
  profileGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.md,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: radius.full,
    backgroundColor: colors.brand[600],
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { fontFamily: fonts.sansSemi, fontSize: 22, color: colors.white },
  profileHead: { flex: 1, gap: 6 },
  profileName: { fontFamily: fonts.displayBold, fontSize: 18, color: colors.cream[900] },
  planBadge: {
    alignSelf: 'flex-start',
    backgroundColor: colors.brand[50],
    borderRadius: radius.full,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  planBadgeBasic: { backgroundColor: colors.cream[100] },
  planBadgeText: { fontFamily: fonts.sansSemi, fontSize: 11, color: colors.brand[700] },
  planBadgeTextBasic: { color: colors.cream[800] },
  profileRows: { padding: spacing.md, paddingTop: 0, gap: spacing.sm },
  infoRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  infoIcon: {
    width: 28,
    height: 28,
    borderRadius: radius.md,
    backgroundColor: colors.cream[100],
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoValue: { flex: 1, fontFamily: fonts.sans, fontSize: 15, color: colors.cream[900] },
  card: {
    backgroundColor: colors.white,
    borderRadius: radius.xl,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.cream[200],
    gap: spacing.sm,
  },
  section: {
    fontFamily: fonts.sansSemi,
    fontSize: 12,
    color: colors.brand[600],
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  teamRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  teamRole: { fontFamily: fonts.sansSemi, fontSize: 12, color: colors.brand[600] },
  teamName: { fontFamily: fonts.sans, fontSize: 15, color: colors.cream[900] },
  teamUnassigned: { color: colors.cream[800] },
  healthEmpty: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm + 4,
    backgroundColor: colors.sage[50],
    borderWidth: 1,
    borderColor: colors.sage[200],
    borderRadius: radius.lg,
    padding: spacing.md,
  },
  healthTextWrap: { flex: 1, gap: 2 },
  healthTitle: { fontFamily: fonts.sansSemi, fontSize: 14, color: colors.cream[900] },
  healthDesc: { fontFamily: fonts.sans, fontSize: 12, color: colors.cream[800] },
});
