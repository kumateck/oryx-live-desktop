interface ReportPage<T> { data?: T[] | null; pageIndex?: number; pageCount?: number; totalRecordCount?: number }
/** Reject partial/moving-page exports rather than silently exporting the first page. */
export async function readAllPages<T>(load: (page: number) => Promise<ReportPage<T>>, identity: (row: T) => string | null | undefined, signal: AbortSignal): Promise<T[]> {
  const rows: T[] = []; const seen = new Set<string>(); let expectedCount: number | undefined; let expectedPages: number | undefined;
  for (let page = 1; ; page += 1) {
    if (signal.aborted) throw new Error("Report cancelled");
    const result = await load(page);
    const count = result.totalRecordCount;
    const pages = result.pageCount ?? (count === 0 ? 1 : undefined);
    if (pages === undefined || !Number.isInteger(pages) || pages < 0 || (result.pageIndex !== undefined && result.pageIndex !== page)) throw new Error("The server did not provide complete report pagination.");
    if (expectedCount !== undefined && count !== undefined && count !== expectedCount) throw new Error("The records changed during report generation. Run the report again.");
    if (expectedPages !== undefined && pages !== expectedPages) throw new Error("The report page count changed during generation. Run it again.");
    expectedCount = count; expectedPages = pages;
    for (const row of result.data ?? []) { const id = identity(row); if (!id || seen.has(id)) throw new Error("The report contains a missing or repeated identity. Run it again before exporting."); seen.add(id); rows.push(row); }
    if (page >= Math.max(1, pages)) break;
    if (!(result.data?.length)) throw new Error("An intermediate report page was empty. No partial export was created.");
  }
  if (expectedCount !== undefined && expectedCount !== rows.length) throw new Error("Not every report record was received. Run it again before exporting.");
  return rows;
}
