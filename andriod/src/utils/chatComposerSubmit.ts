import { Platform } from 'react-native';

export type ChatComposerKeyPressEvent = {
  key?: string;
  shiftKey?: boolean;
  nativeEvent?: { key?: string; shiftKey?: boolean };
  preventDefault: () => void;
};

/**
 * RN Web TextInput `onKeyDown`’ı kendi handler’ıyla ezer; Enter yalnız
 * `onKeyPress` üzerinden yakalanır. Shift+Enter yeni satır bırakır.
 */
export function handleChatComposerKeyPress(
  e: ChatComposerKeyPressEvent,
  send: () => void,
): void {
  const key = e.key || e.nativeEvent?.key;
  const shift = Boolean(e.shiftKey || e.nativeEvent?.shiftKey);
  if (key !== 'Enter' || shift) return;
  e.preventDefault();
  send();
}

/** Web: Enter gönderir. Native klavye Return satır bırakır. */
export function chatComposerWebKeyDownProps(send: () => void): Record<string, unknown> {
  if (Platform.OS !== 'web') return {};
  return {
    onKeyPress: (e: ChatComposerKeyPressEvent) => handleChatComposerKeyPress(e, send),
  };
}
