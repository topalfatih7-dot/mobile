import { Ionicons } from '@expo/vector-icons';
import { router, type Href } from 'expo-router';
import { useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { PanelScaffold } from '@/components/panel/PanelScaffold';
import { EmptyState } from '@/components/ui/EmptyState';
import { FadeIn } from '@/components/ui/FadeIn';
import { InlineSpinner } from '@/components/ui/InlineSpinner';
import { useData } from '@/context/DataContext';
import { DEMO_ADMIN_STAFF_CHATS } from '@/data/uiDemo';
import { formatRelativeTimeTr } from '@/utils/relativeTime';
import { colors, fonts, radius, spacing } from '@/theme';

const ROLE_LABELS: Record<string, string> = {
  coach: 'Koç',
  dietitian: 'Diyetisyen',
  doctor: 'Doktor',
};

const ROLE_AVATAR: Record<string, { bg: string; fg: string }> = {
  coach: { bg: colors.brand[100], fg: colors.brand[700] },
  dietitian: { bg: colors.sage[100], fg: colors.sage[700] },
  doctor: { bg: colors.warm[100], fg: colors.warm[500] },
};

/** LOCK: docs/mobile/screens/admin/messages.md */
export default function AdminMessages() {
  const { loading, platform, staffById } = useData();
  const staffList = useMemo(
    () => (platform.staffList.length > 0 ? platform.staffList : Object.values(staffById)),
    [platform.staffList, staffById],
  );

  return (
    <PanelScaffold showBack subtitle="Personel sohbetleri" title="Mesajlar">
      {loading && staffList.length === 0 ? (
        <InlineSpinner fill />
      ) : staffList.length === 0 ? (
        <EmptyState title="Personel yok." />
      ) : (
        staffList.map((s, i) => {
          const id = String(s.id);
          const role = String(s.role);
          const avatar = ROLE_AVATAR[role] || ROLE_AVATAR.coach;
          const seed = DEMO_ADMIN_STAFF_CHATS[id] || [];
          const last = seed[seed.length - 1];
          return (
            <FadeIn delay={i * 40} key={id}>
              <Pressable
                onPress={() => router.push(`/(admin)/messages/${id}` as Href)}
                style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}>
                <View style={[styles.avatar, { backgroundColor: avatar.bg }]}>
                  <Text style={[styles.avatarText, { color: avatar.fg }]}>
                    {String(s.name).charAt(0).toUpperCase()}
                  </Text>
                </View>
                <View style={styles.body}>
                  <View style={styles.topLine}>
                    <Text numberOfLines={1} style={styles.name}>
                      {String(s.name)}
                    </Text>
                    {last ? (
                      <Text style={styles.time}>{formatRelativeTimeTr(last.createdAt)}</Text>
                    ) : null}
                    <Ionicons color={colors.cream[300]} name="chevron-forward" size={18} />
                  </View>
                  <Text style={styles.role}>{ROLE_LABELS[role] || role}</Text>
                  {last ? (
                    <Text numberOfLines={1} style={styles.preview}>
                      {last.text}
                    </Text>
                  ) : null}
                </View>
              </Pressable>
            </FadeIn>
          );
        })
      )}
    </PanelScaffold>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.white,
    borderRadius: radius.xl,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.cream[200],
    minHeight: 64,
  },
  rowPressed: { backgroundColor: colors.cream[100] },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { fontFamily: fonts.sansSemi, fontSize: 16 },
  body: { flex: 1 },
  topLine: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  name: { flex: 1, fontFamily: fonts.sansSemi, fontSize: 15, color: colors.cream[900] },
  time: { fontFamily: fonts.sans, fontSize: 11, color: colors.cream[800], opacity: 0.7 },
  role: { fontFamily: fonts.sans, fontSize: 12, color: colors.cream[800], marginTop: 2 },
  preview: { fontFamily: fonts.sans, fontSize: 12, color: colors.cream[800], marginTop: 4 },
});
