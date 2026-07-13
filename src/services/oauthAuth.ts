/**
 * Google OAuth — web `oauthAuth.js` sözleşmesi + native deep link (docs/rn-migration/07 §6).
 *
 * Kritik: redirectTo, Supabase Auth → Redirect URLs allow-list’te olmalı.
 * Değilse Supabase Site URL’e (`https://www.yeniform.com`) düşer → tarayıcıda web açılır.
 */
import { makeRedirectUri } from 'expo-auth-session';
import * as QueryParams from 'expo-auth-session/build/QueryParams';
import * as WebBrowser from 'expo-web-browser';
import { Platform } from 'react-native';

import { env } from '@/config/env';
import { setRememberMe } from '@/services/authStorage';
import { establishAuthSessionFromUrl } from '@/services/authSessionFromUrl';
import { supabase, syncAutoRefresh } from '@/services/supabaseClient';

WebBrowser.maybeCompleteAuthSession();

const PROVIDERS = ['google'] as const;
export type SocialProvider = (typeof PROVIDERS)[number];

const PROVIDER_LABELS: Record<SocialProvider, string> = {
  google: 'Google',
};

const SITE_HOST = 'yeniform.com';

export function getSupabaseAuthProvidersUrl() {
  const match = env.supabaseUrl.match(/https:\/\/([^.]+)\.supabase\.co/);
  if (match?.[1]) {
    return `https://supabase.com/dashboard/project/${match[1]}/auth/providers`;
  }
  return 'https://supabase.com/dashboard';
}

export function getSupabaseRedirectUrlsDashboard() {
  const match = env.supabaseUrl.match(/https:\/\/([^.]+)\.supabase\.co/);
  if (match?.[1]) {
    return `https://supabase.com/dashboard/project/${match[1]}/auth/url-configuration`;
  }
  return 'https://supabase.com/dashboard';
}

/**
 * Platforma göre mobil/web callback.
 * - Native build: yeniform://auth/callback
 * - Expo Go: exp://IP:8081/--/auth/callback
 * - Web (Expo): http://localhost:8081/auth/callback  (yeniform.com DEĞİL)
 */
export function getOAuthRedirectTo(extraQuery?: Record<string, string>) {
  const base = makeRedirectUri({
    scheme: 'yeniform',
    path: 'auth/callback',
  });
  if (!extraQuery || !Object.keys(extraQuery).length) return base;
  const qs = new URLSearchParams(extraQuery).toString();
  return `${base}${base.includes('?') ? '&' : '?'}${qs}`;
}

function isProviderNotEnabledError(err: { message?: string; msg?: string } | null | undefined) {
  const msg = `${err?.message || ''} ${(err as { msg?: string })?.msg || ''}`.toLowerCase();
  return /provider is not enabled|unsupported provider|validation_failed/.test(msg);
}

export function providerNotEnabledMessage(provider: SocialProvider) {
  const label = PROVIDER_LABELS[provider] || provider;
  return (
    `${label} girişi Supabase projenizde henüz açılmamış. ` +
    'Supabase Dashboard → Authentication → Sign In / Providers bölümünden ilgili sağlayıcıyı etkinleştirip Client ID ve Secret girmeniz gerekir. ' +
    'Kurulum tamamlanana kadar e-posta ile giriş yapabilirsiniz.'
  );
}

const REDIRECT_NOT_ALLOWED_MESSAGE =
  'Google girişi web sitesine yönlendiriyor çünkü mobil callback URL’si Supabase Redirect URLs listesinde yok. ' +
  'Dashboard → Authentication → URL Configuration → Redirect URLs’e şunları ekleyin: ' +
  'yeniform://**  ve  exp://**  (Expo Go). Sonra uygulamayı yeniden deneyin.';

function extractRedirectToFromAuthorizeUrl(authorizeUrl: string): string | null {
  try {
    const u = new URL(authorizeUrl);
    return u.searchParams.get('redirect_to');
  } catch {
    return null;
  }
}

function looksLikeWebsiteRedirect(url: string | null | undefined) {
  if (!url) return false;
  try {
    const host = new URL(url).hostname.replace(/^www\./, '');
    return host === SITE_HOST || host.endsWith(`.${SITE_HOST}`);
  } catch {
    return /yeniform\.com/i.test(url) && !/^yeniform:/i.test(url);
  }
}

