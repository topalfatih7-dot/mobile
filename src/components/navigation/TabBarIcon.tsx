import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { StyleSheet, View } from 'react-native';

import { colors, gradients, glow, type Gradient } from '@/constants/theme';
import type { IoniconName } from '@/types';

type TabBarIconProps = {
  name: IoniconName;
  focused: boolean;
  gradient?: Gradient;
};

/** Aktifken gradient "app-icon" kutusu, pasifken sade çizgi ikon. */
export function TabBarIcon({ name, focused, gradient = gradients.brand }: TabBarIconProps) {
  if (focused) {
    return (
      <LinearGradient
        colors={gradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.box, glow(gradient[0], 0.34)]}>
        <Ionicons color={colors.white} name={name} size={21} />
      </LinearGradient>
    );
  }

  return (
    <View style={styles.box}>
      <Ionicons color={colors.ink[400]} name={name} size={23} />
    </View>
  );
}

const styles = StyleSheet.create({
  box: {
    width: 40,
    height: 40,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
