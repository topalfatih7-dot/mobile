import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
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

  return (
    <KeyboardDock>
      <View style={styles.fill}>{list}</View>
      <View
        style={[
          styles.composerDock,
          { paddingBottom: keyboardVisible ? 8 : insets.bottom },
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
