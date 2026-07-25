/**
 * Web parity: Adsız `utils/coachProgram.collectProgramExerciseIds`
 * Workout programlarındaki benzersiz exerciseId listesi (koç + AI).
 */
export function collectProgramExerciseIds(programs: Record<string, unknown>[] = []): string[] {
  const ids = new Set<string>();
  for (const program of programs || []) {
    if (program?.type && program.type !== 'workout') continue;
    const entries = Array.isArray(program?.entries) ? program.entries : [];
    for (const entry of entries as Record<string, unknown>[]) {
      const id = entry?.exerciseId;
      if (id && typeof id === 'string') ids.add(id);
    }
  }
  return [...ids];
}
