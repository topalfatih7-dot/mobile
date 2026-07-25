import { useLocalSearchParams } from 'expo-router';

import { VideoCallShell } from '@/components/call/VideoCallShell';

/** LOCK: docs/mobile/screens/staff/video-call.md */
export default function StaffVideoCall() {
  const { sessionType, sessionId } = useLocalSearchParams<{
    sessionType: string;
    sessionId: string;
  }>();
  return (
    <VideoCallShell
      backHref="/(staff)"
      isOwner
      sessionId={String(sessionId || '')}
      sessionType={String(sessionType || 'coach')}
    />
  );
}
