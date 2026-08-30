import { Text, type TextProps } from 'react-native';

import { MAX_FONT_SIZE_MULTIPLIER } from '@/theme/scale';

/** Sistem yazı ölçeği kapalı — tasarım punto sabit. */
export function AppText({
  allowFontScaling = false,
  maxFontSizeMultiplier = MAX_FONT_SIZE_MULTIPLIER,
  ...rest
}: TextProps) {
  return (
    <Text
      {...rest}
      allowFontScaling={allowFontScaling}
      maxFontSizeMultiplier={maxFontSizeMultiplier}
    />
  );
}
