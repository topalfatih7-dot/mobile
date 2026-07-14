/**
 * Staff / corporate applications — web `supabaseDb` submit + resolve.
 */
import { normalizeStaffRole } from '@/utils/staffAccess';
import { supabase } from '@/services/supabaseClient';

export type StaffApplication = {
  id: string;
  role: string;
  status: string;
  email: string;
  name: string;
  phone: string;
  data: Record<string, unknown>;
  adminNote: string;
  createdAt: string;
  reviewedAt?: string | null;
};

export type CorporateApplication = {
  id: string;
  status: string;
  companyName: string;
  contactName: string;
  email: string;
  phone: string;
  data: Record<string, unknown>;
  adminNote: string;
  createdAt: string;
  reviewedAt?: string | null;
};

type StaffAppRow = {
  id: string;
  role?: string;
  status?: string;
  email?: string;
  name?: string;
  phone?: string | null;
  data?: Record<string, unknown> | null;
  admin_note?: string | null;
  created_at?: string;
  reviewed_at?: string | null;
};

type CorpAppRow = {
  id: string;
  status?: string;
  company_name?: string;
  contact_name?: string;
  email?: string;
  phone?: string | null;
  data?: Record<string, unknown> | null;
  admin_note?: string | null;
  created_at?: string;
  reviewed_at?: string | null;
};

function nowISO() {
  return new Date().toISOString();
}

function generateTempPassword() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789!@#';
  let pwd = '';
  for (let i = 0; i < 14; i += 1) pwd += chars[Math.floor(Math.random() * chars.length)];
  return pwd;
}

export function rowToStaffApplication(row: StaffAppRow): StaffApplication {
  return {
    id: row.id,
    role: row.role || 'coach',
    status: row.status || 'pending',
    email: row.email || '',
    name: row.name || '',
    phone: row.phone || '',
    data: row.data || {},
    adminNote: row.admin_note || '',
    createdAt: row.created_at || nowISO(),
    reviewedAt: row.reviewed_at,
  };
}

export function rowToCorporateApplication(row: CorpAppRow): CorporateApplication {
  return {
    id: row.id,
    status: row.status || 'pending',
    companyName: row.company_name || '',
    contactName: row.contact_name || '',
    email: row.email || '',
    phone: row.phone || '',
    data: row.data || {},
    adminNote: row.admin_note || '',
    createdAt: row.created_at || nowISO(),
    reviewedAt: row.reviewed_at,
  };
}

export async function fetchStaffApplications(): Promise<StaffApplication[]> {
  if (!supabase) return [];
  const { data, error } = await supabase
    .from('staff_applications')
    .select('*')
    .order('created_at', { ascending: false });
  if (error || !data) return [];
  return data.map((row) => rowToStaffApplication(row as StaffAppRow));
}

export async function fetchCorporateApplications(): Promise<CorporateApplication[]> {
  if (!supabase) return [];
  const { data, error } = await supabase
    .from('corporate_applications')
    .select('*')
    .order('created_at', { ascending: false });
  if (error || !data) return [];
  return data.map((row) => rowToCorporateApplication(row as CorpAppRow));
}

export async function submitStaffApplication(form: {
  role: string;
  email: string;
  name: string;
  phone?: string;
  note?: string;
}): Promise<{ success: true; id?: string } | { success: false; error: string }> {
  if (!supabase) return { success: false, error: 'Supabase bağlantısı yok.' };
  const role = normalizeStaffRole(form.role);
  const payload = {
    note: form.note || '',
    source: 'mobile',
  };
  const { data, error } = await supabase.rpc('submit_staff_application', {
    p_role: role,
    p_email: form.email.trim().toLowerCase(),
    p_name: form.name.trim(),
    p_phone: form.phone?.trim() || '',
    p_data: payload,
  });
  if (error) return { success: false, error: error.message };
  return { success: true, id: data as string };
}

export async function submitCorporateApplication(form: {
  companyName: string;
  contactName: string;
  email: string;
  phone?: string;
  employeeRange?: string;
  message?: string;
}): Promise<{ success: true; id?: string } | { success: false; error: string }> {
  if (!supabase) return { success: false, error: 'Supabase bağlantısı yok.' };
  const payload = {
    city: '',
    industry: '',
    employeeRange: form.employeeRange || '',
    services: [],
    message: form.message || '',
    preferredStart: '',
    source: 'mobile',
  };
  const { data, error } = await supabase.rpc('submit_corporate_application', {
    p_company_name: form.companyName.trim(),
    p_contact_name: form.contactName.trim(),
    p_email: form.email.trim().toLowerCase(),
    p_phone: form.phone?.trim() || '',
    p_data: payload,
  });
  if (error) return { success: false, error: error.message };
  return { success: true, id: data as string };
}

export async function resolveStaffApplication(
  application: StaffApplication,
  approve: boolean,
  adminNote = '',
): Promise<{ success: true; tempPassword?: string } | { success: false; error: string }> {
  if (!supabase) return { success: false, error: 'Supabase bağlantısı yok.' };

  if (!approve) {
    const { error } = await supabase
      .from('staff_applications')
      .update({
        status: 'rejected',
        admin_note: adminNote || '',
        reviewed_at: nowISO(),
      })
      .eq('id', application.id);
    if (error) return { success: false, error: error.message };
    return { success: true };
  }

  const tempPassword = generateTempPassword();
  const { data: staffId, error: staffError } = await supabase.rpc('admin_upsert_staff', {
    p_id: null,
    p_email: application.email.toLowerCase().trim(),
    p_password: tempPassword,
    p_name: application.name,
    p_role: normalizeStaffRole(application.role),
    p_active: true,
    p_data: { phone: application.phone || '', ...(application.data || {}) },
  });
  if (staffError) return { success: false, error: staffError.message };

  const { error } = await supabase
    .from('staff_applications')
    .update({
      status: 'approved',
      admin_note: adminNote || '',
      reviewed_at: nowISO(),
      data: { ...application.data, staffId, tempPasswordIssued: true },
    })
    .eq('id', application.id);
  if (error) return { success: false, error: error.message };
  return { success: true, tempPassword };
}

export async function resolveCorporateApplication(
  application: CorporateApplication,
  status: 'approved' | 'rejected' | 'contacted',
  adminNote = '',
): Promise<{ success: true } | { success: false; error: string }> {
  if (!supabase) return { success: false, error: 'Supabase bağlantısı yok.' };
  const { error } = await supabase
    .from('corporate_applications')
    .update({
      status,
      admin_note: adminNote || '',
      reviewed_at: nowISO(),
    })
    .eq('id', application.id);
  if (error) return { success: false, error: error.message };
  return { success: true };
}
