/**
 * LOCK: docs/mobile/screens/staff/profile.md
 * Web: StaffSelfProfilePage — availability via updateStaffSelfProfile
 */
import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { PanelScaffold } from '@/components/panel/PanelScaffold';
import { Button } from '@/components/ui/Button';
import { FadeIn } from '@/components/ui/FadeIn';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import { updateStaffSelfProfile } from '@/services/staffDb';
import { colors, fonts, radius, spacing } from '@/theme';

const HOURS = ['09:00', '10:00', '11:00', '14:00', '15:00', '16:00'];
const DAYS = [
  { id: '1', label: 'Pzt' },
  { id: '2', label: 'Sal' },
  { id: '3', label: 'Çar' },
  { id: '4', label: 'Per' },
  { id: '5', label: 'Cum' },
];

const ROLE_BADGES: Record<string, { label: string; bg: string; fg: string }> = {
  coach: { label: 'Koç', bg: colors.brand[100], fg: colors.brand[700] },
  dietitian: { label: 'Diyetisyen', bg: colors.sage[100], fg: colors.sage[700] },
  doctor: { label: 'Doktor', bg: colors.gold[400], fg: colors.white },
};

function initialsOf(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p.charAt(0).toUpperCase())
    .join('');
}

function normalizeAvail(raw: unknown): Record<string, string[]> {
  if (!raw || typeof raw !== 'object') return {};
  const out: Record<string, string[]> = {};
  for (const [k, v] of Object.entries(raw as Record<string, unknown>)) {
    out[k] = Array.isArray(v) ? v.map(String) : [];
  }
  return out;
}

export default function StaffProfile() {
  const { staff, email, refreshAuth } = useAuth();
  const { toast } = useToast();
  const [avail, setAvail] = useState<Record<string, string[]>>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setAvail(normalizeAvail(staff?.availability));
  }, [staff?.availability]);

  const name = String(staff?.name || 'Personel');
  const roleBadge = ROLE_BADGES[String(staff?.role || '')];

  const toggle = (day: string, hour: string) => {
    setAvail((prev) => {
      const cur = prev[day] || [];
      const next = cur.includes(hour) ? cur.filter((h) => h !== hour) : [...cur, hour];
      return { ...prev, [day]: next };
    });
  };

  const save = async () => {
    if (!staff?.id) return;
    setSaving(true);
    const res = await updateStaffSelfProfile(String(staff.id), {
      ...staff,
      name,
      availability: avail,
    });
    setSaving(false);
    if (!res.success) {
      toast(res.error || 'Kaydedilemedi.', 'error');
      return;
    }
    toast('Müsaitlik bilgileriniz kaydedildi', 'success');
    await refreshAuth();
  };

  return (
    <PanelScaffold subtitle={name} title="Profilim">
      <FadeIn delay={40}>
        <View style={styles.identityCard}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{initialsOf(name)}</Text>
          </View>
          <View style={{ flex: 1, gap: 4 }}>
            <View style={styles.nameRow}>
              <Text style={styles.name}>{name}</Text>
              {roleBadge ? (
                <View style={[styles.roleBadge, { backgroundColor: roleBadge.bg }]}>
                  <Text style={[styles.roleBadgeText, { color: roleBadge.fg }]}>
                    {roleBadge.label}
                  </Text>
                </View>
              ) : null}
            </View>
            <Text style={styles.emailText}>{email}</Text>
          </View>
        </View>
      </FadeIn>

      <Text style={styles.section}>Müsaitlik</Text>
      {DAYS.map((d, i) => {
        const count = (avail[d.id] || []).length;
        return (
          <FadeIn key={d.id} delay={70 + i * 30}>
            <View style={styles.dayCard}>
              <Text style={styles.dayLabel}>
                {d.label}
                {count > 0 ? <Text style={styles.dayCount}> · {count} saat</Text> : null}
              </Text>
              <View style={styles.hours}>
                {HOURS.map((h) => {
                  const on = (avail[d.id] || []).includes(h);
                  return (
                    <Pressable
                      key={h}
                      onPress={() => toggle(d.id, h)}
                      style={({ pressed }) => [
                        styles.hour,
                        on && styles.hourOn,
                        pressed && styles.hourPressed,
                      ]}>
                      <Text style={[styles.hourText, on && styles.hourTextOn]}>{h}</Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>
          </FadeIn>
        );
      })}

      <View style={styles.saveDivider} />
      <Button
        disabled={saving}
        label="Müsaitliği kaydet"
        onPress={() => void save()}
      />
    </PanelScaffold>
  );
}

const styles = StyleSheet.create({
  identityCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: colors.white,
    borderRadius: radius.xl,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.cream[200],
  },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: radius.full,
    backgroundColor: colors.brand[500],
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { fontFamily: fonts.sansSemi, fontSize: 18, color: colors.white },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' },
  name: { fontFamily: fonts.sansSemi, fontSize: 17, color: colors.cream[900] },
  roleBadge: {
    borderRadius: radius.full,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  roleBadgeText: { fontFamily: fonts.sansSemi, fontSize: 11 },
  emailText: { fontFamily: fonts.sans, fontSize: 13, color: colors.cream[800] },
  section: {
    fontFamily: fonts.displayBold,
    fontSize: 18,
    color: colors.cream[900],
    marginTop: spacing.sm,
  },
  dayCard: {
    backgroundColor: colors.white,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.cream[200],
    padding: spacing.md,
    gap: 10,
  },
  dayLabel: { fontFamily: fonts.sansSemi, fontSize: 14, color: colors.cream[900] },
  dayCount: { fontFamily: fonts.sans, color: colors.brand[600] },
  hours: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  hour: {
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.cream[200],
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: colors.cream[50],
  },
  hourOn: {
    backgroundColor: colors.brand[500],
    borderColor: colors.brand[500],
  },
  hourPressed: { opacity: 0.85 },
  hourText: { fontFamily: fonts.sansSemi, fontSize: 13, color: colors.cream[800] },
  hourTextOn: { color: colors.white },
  saveDivider: { height: spacing.md },
});
