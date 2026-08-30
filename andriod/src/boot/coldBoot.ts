/** JS runtime başına bir kez soğuk açılış boot süresi. */

const BOOT_MIN_MS = 1800;

const startedAt = Date.now();
let completed = false;

export function isColdBootCompleted(): boolean {
  return completed;
}

export function markColdBootCompleted(): void {
  completed = true;
}

export function coldBootRemainingMs(): number {
  return Math.max(0, BOOT_MIN_MS - (Date.now() - startedAt));
}

export function waitColdBootMin(): Promise<void> {
  const rem = coldBootRemainingMs();
  if (rem <= 0) return Promise.resolve();
  return new Promise((resolve) => {
    setTimeout(resolve, rem);
  });
}
