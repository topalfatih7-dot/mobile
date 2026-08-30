/** Web parity: Adsız `src/data/healthStaffNotes.js` */

export const HEALTH_NOTE_ROLE_META: Record<
  string,
  { label: string; bg: string; fg: string }
> = {
  coach: { label: 'Koç', bg: '#dceef7', fg: '#1d526f' },
  dietitian: { label: 'Diyetisyen', bg: '#e0f0e6', fg: '#2d6242' },
  doctor: { label: 'Doktor', bg: '#ffede3', fg: '#c4923a' },
  admin: { label: 'Admin', bg: '#1a2332', fg: '#ffffff' },
};

export type HealthStaffNote = {
  id: string;
  staffId: string;
  staffName: string;
  staffRole: string;
  text: string;
  createdAt: string;
  updatedAt: string;
};

export function normalizeHealthStaffNotes(raw: unknown): HealthStaffNote[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .filter((n) => n && typeof (n as HealthStaffNote).text === 'string' && String((n as HealthStaffNote).text).trim())
    .map((n) => {
      const note = n as Partial<HealthStaffNote>;
      return {
        id: note.id || `hn-${Date.now()}`,
        staffId: note.staffId || '',
        staffName: note.staffName || 'Uzman',
        staffRole: note.staffRole || 'coach',
        text: String(note.text || '').trim(),
        createdAt: note.createdAt || new Date().toISOString(),
        updatedAt: note.updatedAt || note.createdAt || new Date().toISOString(),
      };
    });
}

export function sortHealthStaffNotes(notes: HealthStaffNote[] = []) {
  return [...notes].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );
}

export function appendHealthStaffNote(
  notes: HealthStaffNote[] = [],
  payload: {
    text?: string;
    staffId?: string;
    staffName?: string;
    staffRole?: string;
  },
): HealthStaffNote[] {
  const text = String(payload?.text || '').trim();
  if (!text) return notes;
  const entry: HealthStaffNote = {
    id: `hn-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`,
    staffId: payload.staffId || '',
    staffName: payload.staffName || 'Uzman',
    staffRole: payload.staffRole || 'coach',
    text,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  return [entry, ...normalizeHealthStaffNotes(notes)];
}
