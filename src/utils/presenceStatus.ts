import { OFFLINE_MS } from '@/services/presence';

export function isUserOnline(lastSeenAt?: string | null) {
  if (!lastSeenAt) return false;
  return Date.now() - new Date(lastSeenAt).getTime() <= OFFLINE_MS;
}

export function presenceLabel(lastSeenAt?: string | null) {
  return isUserOnline(lastSeenAt) ? 'Çevrimiçi' : 'Çevrimdışı';
}
