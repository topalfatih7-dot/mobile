import { useLocalSearchParams } from 'expo-router';

import { VideoCallPanel } from '@/components/video/VideoCallPanel';
import { useApp } from '@/context/AppContext';
import { findMemberSession } from '@/services/videoCallSession';

export default function MemberVideoCallScreen() {
  const { type, sessionId } = useLocalSearchParams<{ type: string; sessionId: string }>();
  const { user, member } = useApp();

  const sessionType = type === 'dietitian' ? 'dietitian' : 'coach';
  const found = findMemberSession(member, sessionType, sessionId || '');

  if (!found) {
    return (
      <VideoCallPanel
        displayName={user.name || 'Üye'}
        remoteLabel="Uzman"
        session={{
          id: sessionId || '',
          date: new Date().toISOString().slice(0, 10),
          status: 'scheduled',
        }}
        sessionType={sessionType}
        side="member"
      />
    );
  }

  return (
    <VideoCallPanel
      displayName={user.name || 'Üye'}
      remoteLabel={found.session.coachName || found.session.coach || 'Uzmanınız'}
      session={found.session}
      sessionType={found.sessionType}
      side="member"
    />
  );
}
