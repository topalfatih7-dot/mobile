import type { ProgramEntry } from '@/services/db/programs';

export function completionKey(dateStr: string, entryId: string) {
  return `${dateStr}_${entryId}`;
}

export function formatDateISO(date: Date) {
  return date.toISOString().slice(0, 10);
}

export function entryMatchesDate(entry: ProgramEntry, date: Date) {
  const dateStr = formatDateISO(date);
  if (entry.date) return entry.date === dateStr;
  if (entry.day != null && entry.day !== '') {
    return Number(entry.day) === date.getDay();
  }
  return false;
}

export function getProgramEntriesForDate<T extends { id: string; entries?: ProgramEntry[]; title?: string; type?: string }>(
  programs: T[],
  date: Date,
) {
  const result: (ProgramEntry & { programId: string; programTitle: string; programType: string })[] = [];
  programs.forEach((program) => {
    (program.entries || []).forEach((entry) => {
      if (entryMatchesDate(entry, date)) {
        result.push({
          ...entry,
          programId: program.id,
          programTitle: program.title || '',
          programType: program.type || 'workout',
        });
      }
    });
  });
  return result;
}
