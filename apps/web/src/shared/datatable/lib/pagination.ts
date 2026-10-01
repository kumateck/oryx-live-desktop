/** Pure paging arithmetic shared by the client and server tables. Pages are 1-based. */

export const defaultPageSizes = [10, 20, 30, 50, 100] as const;

function wholeNumber(value: number | null | undefined, fallback: number): number {
  return typeof value === "number" && Number.isFinite(value) ? Math.trunc(value) : fallback;
}

export function pageCount(totalRows: number, pageSize: number): number {
  const total = Math.max(0, wholeNumber(totalRows, 0));
  const size = Math.max(1, wholeNumber(pageSize, 1));
  return Math.max(1, Math.ceil(total / size));
}

/** Keeps a page inside the available range, including when rows were deleted from the last page. */
export function clampPage(page: number, totalRows: number, pageSize: number): number {
  return Math.min(Math.max(1, wholeNumber(page, 1)), pageCount(totalRows, pageSize));
}

/** First and last row numbers on the page, from the rows actually present rather than the page size. */
export function rowRange(page: number, pageSize: number, totalRows: number, rowsOnPage: number): { from: number; to: number } {
  if (totalRows <= 0 || rowsOnPage <= 0) return { from: 0, to: 0 };
  const from = (clampPage(page, totalRows, pageSize) - 1) * Math.max(1, pageSize) + 1;
  return { from, to: Math.min(from + rowsOnPage - 1, totalRows) };
}

/** The rows of one page out of a full list. */
export function pageSlice<TRow>(rows: readonly TRow[], page: number, pageSize: number): TRow[] {
  const size = Math.max(1, wholeNumber(pageSize, 1));
  const start = (clampPage(page, rows.length, size) - 1) * size;
  return rows.slice(start, start + size);
}

/** Page buttons to show: first, last, the current page and its neighbours, with gaps between. */
export function pageWindow(page: number, pages: number, siblings = 1): (number | "gap")[] {
  const last = Math.max(1, wholeNumber(pages, 1));
  const current = Math.min(Math.max(1, wholeNumber(page, 1)), last);
  const shown = new Set([1, last]);
  for (let value = current - siblings; value <= current + siblings; value += 1) if (value >= 1 && value <= last) shown.add(value);
  const ordered = [...shown].sort((a, b) => a - b);
  return ordered.flatMap((value, index) => {
    const previous = ordered[index - 1];
    if (previous === undefined || value - previous === 1) return [value];
    // A single hidden page is shown rather than replaced by a gap of the same width.
    return value - previous === 2 ? [previous + 1, value] : ["gap" as const, value];
  });
}

/** Offered page sizes always include the size in use, so the selector never shows a blank value. */
export function pageSizeOptions(current: number, sizes: readonly number[] = defaultPageSizes): number[] {
  const size = Math.max(1, wholeNumber(current, sizes[0] ?? 10));
  return [...new Set([...sizes, size])].sort((a, b) => a - b);
}

export interface PageMeta { page: number; pageSize: number; totalRows: number }

/**
 * Reads the backend's paged envelope (`pageIndex` is 1-based) without trusting it to be complete:
 * a missing or malformed field falls back to what the caller requested.
 */
export function pageMeta(
  response: { pageIndex?: number | null; totalRecordCount?: number | null } | null | undefined,
  requested: { page: number; pageSize: number },
  rowsOnPage: number,
): PageMeta {
  const pageSize = Math.max(1, wholeNumber(requested.pageSize, 1));
  const page = Math.max(1, wholeNumber(response?.pageIndex, requested.page));
  const known = wholeNumber(response?.totalRecordCount, -1);
  // Without a total, assume at least the rows seen so far so paging stays usable.
  const totalRows = known >= 0 ? known : (page - 1) * pageSize + Math.max(0, rowsOnPage);
  return { page, pageSize, totalRows };
}
