import { useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';

import { VideoCallPanel } from '@/components/video/VideoCallPanel';
import { useApp } from '@/context/AppContext';
import { fetchAllMembers } from '@/services/db/members';
import { findStaffSession } from '@/services/videoCallSession';
import type { MemberProfile } from '@/types/session';

export default function StaffVideoCallScreen() {
  const { type, sessionId } = useLocalSearchParams<{ type: string; sessionId: string }>();
  const { user, staff } = useApp();
  const [members, setMembers] = useState<MemberProfile[]>([]);

  useEffect(() => {
    void fetchAllMembers().then(setMembers);
  }, []);

  const sessionType = type === 'dietitian' ? 'dietitian' : 'coach';
  const found = staff?.id
    ? findStaffSession(members, staff.id, staff.role, sessionType, sessionId || '')
    : null;

  if (!found) {
    return (
      <VideoCallPanel
        displayName={user.name || 'Uzman'}
        remoteLabel="Danışan"
        session={{
          id: sessionId || '',
          date: new Date().toISOString().slice(0, 10),
          status: 'scheduled',
        }}
        sessionType={sessionType}
        side="staff"
      />
    );
  }

  return (
    <VideoCallPanel
      displayName={user.name || 'Uzman'}
      remoteLabel={found.member.name || 'Danışan'}
      session={found.session}
      sessionType={found.sessionType as 'coach' | 'dietitian'}
      side="staff"
    />
  );
}
