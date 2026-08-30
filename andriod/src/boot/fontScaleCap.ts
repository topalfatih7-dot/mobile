import { createElement, forwardRef, type ComponentType } from 'react';
import {
  Platform,
  Text,
  TextInput,
  type TextInputProps,
  type TextProps,
} from 'react-native';

import { MAX_FONT_SIZE_MULTIPLIER } from '@/theme/scale';

/**
 * React 19 + RN 0.85: function Text/TextInput `defaultProps` yok sayar.
 * Telefon Ayarlar yazı boyutu (Dynamic Type / fontScale) uygulamayı değiştirmez.
 * RN web: Text/TextInput getter-only — atama TypeError; web’de kilidi atla.
 */
const LOCK = {
  allowFontScaling: false,
  maxFontSizeMultiplier: MAX_FONT_SIZE_MULTIPLIER,
} as const;

function lockComponent<P extends object>(Original: ComponentType<P>, displayName: string) {
  const Locked = forwardRef<unknown, P>((props, ref) =>
    createElement(Original, { ...props, ...LOCK, ref } as P),
  );
  Locked.displayName = displayName;
  return Locked;
}

const RN = require('react-native') as typeof import('react-native') & {
  Text: typeof Text;
  TextInput: typeof TextInput;
};

function patchNamedExport(name: 'Text' | 'TextInput', value: unknown) {
  if (Platform.OS === 'web') return;
  try {
    (RN as unknown as Record<string, unknown>)[name] = value;
  } catch {
    try {
      Object.defineProperty(RN, name, {
        configurable: true,
        enumerable: true,
        writable: true,
        value,
      });
    } catch {
      /* getter-only native export */
    }
  }
}

patchNamedExport('Text', lockComponent<TextProps>(Text, 'Text'));
patchNamedExport('TextInput', lockComponent<TextInputProps>(TextInput, 'TextInput'));
