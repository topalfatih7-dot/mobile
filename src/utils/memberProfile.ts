/**
 * Web `src/utils/memberProfile.js` ile birebir aynı kurallar
 * (docs/rn-migration/05 ProfileCompletionGate, 07 auth).
 */
import type { AuthUser, MemberProfile } from '@/types/session';

const SOCIAL_PROVIDERS = ['google', 'apple', 'facebook'];

/** Tamamlanmış üye kaydı (profil + paket onboarding'i bitti). */
export function hasRegisteredMember(member: MemberProfile | { id?: string; name?: string; phone?: string; joinedAt?: string; profileComplete?: boolean } | null | undefined) {
  if (!member?.id) return false;
  if (member.profileComplete === true) return true;
  if (member.phone?.trim() && member.name?.trim() && member.joinedAt) return true;
  return false;
}

/** Supabase oturumunun yalnızca sosyal sağlayıcı ile açılıp açılmadığını döner. */
export function isSocialAuthUser(authUser: AuthUser | null | undefined) {
  if (!authUser) return false;
  const identities = authUser.identities || [];
  const providers = identities.map((i) => i.provider);
  const hasEmailIdentity = providers.includes('email');
  const hasSocialIdentity = providers.some((p) => SOCIAL_PROVIDERS.includes(p));

  if (hasSocialIdentity && !hasEmailIdentity) return true;

  const primary = authUser.app_metadata?.provider;
  if (primary && SOCIAL_PROVIDERS.includes(primary) && !hasEmailIdentity) return true;

  return false;
}

/**
 * OAuth ile giriş yapan ve profili eksik üyeler için true döner.
 * E-posta/şifre ile tam kayıt olmuş üyeler asla bu kontrole takılmaz.
 */
export function memberNeedsProfileCompletion(
  member: MemberProfile | null | undefined,
  authUser: AuthUser | null = null,
) {
  if (hasRegisteredMember(member)) return false;
  if (!member?.id) {
    return Boolean(authUser && isSocialAuthUser(authUser));
  }

  if (authUser && !isSocialAuthUser(authUser)) return false;

  if (member.phone?.trim() && member.name?.trim()) return false;

  if (!isSocialAuthUser(authUser)) return false;

  if (!member.phone?.trim()) return true;
  if (!member.name?.trim()) return true;
  if (!member.joinedAt) return true;
  return false;
}

export function displayNameFromAuthUser(user: AuthUser | null | undefined) {
  if (!user) return '';
  if (user.name?.trim()) return user.name.trim();
  return '';
}
