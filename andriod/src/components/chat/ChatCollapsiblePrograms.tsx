/**
 * Web parity: Adsız `src/components/chat/ChatCollapsiblePrograms.jsx`
 * Doctor → hidden. MOBILE DIFF: violet yok; brand/sage.
 */
import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { MemberProgramsPanel } from '@/components/chat/MemberProgramsPanel';
import { colors, fonts, radius, spacing } from '@/theme';

const ROLE_CONFIG: Record<
  string,
  {
    label: string;
    empty: string;
    icon: keyof typeof Ionicons.glyphMap;
    type: 'workout' | 'nutrition' | null;
    headerBg: string;
    chipBg: string;
    chipFg: string;
  }
> = {
  coach: {
    label: 'Antrenman Programları',
    empty: 'Henüz antrenman programı yok',
    icon: 'barbell-outline',
    type: 'workout',
    headerBg: colors.brand[500],
    chipBg: colors.brand[50],
    chipFg: colors.brand[800],
  },
  dietitian: {
    label: 'Beslenme Listeleri',
    empty: 'Henüz beslenme listesi yok',
    icon: 'nutrition-outline',
    type: 'nutrition',
    headerBg: colors.sage[500],
    chipBg: colors.sage[50],
    chipFg: colors.sage[700],
  },
  doctor: {
    label: 'Sağlık Notları',
    empty: 'Program veya liste bulunmuyor',
    icon: 'medkit-outline',
    type: null,
    headerBg: colors.warm[500],
    chipBg: colors.warm[50],
    chipFg: colors.warm[500],
  },
};

type Program = {
  id: string;
  type?: string;
  title?: string;
  staffName?: string;
  entries?: unknown[];
};

type Props = {
  programs?: Program[];
  role?: string;
  memberName?: string;
  defaultOpen?: boolean;
};

export function ChatCollapsiblePrograms({
  programs = [],
  role = 'coach',
  memberName,
  defaultOpen = false,
}: Props) {
  const [open, setOpen] = useState(defaultOpen);
  const cfg = ROLE_CONFIG[role] || ROLE_CONFIG.coach;
  const filtered =
    cfg.type == null
      ? []
      : programs.filter((p) => p.type === cfg.type);

  if (role === 'doctor') return null;

  return (
    <View style={styles.wrap}>
      <Pressable
        accessibilityRole="button"
        accessibilityState={{ expanded: open }}
        onPress={() => setOpen((v) => !v)}
        style={styles.toggle}>
        <View style={[styles.iconBox, { backgroundColor: cfg.headerBg }]}>
          <Ionicons color={colors.white} name={cfg.icon} size={16} />
        </View>
        <View style={styles.meta}>
          <Text style={styles.label}>{cfg.label}</Text>
          <Text style={styles.count}>
            {filtered.length ? `${filtered.length} kayıt` : cfg.empty}
          </Text>
        </View>
        <View style={[styles.chip, { backgroundColor: cfg.chipBg }]}>
          <Text style={[styles.chipText, { color: cfg.chipFg }]}>
            {open ? 'Gizle' : 'Göster'}
          </Text>
        </View>
        <Ionicons
          color={colors.cream[300]}
          name={open ? 'chevron-up' : 'chevron-down'}
          size={16}
        />
      </Pressable>

      {open ? (
        <ScrollView
          nestedScrollEnabled
          style={styles.panel}
          contentContainerStyle={styles.panelContent}>
          <MemberProgramsPanel
            compact
            memberName={memberName}
            programs={filtered as never}
            roleFilter={role}
          />
        </ScrollView>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    borderBottomWidth: 1,
    borderBottomColor: colors.cream[100] || colors.cream[200],
    backgroundColor: 'rgba(255,255,255,0.72)',
  },
  toggle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: spacing.lg,
    paddingVertical: 10,
  },
  iconBox: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  meta: { flex: 1, minWidth: 0 },
  label: {
    fontFamily: fonts.sansBold,
    fontSize: 12,
    color: colors.cream[900],
  },
  count: {
    fontFamily: fonts.sansMedium,
    fontSize: 10,
    color: colors.cream[800],
    opacity: 0.5,
    marginTop: 1,
  },
  chip: {
    borderRadius: radius.full || 999,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  chipText: { fontFamily: fonts.sansBold, fontSize: 10 },
  panel: { maxHeight: 176 },
  panelContent: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.sm,
  },
});
