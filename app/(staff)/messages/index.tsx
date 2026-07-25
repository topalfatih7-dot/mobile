import { Ionicons } from '@expo/vector-icons';
import { router, type Href } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { PanelScaffold } from '@/components/panel/PanelScaffold';
import { FadeIn } from '@/components/ui/FadeIn';
import { InlineSpinner } from '@/components/ui/InlineSpinner';
import { useData } from '@/context/DataContext';
import { colors, fonts, radius, spacing } from '@/theme';

const CHANNELS: {
  id: string;
  title: string;
  subtitle: string;
  icon: 'shield' | 'git-network';
  tint: string;
  route: string;
}[] = [
  {
    id: 'admin',
    title: 'Admin',
    subtitle: 'Yönetim ile yazışma',
    icon: 'shield',
    tint: colors.brand[600],
    route: '/(staff)/messages/admin/ui-admin-1',
  },
  {
    id: 'collab',
    title: 'Ekip',
    subtitle: 'Danışan adına: Demo Üye',
    icon: 'git-network',
    tint: colors.sage[600],
    route: '/(staff)/messages/collab/ui-collab-1',
  },
];

/** Gerçekçi demo önizlemeler — thread içerikleriyle tutarlı. */
const PREVIEWS: Record<string, { text: string; time: string; unread: number }> = {
  'ui-demo-member': { text: 'Merhaba koçum, programı aldım.', time: '09:41', unread: 1 },
  'ui-client-2': { text: 'Bu hafta 3 antrenman tamamladım 💪', time: 'Dün', unread: 0 },
  'ui-client-3': { text: 'Liste için teşekkürler.', time: 'Paz', unread: 0 },
};

const PLAN_AVATAR_COLORS: Record<string, string> = {
  vip: colors.gold[400],
  spor: colors.brand[500],
  diyet: colors.sage[500],
};

/** LOCK: docs/mobile/screens/staff/messages.md */
export default function StaffMessagesIndex() {
  const { loading, staffClients } = useData();

  return (
    <PanelScaffold subtitle="Danışan sohbetleri" title="Mesajlar">
      {loading && staffClients.length === 0 ? (
        <InlineSpinner fill />
      ) : (
        <>
          {CHANNELS.map((ch, i) => (
            <FadeIn key={ch.id} delay={40 + i * 30}>
              <Pressable onPress={() => router.push(ch.route as Href)} style={styles.row}>
                <View style={[styles.channelIcon, { backgroundColor: ch.tint }]}>
                  <Ionicons color={colors.white} name={ch.icon} size={18} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.name}>{ch.title}</Text>
                  <Text style={styles.preview}>{ch.subtitle}</Text>
                </View>
                <Ionicons color={colors.cream[300]} name="chevron-forward" size={18} />
              </Pressable>
            </FadeIn>
          ))}

          {staffClients.map((c, i) => {
            const p = PREVIEWS[String(c.id)];
            const avatarColor =
              PLAN_AVATAR_COLORS[String(c.membership)] || colors.cream[300];
            return (
              <FadeIn key={String(c.id)} delay={40 + (CHANNELS.length + i) * 30}>
                <Pressable
                  onPress={() => router.push(`/(staff)/messages/${c.id}` as Href)}
                  style={styles.row}>
                  <View style={[styles.avatar, { backgroundColor: avatarColor }]}>
                    <Text style={styles.avatarText}>
                      {String(c.name || '?').charAt(0).toUpperCase()}
                    </Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.name}>{String(c.name)}</Text>
                    {p ? (
                      <Text numberOfLines={1} style={styles.preview}>
                        {p.text}
                      </Text>
                    ) : null}
                  </View>
                  <View style={styles.rowRight}>
                    {p ? <Text style={styles.time}>{p.time}</Text> : null}
                    {p && p.unread > 0 ? (
                      <View style={styles.unread}>
                        <Text style={styles.unreadText}>{p.unread}</Text>
                      </View>
                    ) : null}
                  </View>
                </Pressable>
              </FadeIn>
            );
          })}
        </>
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
  },
  channelIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { fontFamily: fonts.sansSemi, fontSize: 16, color: colors.white },
  name: { fontFamily: fonts.sansSemi, fontSize: 15, color: colors.cream[900] },
  preview: {
    fontFamily: fonts.sans,
    fontSize: 12,
    color: colors.cream[800],
    opacity: 0.65,
    marginTop: 2,
  },
  rowRight: { alignItems: 'flex-end', gap: 4 },
  time: { fontFamily: fonts.sans, fontSize: 11, color: colors.cream[800] },
  unread: {
    width: 20,
    height: 20,
    borderRadius: radius.full,
    backgroundColor: colors.warm[500],
    alignItems: 'center',
    justifyContent: 'center',
  },
  unreadText: { fontFamily: fonts.sansSemi, fontSize: 11, color: colors.white },
});
