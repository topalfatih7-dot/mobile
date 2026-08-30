/**
 * Live call mute — same idea as `activeChatThread`.
 * OS banner for `call-join` is skipped while this session is already joined.
 */
let activeJoinedCallSessionId: string | null = null;

export function setActiveJoinedCallSessionId(sessionId: string | null) {
  activeJoinedCallSessionId = sessionId ? String(sessionId) : null;
}

export function getActiveJoinedCallSessionId(): string | null {
  return activeJoinedCallSessionId;
}
