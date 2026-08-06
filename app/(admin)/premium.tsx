import { Ionicons } from '@expo/vector-icons';
import { useMemo, useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeIn as ReFadeIn, SlideInDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { PanelScaffold } from '@/components/panel/PanelScaffold';
import { Button } from '@/components/ui/Button';
import { FadeIn } from '@/components/ui/FadeIn';
import { InlineSpinner } from '@/components/ui/InlineSpinner';
import { useData } from '@/context/DataContext';
import { useToast } from '@/context/ToastContext';
import { ALL_PLANS, getPlanLabel } from '@/data/membershipPlans';
import { adminUpdatePremiumMembership } from '@/services/adminDb';
import { colors, fonts, radius, spacing } from '@/theme';

const DURATION_MONTHS = [1, 3, 6, 12] as const;

const ASSIGN_ROWS: {
  key: 'coachId' | 'dietitianId' | 'doctorId';
  label: string;
  role: 'coach' | 'dietitian' | 'doctor';
}[] = [
  { key: 'coachId', label: 'Koç', role: 'coach' },
  { key: 'dietitianId', label: 'Diyetisyen', role: 'dietitian' },
  { key: 'doctorId', label: 'Doktor', role: 'doctor' },
];

type MemberEdit = {
  plan: string;
  months: number;
  coachId: string | null;
  dietitianId: string | null;
  doctorId: string | null;
};

function baseEditFor(client: Record<string, unknown>): MemberEdit {
  return {
    plan: String(client.membership || 'free'),
    months: 1,
    coachId: client.assignedCoachId ? String(client.assignedCoachId) : null,
    dietitianId: client.assignedDietitianId ? String(client.assignedDietitianId) : null,
    doctorId: client.assignedDoctorId ? String(client.assignedDoctorId) : null,
  };
}

function PlanBadge({ plan }: { plan: string }) {
  const isBasic = plan === 'free';
  return (
    <View style={[styles.planBadge, isBasic && styles.planBadgeBasic]}>
      <Text style={[styles.planBadgeText, isBasic && styles.planBadgeTextBasic]}>
        {getPlanLabel(plan)}
      </Text>
    </View>
  );
}

/** LOCK: docs/mobile/screens/admin/premium.md */
export default function AdminPremium() {
  const { toast } = useToast();
  const insets = useSafeAreaInsets();
  const { loading, platform, staffById, refreshData } = useData();
  const members = platform.members;
  const [edits, setEdits] = useState<Record<string, MemberEdit>>({});
  const [openId, setOpenId] = useState<string | null>(null);
  const [draft, setDraft] = useState<MemberEdit | null>(null);

  const staffByRole = useMemo(() => {
    const map: Record<'coach' | 'dietitian' | 'doctor', { id: string; name: string }[]> = {
      coach: [],
      dietitian: [],
      doctor: [],
    };
    const list =
      platform.staffList.length > 0 ? platform.staffList : Object.values(staffById);
    for (const staff of list) {
      const role = String(staff.role) as 'coach' | 'dietitian' | 'doctor';
      if (map[role]) {
        map[role].push({ id: String(staff.id), name: String(staff.name) });
      }
    }
    return map;
  }, [platform.staffList, staffById]);

  const openMember = openId ? members.find((c) => String(c.id) === openId) : null;

  const currentEditFor = (client: Record<string, unknown>): MemberEdit =>
    edits[String(client.id)] ?? baseEditFor(client);

  const openSheet = (client: Record<string, unknown>) => {
    setDraft(currentEditFor(client));
    setOpenId(String(client.id));
  };

  const closeSheet = () => {
    setOpenId(null);
    setDraft(null);
  };

  const [saving, setSaving] = useState(false);

  const save = async () => {
    if (!openId || !draft || !openMember) return;
    setSaving(true);
    const res = await adminUpdatePremiumMembership(openId, {
      membership: draft.plan,
      durationMonths: draft.months,
      assignedCoachId: draft.coachId,
      assignedDietitianId: draft.dietitianId,
      assignedDoctorId: draft.doctorId,
    });
    setSaving(false);
    if (!res.success) {
      toast(res.error || 'Kaydedilemedi', 'error');
      return;
    }
    // Immediately reflect returned member data in local edits for instant UI feedback
    const returnedMembership = res.member?.membership as string | undefined;
    const immediateEdit: MemberEdit = {
      ...draft,
      plan: returnedMembership || draft.plan,
    };
    setEdits((prev) => ({ ...prev, [openId]: immediateEdit }));
    const name = String(openMember.name);
    closeSheet();
    // Refresh full platform data so membership field propagates to all screens
    await refreshData();
    toast(`${name} için paket güncellendi.`, 'success');
  };

  return (
    <PanelScaffold showBack subtitle="Üye paketlerini yönet" title="Premium ata">
      {loading && members.length === 0 ? (
        <InlineSpinner fill />
      ) : (
        members.map((c, i) => {
          const edit = currentEditFor(c);
          return (
            <FadeIn delay={i * 40} key={String(c.id)}>
              <Pressable onPress={() => openSheet(c)} style={styles.row}>
                <View style={styles.avatar}>
                  <Text style={styles.avatarText}>
                    {String(c.name).charAt(0).toUpperCase()}
                  </Text>
                </View>
                <View style={styles.rowInfo}>
                  <Text style={styles.rowName}>{String(c.name)}</Text>
                  <View style={styles.rowMeta}>
                    <PlanBadge plan={edit.plan} />
                    <Text numberOfLines={1} style={styles.rowEmail}>
                      {String(c.email)}
                    </Text>
                  </View>
                </View>
                <Ionicons color={colors.cream[300]} name="chevron-forward" size={18} />
              </Pressable>
            </FadeIn>
          );
        })
      )}

      <Modal
        animationType="none"
        onRequestClose={closeSheet}
        transparent
        visible={!!openId && !!draft}>
        <View style={styles.sheetRoot}>
          <Animated.View
            entering={ReFadeIn.duration(200)}
            style={[StyleSheet.absoluteFill, styles.scrim]}>
            <Pressable onPress={closeSheet} style={StyleSheet.absoluteFill} />
          </Animated.View>
          {openMember && draft ? (
            <Animated.View
              entering={SlideInDown.springify().damping(18)}
              style={[styles.sheet, { paddingBottom: insets.bottom + spacing.md }]}>
              <View style={styles.grabber} />
              <ScrollView contentContainerStyle={styles.sheetContent}>
                <Text style={styles.sheetTitle}>{String(openMember.name)}</Text>
                <View style={styles.sheetBadgeRow}>
                  <PlanBadge plan={currentEditFor(openMember).plan} />
                </View>

                <Text style={styles.section}>Plan</Text>
                <View style={styles.chips}>
                  {ALL_PLANS.map((p) => {
                    const on = draft.plan === p.id;
                    return (
                      <Pressable
                        key={p.id}
                        onPress={() => setDraft({ ...draft, plan: p.id })}
                        style={[styles.chip, on && styles.chipOn]}>
                        <Text style={[styles.chipText, on && styles.chipTextOn]}>
                          {p.name}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>

                <Text style={styles.section}>Süre (ay)</Text>
                <View style={styles.chips}>
                  {DURATION_MONTHS.map((m) => {
                    const on = draft.months === m;
                    return (
                      <Pressable
                        key={m}
                        onPress={() => setDraft({ ...draft, months: m })}
                        style={[styles.chip, on && styles.chipOn]}>
                        <Text style={[styles.chipText, on && styles.chipTextOn]}>{m}</Text>
                      </Pressable>
                    );
                  })}
                </View>

                <Text style={styles.section}>Uzman atama</Text>
                {ASSIGN_ROWS.map((rowDef) => (
                  <View key={rowDef.key} style={styles.assignRow}>
                    <Text style={styles.assignLabel}>{rowDef.label}</Text>
                    <View style={styles.chips}>
                      {staffByRole[rowDef.role].map((st) => {
                        const on = draft[rowDef.key] === st.id;
                        return (
                          <Pressable
                            key={st.id}
                            onPress={() => setDraft({ ...draft, [rowDef.key]: st.id })}
                            style={[styles.chip, on && styles.chipOn]}>
                            <Text style={[styles.chipText, on && styles.chipTextOn]}>
                              {st.name}
                            </Text>
                          </Pressable>
                        );
                      })}
                      <Pressable
                        onPress={() => setDraft({ ...draft, [rowDef.key]: null })}
                        style={[styles.chip, draft[rowDef.key] === null && styles.chipOn]}>
                        <Text
                          style={[
                            styles.chipText,
                            draft[rowDef.key] === null && styles.chipTextOn,
                          ]}>
                          Atama yok
                        </Text>
                      </Pressable>
                    </View>
                  </View>
                ))}

                <Button label="Paketi güncelle" loading={saving} onPress={() => void save()} />
                <Button disabled={saving} label="Vazgeç" onPress={closeSheet} variant="ghost" />
              </ScrollView>
            </Animated.View>
          ) : null}
        </View>
      </Modal>
    </PanelScaffold>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm + 4,
    backgroundColor: colors.white,
    borderRadius: radius.xl,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.cream[200],
    minHeight: 56,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: radius.full,
    backgroundColor: colors.brand[100],
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { fontFamily: fonts.sansSemi, fontSize: 16, color: colors.brand[700] },
  rowInfo: { flex: 1, gap: 4 },
  rowName: { fontFamily: fonts.sansSemi, fontSize: 15, color: colors.cream[900] },
  rowMeta: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  rowEmail: { flex: 1, fontFamily: fonts.sans, fontSize: 12, color: colors.cream[800] },
  planBadge: {
    backgroundColor: colors.brand[50],
    borderRadius: radius.full,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  planBadgeBasic: { backgroundColor: colors.cream[100] },
  planBadgeText: { fontFamily: fonts.sansSemi, fontSize: 11, color: colors.brand[700] },
  planBadgeTextBasic: { color: colors.cream[800] },
  sheetRoot: { flex: 1, justifyContent: 'flex-end' },
  scrim: {
    backgroundColor: `${colors.cream[900]}66`,
  },
  sheet: {
    backgroundColor: colors.white,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    maxHeight: '88%',
    paddingTop: spacing.sm,
  },
  grabber: {
    alignSelf: 'center',
    width: 36,
    height: 4,
    borderRadius: radius.full,
    backgroundColor: colors.cream[300],
    marginBottom: spacing.sm,
  },
  sheetContent: { padding: spacing.lg, gap: spacing.sm },
  sheetTitle: { fontFamily: fonts.displayExtra, fontSize: 22, color: colors.cream[900] },
  sheetBadgeRow: { flexDirection: 'row' },
  section: {
    fontFamily: fonts.sansSemi,
    fontSize: 12,
    color: colors.brand[600],
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginTop: spacing.sm,
  },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  chip: {
    minHeight: 40,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: colors.cream[200],
    backgroundColor: colors.white,
    paddingHorizontal: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chipOn: { backgroundColor: colors.brand[600], borderColor: colors.brand[600] },
  chipText: { fontFamily: fonts.sansSemi, fontSize: 13, color: colors.cream[800] },
  chipTextOn: { color: colors.white },
  assignRow: { gap: 6 },
  assignLabel: { fontFamily: fonts.sansSemi, fontSize: 13, color: colors.cream[900] },
});
