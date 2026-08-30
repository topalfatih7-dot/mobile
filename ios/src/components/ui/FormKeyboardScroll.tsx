import { useEffect, useRef, type Ref } from 'react';
import {
  KeyboardAwareScrollView,
  KeyboardEvents,
  type KeyboardAwareScrollViewProps,
  type KeyboardAwareScrollViewRef,
} from 'react-native-keyboard-controller';

type Props = KeyboardAwareScrollViewProps & {
  ref?: Ref<KeyboardAwareScrollViewRef>;
};

let revealFocusedFormInputImpl: (() => void) | null = null;

/** Odaklı TextInput’u klavyenin üstüne kaydır (klavye bittikten / frame değiştikten sonra). */
export function revealFocusedFormInput() {
  revealFocusedFormInputImpl?.();
}

function assignRef<T>(ref: Ref<T> | undefined, value: T | null) {
  if (!ref) return;
  if (typeof ref === 'function') ref(value);
  else ref.current = value;
}

/**
 * Form scroll — iOS overlay + Android adjustResize.
 * Odaklı TextInput klavyenin üstüne kayar. RN KeyboardAvoidingView ile sarmalama.
 * Kaydırınca klavye kapanır (sayısal pad’de Return olmadığı için).
 */
export function FormKeyboardScroll({
  ref,
  bottomOffset = 72,
  extraKeyboardSpace = 80,
  keyboardDismissMode = 'on-drag',
  keyboardShouldPersistTaps = 'handled',
  showsVerticalScrollIndicator = false,
  style,
  onScrollBeginDrag,
  ...rest
}: Props) {
  const scrollRef = useRef<KeyboardAwareScrollViewRef>(null);

  useEffect(() => {
    const reveal = () => {
      scrollRef.current?.assureFocusedInputVisible();
    };
    revealFocusedFormInputImpl = reveal;

    const didShow = KeyboardEvents.addListener('keyboardDidShow', () => {
      reveal();
      requestAnimationFrame(reveal);
    });
    const willShow = KeyboardEvents.addListener('keyboardWillShow', () => {
      setTimeout(reveal, 280);
    });

    return () => {
      if (revealFocusedFormInputImpl === reveal) revealFocusedFormInputImpl = null;
      didShow.remove();
      willShow.remove();
    };
  }, []);

  return (
    <KeyboardAwareScrollView
      ref={(node) => {
        scrollRef.current = node;
        assignRef(ref, node);
      }}
      automaticallyAdjustContentInsets={false}
      automaticallyAdjustKeyboardInsets={false}
      bottomOffset={bottomOffset}
      contentInsetAdjustmentBehavior="never"
      extraKeyboardSpace={extraKeyboardSpace}
      keyboardDismissMode={keyboardDismissMode}
      keyboardShouldPersistTaps={keyboardShouldPersistTaps}
      onScrollBeginDrag={onScrollBeginDrag}
      showsVerticalScrollIndicator={showsVerticalScrollIndicator}
      style={[{ flex: 1, minHeight: 0 }, style]}
      {...rest}
    />
  );
}
