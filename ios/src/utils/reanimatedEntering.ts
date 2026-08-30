import { Platform } from 'react-native';

/**
 * Reanimated web only runs predefined entering/exiting (+ duration/delay/easing).
 * Custom worklets and `.springify()` warn, can leave opacity at 0, and trip RN-web
 * "Unexpected text node" LogBox toasts. Skip layout animations on web.
 */
export function enteringNative<T>(animation: T): T | undefined {
  return Platform.OS === 'web' ? undefined : animation;
}
