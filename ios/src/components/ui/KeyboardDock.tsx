import { useEffect, useState, type ReactNode } from 'react';
import {
  Dimensions,
  Keyboard,
  Platform,
  StyleSheet,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { KeyboardEvents } from 'react-native-keyboard-controller';

type Props = {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
};

function visibleKeyboardHeight(endY: number, reportedHeight: number) {
  // Hide frame reports height 0; leftover frames can be a few px (safe area
  // vs window). Real iPhone keyboards are hundreds of px.
  if (reportedHeight < 40) return 0;
  const winH = Dimensions.get('window').height;
  const fromFrame = Math.max(0, winH - endY);
  if (fromFrame <= 0) return 0;
  return Math.round(Math.min(fromFrame, reportedHeight));
}

/**
 * iOS overlay klavye: alt padding = görünen klavye yüksekliği (Yoga layout).
 * Reanimated padding Fabric’te layout’u güncellemediği için RN Keyboard +
 * KeyboardEvents ile normal View padding kullanılıyor.
 */
export function KeyboardDock({ children, style }: Props) {
  const [keyboardHeight, setKeyboardHeight] = useState(0);

  useEffect(() => {
    const apply = (next: number) => setKeyboardHeight(Math.max(0, Math.round(next)));

    const showRn = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow',
      (e) => apply(e.endCoordinates.height),
    );
    const hideRn = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide',
      () => apply(0),
    );
    const didHideRn = Keyboard.addListener('keyboardDidHide', () => apply(0));
    const frameRn =
      Platform.OS === 'ios'
        ? Keyboard.addListener('keyboardWillChangeFrame', (e) => {
            apply(visibleKeyboardHeight(e.endCoordinates.screenY, e.endCoordinates.height));
          })
        : null;
    const didFrameRn =
      Platform.OS === 'ios'
        ? Keyboard.addListener('keyboardDidChangeFrame', (e) => {
            apply(visibleKeyboardHeight(e.endCoordinates.screenY, e.endCoordinates.height));
          })
        : null;

    const showKc = KeyboardEvents.addListener('keyboardWillShow', (e) => apply(e.height));
    const hideKc = KeyboardEvents.addListener('keyboardDidHide', () => apply(0));

    return () => {
      showRn.remove();
      hideRn.remove();
      didHideRn.remove();
      frameRn?.remove();
      didFrameRn?.remove();
      showKc.remove();
      hideKc.remove();
    };
  }, []);

  return (
    <View style={[styles.fill, style, keyboardHeight > 0 ? { paddingBottom: keyboardHeight } : null]}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1, minHeight: 0 },
});
