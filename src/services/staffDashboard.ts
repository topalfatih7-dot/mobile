import type { Conversation } from '@/data/messages';
import { getPlanLabel } from '@/data/membershipPlans';
import { gradients } from '@/constants/theme';
import type { DbChatThread } from '@/services/db/chat';
import type { DbProgram } from '@/services/db/programs';
import { formatChatTime } from '@/services/memberDashboard';
import type { MemberProfile } from '@/types/session';
import { getStaffAppointments, countWeekAppointments } from '@/utils/staffAccess';

export type StaffInboxItem = Conversation & {
  memberId: string;
};

export function mapStaffThreadsToInbox(
  threads: DbChatThread[],
  clients: MemberProfile[],
): StaffInboxItem[] {
  const clientMap = new Map(clients.map((client) => [client.id, client]));

  return threads
    .map((thread) => {
      const member = clientMap.get(thread.memberId);
      return {
        id: thread.id,
        memberId: thread.memberId,
        name: thread.memberName || member?.name || 'Üye',
        role: getPlanLabel((member?.membership as string) || 'free'),
        last: thread.lastPreview || 'Henüz mesaj yok',
        time: formatChatTime(thread.lastMessageAt),
        unread: thread.staffUnread,
        online: false,
        gradient: gradients.brand,
      };
    })
    .sort((a, b) => {
      const unreadDiff = (b.unread > 0 ? 1 : 0) - (a.unread > 0 ? 1 : 0);
      if (unreadDiff !== 0) return unreadDiff;
      return a.name.localeCompare(b.name, 'tr');
    });
}

export function totalStaffUnread(threads: DbChatThread[]) {
  return threads.reduce((sum, thread) => sum + thread.staffUnread, 0);
}

export function buildStaffStats(
  clients: MemberProfile[],
  programs: DbProgram[],
  appointments: ReturnType<typeof getStaffAppointments>,
) {
  return {
    clientCount: clients.length,
    programCount: programs.length,
    weekAppointments: countWeekAppointments(appointments),
    upcomingAppointments: appointments.slice(0, 5),
  };
}

export type AdminStats = {
  memberCount: number;
  staffCount: number;
  threadCount: number;
  programCount: number;
  paidMemberCount: number;
};

export type AdminMemberRow = {
  id: string;
  name: string;
  email: string;
  membership: string;
  membershipStatus: string;
};
