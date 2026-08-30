/** ProfileCompletionGate — IMPLEMENTATION-LOCK / 05-auth-onboarding */

const SOCIAL_PROVIDERS = ['google', 'facebook', 'apple'] as const;

type AuthIdentity = { provider?: string };
type AuthUserLike = {
  identities?: AuthIdentity[];
  app_metadata?: { provider?: string };
};

export function isSocialAuthUser(authUser: AuthUserLike | null | undefined): boolean {
  if (!authUser) return false;
  const identities = authUser.identities || [];
  const providers = identities.map((i) => i.provider);
  const hasEmailIdentity = providers.includes('email');
  const hasSocialIdentity = providers.some((p) =>
    SOCIAL_PROVIDERS.includes(p as (typeof SOCIAL_PROVIDERS)[number]),
  );

  if (hasSocialIdentity && !hasEmailIdentity) return true;

  const primary = authUser.app_metadata?.provider;
  if (primary && SOCIAL_PROVIDERS.includes(primary as (typeof SOCIAL_PROVIDERS)[number]) && !hasEmailIdentity) {
    return true;
  }

  return false;
}

export function hasRegisteredMember(member: Record<string, unknown> | null | undefined): boolean {
  if (!member) return false;
  const name = String(member.name || '').trim();
  const phone = String(member.phone || '').trim();
  const joinedAt = member.joinedAt || member.joined_at;
  const complete = member.profileComplete === true || member.profile_complete === true;
  return Boolean(name && phone && (joinedAt || complete));
}
