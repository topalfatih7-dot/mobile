import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';

import { Avatar } from '@/components/ui/Avatar';
import { Card } from '@/components/ui/Card';
import { getPlanLabel } from '@/data/membershipPlans';
import { colors, fonts, gradients, spacing } from '@/constants/theme';
import type { MemberProfile } from '@/types/session';

type StaffClientCardProps = {
  client: MemberProfile;
  onPress?: () => void;
};

export function StaffClientCard({ client, onPress }: StaffClientCardProps) {
  const plan = getPlanLabel((client.membership as string) || 'free');
  const goal = (client.goal as string) || '—';

  return (
    <Card contentStyle={styles.row} onPress={onPress} padding={spacing.md} style={styles.card}>
      <Avatar gradient={gradients.brand} name={client.name} size={52} />
      <View style={styles.body}>
        <Text numberOfLines={1} style={styles.name}>
          {client.name}
        </Text>
        <Text style={styles.plan}>{plan}</Text>
        <Text numberOfLines={1} style={styles.meta}>
          Hedef: {goal}
        </Text>
      </View>
      <Ionicons color={colors.ink[300]} name="chevron-forward" size={20} />
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    marginBottom: spacing.md,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  body: {
    flex: 1,
    marginHorizontal: spacing.md,
  },
  name: {
    fontFamily: fonts.display,
    fontSize: 16,
    color: colors.text.primary,
  },
  plan: {
    fontFamily: fonts.semibold,
    fontSize: 11.5,
    color: colors.brand[600],
    marginTop: 2,
  },
  meta: {
    fontFamily: fonts.regular,
    fontSize: 13,
    color: colors.text.secondary,
    marginTop: 3,
  },
});
