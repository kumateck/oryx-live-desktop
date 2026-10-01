/** Returns the rows with one row replaced by its patched copy. The row is found by ID, never by position. */
export function updateRowById<TData>(
  rows: readonly TData[], getRowId: (row: TData) => string, id: string, patch: Partial<TData>,
): TData[] {
  return rows.map((row) => getRowId(row) === id ? { ...row, ...patch } : row);
}

/** Moves the row `id` to the position currently held by `overId`. Unknown IDs leave the order unchanged. */
export function moveRowById<TData>(
  rows: readonly TData[], getRowId: (row: TData) => string, id: string, overId: string,
): { rows: TData[]; from: number; to: number } | null {
  const from = rows.findIndex((row) => getRowId(row) === id);
  const to = rows.findIndex((row) => getRowId(row) === overId);
  if (from < 0 || to < 0 || from === to) return null;
  const next = [...rows];
  const [moved] = next.splice(from, 1);
  if (moved === undefined) return null;
  next.splice(to, 0, moved);
  return { rows: next, from, to };
}

/** Parses what a user typed into a number field. Empty or unreadable input is null, never NaN. */
export function parseNumberInput(text: string, limits: { min?: number | undefined; max?: number | undefined } = {}): number | null {
  const trimmed = text.trim().replace(/,/g, "");
  if (trimmed === "" || !/^[-+]?(\d+\.?\d*|\.\d+)$/.test(trimmed)) return null;
  const value = Number(trimmed);
  if (!Number.isFinite(value)) return null;
  return Math.min(limits.max ?? Infinity, Math.max(limits.min ?? -Infinity, value));
}
