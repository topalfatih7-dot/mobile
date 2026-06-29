import { Ionicons } from '@expo/vector-icons';
import { router, type Href } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Avatar } from '@/components/ui/Avatar';
import { Button } from '@/components/ui/Button';
import { getPlanLabel } from '@/data/membershipPlans';
import { colors, fonts, gradients, radius, spacing } from '@/constants/theme';

type ProfileHeaderProps = {
  name: string;
  email?: string;
  plan: string;
  goal: string;
  onEditPress?: () => void;
};

export function ProfileHeader({ name, email, plan, goal, onEditPress }: ProfileHeaderProps) {
  const insets = useSafeAreaInsets();
  const planLabel = getPlanLabel(plan);

  return (
    <LinearGradient
      colors={gradients.teal}
      end={{ x: 1, y: 1 }}
      start={{ x: 0, y: 0 }}
      style={[styles.wrap, { paddingTop: insets.top + spacing.xl }]}>
      <View style={styles.decorA} />
      <View style={styles.decorB} />

      <Avatar gradient={gradients.brand} name={name} ring size={88} />
      <Text style={styles.name}>{name}</Text>
      {email ? <Text style={styles.email}>{email}</Text> : null}

      <View style={styles.planPill}>
        <Ionicons color={colors.white} name="star" size={13} />
        <Text style={styles.planText}>{planLabel}</Text>
      </View>

      <Text style={styles.goal}>Hedef: {goal}</Text>

      <Button
        fullWidth={false}
        label="Profili Düzenle"
        leftIcon="create-outline"
        onPress={onEditPress || (() => router.push('/profile/edit' as Href))}
        size="sm"
        style={styles.edit}
        variant="glass"
      />
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xxl + spacing.lg,
    borderBottomLeftRadius: radius.xxl,
    borderBottomRightRadius: radius.xxl,
    overflow: 'hidden',
  },
  decorA: {
    position: 'absolute',
    width: 190,
    height: 190,
    borderRadius: 95,
    backgroundColor: 'rgba(255,255,255,0.10)',
    top: -60,
    left: -50,
  },
  decorB: {
    position: 'absolute',
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: 'rgba(255,255,255,0.08)',
    top: 40,
    right: -50,
  },
  name: {
    fontFamily: fonts.displayExtra,
    fontSize: 23,
    color: colors.white,
    marginTop: spacing.md,
  },
  email: {
    fontFamily: fonts.regular,
    fontSize: 13,
    color: 'rgba(255,255,255,0.82)',
    marginTop: 4,
  },
  planPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: radius.full,
    backgroundColor: 'rgba(255,255,255,0.2)',
    marginTop: spacing.sm,
  },
  planText: {
    fontFamily: fonts.semibold,
    fontSize: 12.5,
    color: colors.white,
  },
  goal: {
    fontFamily: fonts.medium,
    fontSize: 13,
    color: 'rgba(255,255,255,0.85)',
    marginTop: spacing.sm,
  },
  edit: {
    marginTop: spacing.lg,
  },
});
