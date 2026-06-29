import { supabase } from '@/services/supabaseClient';
import type { MemberProfile } from '@/types/session';

export type SupportTicket = {
  id: string;
  memberId: string | null;
  status: string;
  subject: string;
  category: string;
  memberName: string;
  messages: SupportMessage[];
  createdAt: string;
};

export type SupportMessage = {
  id: string;
  from: 'member' | 'admin' | string;
  text: string;
  createdAt: string;
};

type TicketRow = {
  id: string;
  member_id: string | null;
  status: string;
  data?: {
    subject?: string;
    category?: string;
    memberName?: string;
    messages?: SupportMessage[];
    createdAt?: string;
  } | null;
  created_at?: string;
};

function nowISO() {
  return new Date().toISOString();
}

function rowToTicket(row: TicketRow): SupportTicket {
  const data = row.data || {};
  return {
    id: row.id,
    memberId: row.member_id,
    status: row.status || 'open',
    subject: data.subject || 'Destek Talebi',
    category: data.category || 'Genel',
    memberName: data.memberName || 'Üye',
    messages: data.messages || [],
    createdAt: data.createdAt || row.created_at || nowISO(),
  };
}

export async function fetchMemberTickets(memberId: string): Promise<SupportTicket[]> {
  if (!supabase) return [];
  const { data, error } = await supabase
    .from('tickets')
    .select('*')
    .eq('member_id', memberId)
    .order('created_at', { ascending: false });
  if (error) return [];
  return (data || []).map((row) => rowToTicket(row as TicketRow));
}

export async function createSupportTicket(
  member: MemberProfile,
  input: { subject: string; message: string; category?: string },
): Promise<{ success: true; ticket: SupportTicket } | { success: false; error: string }> {
  if (!supabase) return { success: false, error: 'Supabase bağlantısı yok.' };

  const msg: SupportMessage = {
    id: `m-${Date.now()}`,
    from: 'member',
    text: input.message.trim(),
    createdAt: nowISO(),
  };

  const { data, error } = await supabase
    .from('tickets')
    .insert({
      member_id: member.id,
      status: 'open',
      data: {
        subject: input.subject.trim() || 'Destek Talebi',
        category: input.category || 'Genel',
        memberName: member.name || 'Üye',
        messages: [msg],
        createdAt: nowISO(),
      },
    })
    .select()
    .single();

  if (error || !data) return { success: false, error: error?.message || 'Talep oluşturulamadı.' };
  return { success: true, ticket: rowToTicket(data as TicketRow) };
}

export async function sendSupportTicketReply(
  ticketId: string,
  from: 'member' | 'admin',
  text: string,
): Promise<{ success: true; ticket: SupportTicket } | { success: false; error: string }> {
  if (!supabase) return { success: false, error: 'Supabase bağlantısı yok.' };

  const { data: rows, error: fetchError } = await supabase
    .from('tickets')
    .select('*')
    .eq('id', ticketId)
    .limit(1);

  const current = rows?.[0] as TicketRow | undefined;
  if (fetchError || !current) return { success: false, error: 'Talep bulunamadı.' };

  const ticket = rowToTicket(current);
  const messages = [
    ...(ticket.messages || []),
    { id: `m-${Date.now()}`, from, text: text.trim(), createdAt: nowISO() },
  ];

  const { error } = await supabase
    .from('tickets')
    .update({
      status: ticket.status,
      data: { ...(current.data || {}), messages },
    })
    .eq('id', ticketId);

  if (error) return { success: false, error: error.message };
  return { success: true, ticket: { ...ticket, messages } };
}
