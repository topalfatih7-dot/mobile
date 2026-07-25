/**
 * Destek ticket — web `supabaseDb.createTicket` / `sendTicketReply` parity.
 */
import { isUiOnly } from '@/config/runtime';
import { rowToTicket } from '@/services/mappers';
import { requireSupabase, supabase } from '@/services/supabase';
import {
  CONTACT_INFO_BLOCK_MESSAGE,
  detectExternalContactInfo,
} from '@/utils/contactInfoGuard';

export type TicketMessage = {
  id: string;
  from: 'member' | 'admin' | 'system';
  text: string;
  createdAt: string;
};

export type SupportTicket = Record<string, unknown> & {
  id: string;
  status?: string;
  subject?: string;
  category?: string;
  memberName?: string;
  message?: string;
  createdAt?: string;
  messages?: TicketMessage[];
};

export type SupportFaq = {
  id: string;
  q: string;
  a: string;
};

export async function createTicket(
  member: { id?: string; name?: string } | null | undefined,
  ticketData: { subject?: string; category?: string; message?: string; text?: string },
): Promise<Record<string, unknown> | null> {
  const createdAt = new Date().toISOString();
  const msg = {
    id: `m-${Date.now()}`,
    from: 'member',
    text: ticketData.message || ticketData.text || '',
    createdAt,
  };

  if (isUiOnly() || !supabase) {
    return {
      id: `ui-ticket-${Date.now()}`,
      memberId: member?.id || null,
      status: 'open',
      subject: ticketData.subject || 'Destek Talebi',
      category: ticketData.category || 'Genel',
      memberName: member?.name || 'Ziyaretçi',
      messages: [msg],
      createdAt,
    };
  }

  const client = requireSupabase();
  const { data: row, error } = await client
    .from('tickets')
    .insert({
      member_id: member?.id || null,
      status: 'open',
      data: {
        subject: ticketData.subject || 'Destek Talebi',
        category: ticketData.category || 'Genel',
        memberName: member?.name || 'Ziyaretçi',
        messages: [msg],
        createdAt,
      },
    })
    .select()
    .single();

  if (error || !row) return null;
  return rowToTicket(row as Record<string, unknown>);
}

export async function fetchMemberTickets(
  memberId: string,
): Promise<SupportTicket[]> {
  if (!memberId || isUiOnly() || !supabase) return [];
  const client = requireSupabase();
  const { data, error } = await client
    .from('tickets')
    .select('*')
    .eq('member_id', memberId)
    .order('created_at', { ascending: false });
  if (error) return [];
  return (data || []).map(
    (r) => rowToTicket(r as Record<string, unknown>) as SupportTicket,
  );
}

/** Web `content.faqs`: site_content sort sırasını ve q/a metnini aynen korur. */
export async function fetchSupportFaqs(): Promise<SupportFaq[]> {
  if (isUiOnly() || !supabase) return [];
  const client = requireSupabase();
  const { data, error } = await client
    .from('site_content')
    .select('id, data')
    .eq('kind', 'faq')
    .order('sort', { ascending: true });
  if (error) return [];
  return (data || []).flatMap((row) => {
    const content =
      row.data && typeof row.data === 'object'
        ? (row.data as Record<string, unknown>)
        : {};
    const q = typeof content.q === 'string' ? content.q : '';
    const a = typeof content.a === 'string' ? content.a : '';
    return q && a ? [{ id: String(row.id), q, a }] : [];
  });
}

/** Web `supabaseDb.sendTicketReply` parity, including contact-info guard. */
export async function sendTicketReply(
  id: string,
  from: 'member' | 'admin',
  text: string,
): Promise<
  | { success: true; ticket: SupportTicket }
  | { success: false; error: string }
> {
  const value = text.trim();
  if (!value) return { success: false, error: 'Mesaj boş.' };
  if (detectExternalContactInfo(value)) {
    return { success: false, error: CONTACT_INFO_BLOCK_MESSAGE };
  }
  if (isUiOnly() || !supabase) {
    return { success: false, error: 'Mesaj gönderilemedi' };
  }

  const client = requireSupabase();
  const { data: row, error: fetchError } = await client
    .from('tickets')
    .select('*')
    .eq('id', id)
    .maybeSingle();
  if (fetchError || !row) {
    return { success: false, error: fetchError?.message || 'Mesaj gönderilemedi' };
  }

  const ticket = rowToTicket(row as Record<string, unknown>) as SupportTicket;
  const messages = [
    ...(ticket.messages || []),
    {
      id: `m-${Date.now()}`,
      from,
      text: value,
      createdAt: new Date().toISOString(),
    } as TicketMessage,
  ];
  const status = from === 'admin' && ticket.status === 'open' ? 'in-progress' : ticket.status;
  const rowData =
    row.data && typeof row.data === 'object'
      ? (row.data as Record<string, unknown>)
      : {};
  const { error: updateError } = await client
    .from('tickets')
    .update({ status, data: { ...rowData, messages } })
    .eq('id', id);
  if (updateError) return { success: false, error: updateError.message };

  return {
    success: true,
    ticket: { ...ticket, messages, status },
  };
}

/** F09: web app bundle gibi ticket değişikliklerini canlı yenile. */
export function subscribeMemberTickets(memberId: string, onChange: () => void) {
  if (!memberId || isUiOnly() || !supabase) return () => {};
  const channel = supabase
    .channel(`member-support-${memberId}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'tickets',
        filter: `member_id=eq.${memberId}`,
      },
      onChange,
    )
    .subscribe();
  return () => {
    void supabase?.removeChannel(channel);
  };
}
