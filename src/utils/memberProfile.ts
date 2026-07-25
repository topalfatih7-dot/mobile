/** ProfileCompletionGate — IMPLEMENTATION-LOCK / 05-auth-onboarding */
export function hasRegisteredMember(member: Record<string, unknown> | null | undefined): boolean {
  if (!member) return false;
  const name = String(member.name || '').trim();
  const phone = String(member.phone || '').trim();
  const joinedAt = member.joinedAt || member.joined_at;
  const complete = member.profileComplete === true || member.profile_complete === true;
  return Boolean(name && phone && (joinedAt || complete));
}