async function createSessionFromUrl(url: string) {
  // Implicit hash tokens (bazı native redirect’ler)
  const { params, errorCode } = QueryParams.getQueryParams(url);
  if (errorCode) {
    return { session: null, error: String(errorCode) };
  }
  if (params.access_token && params.refresh_token) {
    const { data, error } = await supabase!.auth.setSession({
      access_token: params.access_token,
      refresh_token: params.refresh_token,
    });
    if (error) return { session: null, error: error.message };
    return { session: data.session, error: null };
  }

  const session = await establishAuthSessionFromUrl(supabase, url);
  return { session, error: session ? null : 'Oturum kurulamadı. Lütfen tekrar deneyin.' };
}

export type SignInWithSocialOpts = {
  flow?: 'login' | 'signup';
  plan?: string;
  remember?: boolean;
};

/**
 * Google OAuth başlatır; başarıda session kurulur.
 */
export async function signInWithSocial(provider: SocialProvider, opts: SignInWithSocialOpts = {}) {
  if (!supabase) return { success: false as const, error: 'Supabase yapılandırılmamış.' };
  if (!PROVIDERS.includes(provider)) {
    return { success: false as const, error: 'Geçersiz giriş sağlayıcısı.' };
  }

  const remember = opts.remember !== false;
  await setRememberMe(remember);
  syncAutoRefresh(remember);

  const flow = opts.flow === 'signup' ? 'signup' : 'login';
  const extra: Record<string, string> = { flow };
  if (opts.plan) extra.plan = opts.plan;

  const redirectTo = getOAuthRedirectTo(extra);

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider,
    options: {
      redirectTo,
      skipBrowserRedirect: true,
      ...(provider === 'google'
        ? { queryParams: { access_type: 'offline', prompt: 'select_account' } }
        : {}),
    },
  });

  if (error) {
    if (isProviderNotEnabledError(error)) {
      return {
        success: false as const,
        providerNotConfigured: true as const,
        error: providerNotEnabledMessage(provider),
      };
    }
    return { success: false as const, error: error.message };
  }

  if (!data?.url) {
    return { success: false as const, error: 'Giriş sayfasına yönlendirilemedi.' };
  }

  // Allow-list kaçırılırsa Supabase Site URL’e düşer → web sitesi
  const effectiveRedirect = extractRedirectToFromAuthorizeUrl(data.url);
  if (
    Platform.OS !== 'web' &&
    looksLikeWebsiteRedirect(effectiveRedirect) &&
    !looksLikeWebsiteRedirect(redirectTo)
  ) {
    return {
      success: false as const,
      redirectMisconfigured: true as const,
      error: REDIRECT_NOT_ALLOWED_MESSAGE,
      expectedRedirect: redirectTo,
      effectiveRedirect: effectiveRedirect || undefined,
    };
  }

  // Web’de AuthSession yerine aynı origin callback kullan (Site URL’e kaçmayı önle)
  if (Platform.OS === 'web') {
    if (typeof window !== 'undefined') {
      window.location.assign(data.url);
      return { success: true as const, redirecting: true as const };
    }
  }

  const result = await WebBrowser.openAuthSessionAsync(data.url, redirectTo);

  if (result.type !== 'success' || !('url' in result) || !result.url) {
    if (result.type === 'cancel' || result.type === 'dismiss') {
      return { success: false as const, error: 'Giriş iptal edildi.', cancelled: true as const };
    }
    return { success: false as const, error: 'Giriş tamamlanamadı.' };
  }

  if (looksLikeWebsiteRedirect(result.url)) {
    return {
      success: false as const,
      redirectMisconfigured: true as const,
      error: REDIRECT_NOT_ALLOWED_MESSAGE,
      expectedRedirect: redirectTo,
      effectiveRedirect: result.url,
    };
  }

  const { session, error: sessionError } = await createSessionFromUrl(result.url);
  if (!session?.user) {
    return { success: false as const, error: sessionError || 'Oturum kurulamadı. Lütfen tekrar deneyin.' };
  }

  return { success: true as const, session };
}
