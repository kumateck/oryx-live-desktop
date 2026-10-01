/** Adds or removes one row ID. */
export function toggleRowSelected(selected: ReadonlySet<string>, id: string): Set<string> {
  const next = new Set(selected);
  if (!next.delete(id)) next.add(id);
  return next;
}

/** Selects every given row, or clears them when all are already selected. Rows on other pages are untouched. */
export function togglePageSelected(selected: ReadonlySet<string>, pageIds: readonly string[]): Set<string> {
  const next = new Set(selected);
  const selectAll = pageIds.some((id) => !next.has(id));
  for (const id of pageIds) { if (selectAll) next.add(id); else next.delete(id); }
  return next;
}

export type PageSelectionState = "none" | "some" | "all";

export function pageSelectionState(selected: ReadonlySet<string>, pageIds: readonly string[]): PageSelectionState {
  const count = pageIds.filter((id) => selected.has(id)).length;
  return count === 0 ? "none" : count === pageIds.length ? "all" : "some";
}
