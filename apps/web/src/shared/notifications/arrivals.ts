export interface Unread { id: string; message: string; type: number | null }

/**
 * Which unread notifications are new since the last look. The first look only sets the baseline:
 * signing in does not replay everything that was already waiting, the bell's count shows that.
 */
export function newArrivals(known: ReadonlySet<string> | null, current: readonly Unread[]): Unread[] {
  return known === null ? [] : current.filter((item) => !known.has(item.id));
}

/**
 * Remembers what was just announced, by its text, so the same notification is not announced twice: once
 * when it is pushed, and again when the unread list is read and it turns up there under its own id.
 */
export function createAnnouncedLog(windowMs = 120_000, now: () => number = Date.now) {
  const seen = new Map<string, number>();
  return {
    /** True the first time a text is offered within the window; false when it was announced a moment ago. */
    claim(message: string): boolean {
      const at = now();
      for (const [text, time] of seen) if (at - time > windowMs) seen.delete(text);
      if (seen.has(message)) return false;
      seen.set(message, at);
      return true;
    },
  };
}

/** How several arrivals at once are put: each on its own up to three, then one line for the lot. */
export function arrivalSummary(count: number): string | null {
  return count > 3 ? `${count} new notifications` : null;
}
