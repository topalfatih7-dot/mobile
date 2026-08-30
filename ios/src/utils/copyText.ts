import { Share } from 'react-native';

/** IBAN / metin kopyala — native Clipboard yoksa paylaşım menüsü. */
export async function copyText(text: string): Promise<'copied' | 'shared' | 'failed'> {
  const value = String(text || '');
  if (!value) return 'failed';
  try {
    const Clipboard = require('react-native').Clipboard as
      | { setString?: (s: string) => void }
      | undefined;
    if (typeof Clipboard?.setString === 'function') {
      Clipboard.setString(value);
      return 'copied';
    }
  } catch {
    /* RN 0.76+ Clipboard core’dan çıktı */
  }
  try {
    await Share.share({ message: value });
    return 'shared';
  } catch {
    return 'failed';
  }
}
