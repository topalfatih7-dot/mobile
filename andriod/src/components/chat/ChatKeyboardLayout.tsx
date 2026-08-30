import type { ReactNode } from 'react';
import { Platform, StyleSheet, View } from 'react-native';
import { useKeyboardState } from 'react-native-keyboard-controller';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { KeyboardDock } from '@/components/ui/KeyboardDock';
import { colors } from '@/theme';

/**
 * Inverted chat list + composer: keyboard opens → dock pads by keyboard
 * height so the list shrinks and the latest bubble stays above the input.
 */
export function ChatKeyboardLayout({
  list,
  composer,
}: {
  list: ReactNode;
  composer: ReactNode;
}) {
  const insets = useSafeAreaInsets();
  const keyboardVisible = useKeyboardState((state) => state.isVisible);
  // Android’de gesture bar altındaki içerik zaten navigation bar kadar
  // içeride; insets.bottom 0 gelebildiği için composer ekran kenarına yapışmasın.
  const restingBottom = insets.bottom + (Platform.OS === 'android' ? 10 : 0);

  return (
    <KeyboardDock>
      <View style={styles.fill}>{list}</View>
      <View
        style={[
          styles.composerDock,
          { paddingBottom: keyboardVisible ? 8 : restingBottom },
        ]}>
        {composer}
      </View>
    </KeyboardDock>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1, minHeight: 0 },
  composerDock: {
    backgroundColor: colors.white,
  },
});
