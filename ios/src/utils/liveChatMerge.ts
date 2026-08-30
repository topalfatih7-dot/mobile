/** Merge a realtime/server message into local list, replacing optimistic local-* rows. */
export function mergeLiveMessage<
  T extends { id: string; text?: string; senderId?: string | null },
>(prev: T[], incoming: T): T[] {
  if (prev.some((m) => m.id === incoming.id)) return prev;
  const idx = prev.findIndex(
    (m) =>
      String(m.id).startsWith('local-') &&
      String(m.text || '') === String(incoming.text || '') &&
      String(m.senderId || '') === String(incoming.senderId || ''),
  );
  if (idx >= 0) {
    const next = [...prev];
    next[idx] = incoming;
    return next;
  }
  return [...prev, incoming];
}
