import { requireOptionalNativeModule } from 'expo-modules-core';
import { type ComponentType, useMemo } from 'react';
import {
  NativeModules,
  Platform,
  StyleSheet,
  Text,
  TurboModuleRegistry,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';

type WebViewProps = {
  source?: { html?: string; baseUrl?: string; uri?: string };
  onMessage?: (event: { nativeEvent: { data: string } }) => void;
  onLoadEnd?: () => void;
  onError?: (event: { nativeEvent: { description?: string } }) => void;
  style?: StyleProp<ViewStyle>;
  javaScriptEnabled?: boolean;
  domStorageEnabled?: boolean;
  originWhitelist?: string[];
  mixedContentMode?: string;
  scrollEnabled?: boolean;
  setSupportMultipleWindows?: boolean;
  allowsInlineMediaPlayback?: boolean;
  allowsFullscreenVideo?: boolean;
  mediaPlaybackRequiresUserAction?: boolean;
  sharedCookiesEnabled?: boolean;
  thirdPartyCookiesEnabled?: boolean;
  cacheEnabled?: boolean;
};

type WebViewKind = 'dom' | 'rnc' | null;

function hasRncWebViewNative(): boolean {
  const mods = NativeModules as Record<string, unknown>;
  if (mods.RNCWebView || mods.RNCWebViewModule) return true;
  try {
    // getEnforcing crash eder — yalnız get ile yokla
    const get = (
      TurboModuleRegistry as { get?: (name: string) => unknown }
    ).get;
    return Boolean(get?.('RNCWebViewModule'));
  } catch {
    return false;
  }
}

function hasExpoDomWebViewNative(): boolean {
  return Boolean(requireOptionalNativeModule('ExpoDomWebViewModule'));
}

function resolveKind(): WebViewKind {
  if (Platform.OS === 'web') return null;
  // Expo Go SDK 56: DomWebView var, RNCWebView çoğu binary’de yok
  if (hasExpoDomWebViewNative()) return 'dom';
  if (hasRncWebViewNative()) return 'rnc';
  return null;
}

export function isNativeWebViewAvailable() {
  return resolveKind() != null;
}

/**
 * Expo Go’da RNCWebViewModule yok — require('react-native-webview') crash eder.
 * Önce @expo/dom-webview (ExpoDomWebViewModule), yoksa RNC.
 */
export function SafeWebView(props: WebViewProps) {
  const kind = useMemo(() => resolveKind(), []);

  const WebView = useMemo(() => {
    if (kind === 'dom') {
      try {
        // eslint-disable-next-line @typescript-eslint/no-require-imports
        return require('@expo/dom-webview').WebView as ComponentType<WebViewProps>;
      } catch {
        return null;
      }
    }
    if (kind === 'rnc') {
      try {
        // eslint-disable-next-line @typescript-eslint/no-require-imports
        return require('react-native-webview').WebView as ComponentType<WebViewProps>;
      } catch {
        return null;
      }
    }
    return null;
  }, [kind]);

  if (!WebView) {
    return (
      <View style={[styles.fallback, props.style]}>
        <Text style={styles.fallbackText}>
          Bu özellik için development build gerekir (WebView yok).
        </Text>
      </View>
    );
  }

  // DomWebView yalnızca { uri } destekler — html kaynağını ele
  const source =
    kind === 'dom' && props.source?.html
      ? undefined
      : props.source?.uri
        ? { uri: props.source.uri }
        : props.source;

  if (kind === 'dom' && !source?.uri) {
    return (
      <View style={[styles.fallback, props.style]}>
        <Text style={styles.fallbackText}>WebView kaynağı eksik.</Text>
      </View>
    );
  }

  return <WebView {...props} source={source} />;
}

const styles = StyleSheet.create({
  fallback: {
    minHeight: 72,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
  },
  fallbackText: {
    fontSize: 12,
    textAlign: 'center',
    opacity: 0.65,
  },
});
