import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { PanelScaffold } from '@/components/panel/PanelScaffold';
import { Button } from '@/components/ui/Button';
import { FadeIn } from '@/components/ui/FadeIn';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
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

/** LOCK: docs/mobile/screens/staff/profile.md */
export default function StaffProfile() {
  const { staff, email } = useAuth();
  const { toast } = useToast();
  const [avail, setAvail] = useState<Record<string, string[]>>({
    '1': ['09:00', '10:00'],
    '3': ['14:00'],
    '5': ['09:00', '11:00'],
  });

  const name = String(staff?.name || 'Personel');
  const roleBadge = ROLE_BADGES[String(staff?.role || '')];

  const toggle = (day: string, hour: string) => {
    setAvail((prev) => {
      const cur = prev[day] || [];
      const next = cur.includes(hour) ? cur.filter((h) => h !== hour) : [...cur, hour];
      return { ...prev, [day]: next };
    });
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
        label="Müsaitliği kaydet"
        onPress={() => toast('Müsaitlik bilgileriniz kaydedildi', 'success')}
      />
    </PanelScaffold>
  );
}

const styles = StyleSheet.create({
  identityCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.white,
    borderRadius: radius.xl,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.cream[200],
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: radius.full,
    backgroundColor: colors.brand[500],
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { fontFamily: fonts.sansSemi, fontSize: 20, color: colors.white },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' },
  name: { fontFamily: fonts.sansSemi, fontSize: 16, color: colors.cream[900] },
  roleBadge: {
    borderRadius: radius.full,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  roleBadgeText: { fontFamily: fonts.sansSemi, fontSize: 11 },
  emailText: { fontFamily: fonts.sans, fontSize: 13, color: colors.cream[800] },
  section: {
    fontFamily: fonts.sansSemi,
    fontSize: 12,
    color: colors.brand[600],
    textTransform: 'uppercase',
    marginTop: spacing.sm,
  },
  dayCard: {
    backgroundColor: colors.white,
    borderRadius: radius.xl,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.cream[200],
    gap: spacing.sm,
    marginBottom: 8,
  },
  dayLabel: { fontFamily: fonts.sansSemi, fontSize: 14, color: colors.cream[900] },
  dayCount: { fontFamily: fonts.sans, fontSize: 12, color: colors.cream[800] },
  hours: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  hour: {
    minHeight: 44,
    paddingHorizontal: 12,
    borderRadius: radius.full,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.cream[200],
    alignItems: 'center',
    justifyContent: 'center',
  },
  hourOn: { backgroundColor: colors.brand[600], borderColor: colors.brand[600] },
  hourPressed: { transform: [{ scale: 0.92 }] },
  hourText: { fontFamily: fonts.sansSemi, fontSize: 12, color: colors.cream[800] },
  hourTextOn: { color: colors.white },
  saveDivider: {
    height: 1,
    backgroundColor: colors.cream[200],
    marginVertical: spacing.sm,
  },
});
