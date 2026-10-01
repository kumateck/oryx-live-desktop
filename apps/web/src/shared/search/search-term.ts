/** Address parameter that carries the header search, so a search survives reload and can be shared. */
export const searchParam = "q";

/** What a page should filter by: trimmed, with inner whitespace collapsed. Empty means no search. */
export function normalizeSearchTerm(value: string | null | undefined): string {
  return (value ?? "").trim().replace(/\s+/g, " ");
}

/** The address query with the search term set or removed; every other parameter is kept. */
export function withSearchTerm(current: URLSearchParams, term: string): URLSearchParams {
  const next = new URLSearchParams(current);
  const value = normalizeSearchTerm(term);
  if (value) next.set(searchParam, value); else next.delete(searchParam);
  return next;
}

/** True when a key press should move focus to the header search instead of reaching the page. */
export function isSearchShortcut(event: { key: string; ctrlKey: boolean; metaKey: boolean; altKey: boolean }, typing: boolean): boolean {
  if (event.altKey) return false;
  if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") return true;
  return event.key === "/" && !event.ctrlKey && !event.metaKey && !typing;
}

export function isTypingTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  return target.isContentEditable || ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName);
}
