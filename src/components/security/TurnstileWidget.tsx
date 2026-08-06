import { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Platform, StyleSheet, Text, View } from 'react-native';

import { SafeWebView, isNativeWebViewAvailable } from '@/components/ui/SafeWebView';
import { env } from '@/config/env';
import { isTurnstileEnabled, turnstileSiteKey } from '@/config/turnstile';
import { colors, fonts, radius } from '@/theme';

type Props = {
  onToken: (token: string) => void;
  /** Fail sonrası remount için artır */
  remountKey?: number;
};

type TurnstileApi = {
  render: (el: HTMLElement, opts: Record<string, unknown>) => string | number;
  remove: (id: string | number) => void;
};

/**
 * LOCK: B-component-map → TurnstileWidget
 * Uygulama içi WebView — harici site / sistem tarayıcısı yok.
 */
export function TurnstileWidget({ onToken, remountKey = 0 }: Props) {
  const onTokenRef = useRef(onToken);
  const webHostRef = useRef<View>(null);
  const [ready, setReady] = useState(false);
  const [verified, setVerified] = useState(false);
  const [loadError, setLoadError] = useState('');

  useEffect(() => {
    onTokenRef.current = onToken;
  }, [onToken]);

  useEffect(() => {
    onTokenRef.current('');
    setVerified(false);
    setReady(false);
    setLoadError('');
  }, [remountKey]);

  const siteKey = turnstileSiteKey();
  const baseUrl = (env.apiBaseUrl || 'https://www.yeniform.com').replace(/\/$/, '');
  const nativeOk = isNativeWebViewAvailable();

  // v= cache-bust — eski scale/clip HTML’i WebView’de kalmasın
  const embedUri =
    `${baseUrl}/mobile-turnstile.html` +
    `?sitekey=${encodeURIComponent(siteKey)}` +
    `&mode=embed&v=4`;

  const onMessage = useCallback((event: { nativeEvent: { data: string } }) => {
    try {
      const data = JSON.parse(String(event.nativeEvent.data || '')) as {
        type?: string;
        token?: string;
      };
      if (data.type === 'token') {
        const token = data.token || '';
        onTokenRef.current(token);
        setVerified(Boolean(token));
      }
      if (data.type === 'ready') setReady(true);
      if (data.type === 'error') {
        setLoadError(data.token || 'Doğrulama yüklenemedi.');
        onTokenRef.current('');
        setVerified(false);
      }
    } catch {
      const raw = String(event.nativeEvent.data || '');
      if (raw) {
        onTokenRef.current(raw);
        setVerified(true);
      }
    }
  }, []);

  useEffect(() => {
    if (Platform.OS !== 'web' || !siteKey) return undefined;

    const node = webHostRef.current as unknown as HTMLElement | null;
    if (!node) return undefined;

    let host = node.querySelector('#cf-host') as HTMLElement | null;
    if (!host) {
      host = document.createElement('div');
      host.id = 'cf-host';
      node.innerHTML = '';
      node.appendChild(host);
    }

    let widgetId: string | number | null = null;
    const render = () => {
      const w = (window as unknown as { turnstile?: TurnstileApi }).turnstile;
      if (!w || !host) return;
      if (widgetId != null) {
        try {
          w.remove(widgetId);
        } catch {
          /* ignore */
        }
      }
      host.innerHTML = '';
      widgetId = w.render(host, {
        sitekey: siteKey,
        theme: 'light',
        size: 'normal',
        callback: (token: string) => {
          onTokenRef.current(token || '');
          setVerified(Boolean(token));
        },
        'expired-callback': () => {
          onTokenRef.current('');
          setVerified(false);
        },
        'error-callback': () => {
          onTokenRef.current('');
          setVerified(false);
        },
      });
      setReady(true);
    };

    const existing = document.querySelector('script[data-yf-turnstile]');
    const api = (window as unknown as { turnstile?: TurnstileApi }).turnstile;
    if (api) {
      render();
    } else if (!existing) {
      const script = document.createElement('script');
      script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';
      script.async = true;
      script.dataset.yfTurnstile = '1';
      script.onload = () => render();
      document.head.appendChild(script);
    } else {
      existing.addEventListener('load', render);
    }

    return () => {
      const w = (window as unknown as { turnstile?: TurnstileApi }).turnstile;
      if (widgetId != null && w) {
        try {
          w.remove(widgetId);
        } catch {
          /* ignore */
        }
      }
    };
  }, [remountKey, siteKey]);

  if (!isTurnstileEnabled() || !siteKey) return null;

  if (Platform.OS === 'web') {
    return <View ref={webHostRef} style={styles.webMount} />;
  }

  if (!nativeOk) {
    return (
      <View style={styles.fallback}>
        <Text style={styles.fallbackTitle}>Bot doğrulaması yüklenemedi</Text>
        <Text style={styles.fallbackBody}>
          Bu cihazda gömülü WebView yok. Development build ile tekrar deneyin.
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.wrap}>
      <View style={styles.frame}>
        {!ready && !loadError ? (
          <View style={[styles.loading, { pointerEvents: 'none' }]}>
            <ActivityIndicator color={colors.brand[600]} />
            <Text style={styles.loadingText}>Doğrulama hazırlanıyor…</Text>
          </View>
        ) : null}
        {loadError ? <Text style={styles.errorText}>{loadError}</Text> : null}
        <SafeWebView
          key={`${remountKey}-${embedUri}`}
          allowsInlineMediaPlayback
          cacheEnabled={false}
          domStorageEnabled
          javaScriptEnabled
          mixedContentMode="always"
          onError={() => setLoadError('Doğrulama sayfası açılamadı.')}
          onLoadEnd={() => setReady(true)}
          onMessage={onMessage}
          originWhitelist={['http://*', 'https://*']}
          scrollEnabled={false}
          setSupportMultipleWindows={false}
          sharedCookiesEnabled
          source={{ uri: embedUri }}
          style={styles.webview}
          thirdPartyCookiesEnabled
        />
      </View>
      {verified ? <Text style={styles.okText}>Doğrulama tamam — Giriş Yap’a basın.</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    width: '100%',
    gap: 8,
  },
  frame: {
    width: '100%',
    height: 156,
    borderRadius: radius.md,
    overflow: 'hidden',
    backgroundColor: colors.cream[100],
    borderWidth: 1,
    borderColor: colors.cream[200],
  },
  webview: {
    width: '100%',
    height: 156,
    backgroundColor: colors.cream[100],
  },
  webMount: {
    minHeight: 72,
    width: '100%',
    alignItems: 'center',
  },
  loading: {
    ...StyleSheet.absoluteFill,
    zIndex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: 'rgba(243,246,248,0.92)',
  },
  loadingText: {
    fontFamily: fonts.sans,
    fontSize: 12,
    color: colors.cream[800],
  },
  okText: {
    fontFamily: fonts.sans,
    fontSize: 12,
    color: colors.sage[700],
    textAlign: 'center',
  },
  errorText: {
    fontFamily: fonts.sans,
    fontSize: 12,
    color: colors.danger[600],
    paddingHorizontal: 10,
    paddingVertical: 8,
    textAlign: 'center',
  },
  fallback: {
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.warm[200],
    backgroundColor: colors.warm[50],
    padding: 12,
    gap: 6,
  },
  fallbackTitle: {
    fontFamily: fonts.sansSemi,
    fontSize: 13,
    color: colors.cream[900],
  },
  fallbackBody: {
    fontFamily: fonts.sans,
    fontSize: 12,
    lineHeight: 17,
    color: colors.cream[800],
  },
});
