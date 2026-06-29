import { router, type Href } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

import { IconTile } from '@/components/ui/IconTile';
import { PressableScale } from '@/components/ui/PressableScale';
import { QUICK_ACTIONS } from '@/data/dashboard';
import { colors, fonts, spacing } from '@/constants/theme';

const ACTION_ROUTES: Record<string, Href> = {
  meal: '/programs',
  workout: '/programs',
  water: '/profile/measurements',
  measure: '/profile/measurements',
};

export function QuickActions() {
  return (
    <View style={styles.row}>
      {QUICK_ACTIONS.map((action) => (
        <PressableScale
          key={action.id}
          onPress={() => {
            const route = ACTION_ROUTES[action.id];
            if (route) router.push(route);
          }}
          style={styles.item}>
          <IconTile gradient={action.gradient} icon={action.icon} size={58} />
          <Text style={styles.label}>{action.label}</Text>
        </PressableScale>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  item: {
    flex: 1,
    alignItems: 'center',
    gap: spacing.sm,
  },
  label: {
    fontFamily: fonts.medium,
    fontSize: 12,
    color: colors.text.secondary,
  },
});
