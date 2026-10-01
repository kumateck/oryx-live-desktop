import { useCallback, useMemo, useState } from "react";
import type { DataTableSorting } from "../lib/columns";

interface Options {
  pageSize?: number;
  sorting?: DataTableSorting;
  /**
   * Anything that changes which rows match, such as the search term or a status tab. When it
   * changes the table returns to the first page, so the user is never left on a page that no longer exists.
   */
  resetKey?: string;
}

/** Page, page size, and sorting for a server-paged list. */
export function useServerTable({ pageSize: initialSize = 30, sorting: initialSorting, resetKey = "" }: Options = {}) {
  const [position, setPosition] = useState({ key: resetKey, page: 1 });
  const [pageSize, setSize] = useState(initialSize);
  const [sorting, setSort] = useState<DataTableSorting>(initialSorting ?? []);
  // Derived rather than reset in an effect, so the first request after a change already asks for page 1.
  const page = position.key === resetKey ? position.page : 1;
  const onPageChange = useCallback((next: number) => setPosition({ key: resetKey, page: next }), [resetKey]);
  const onPageSizeChange = useCallback((size: number) => { setSize(size); setPosition({ key: resetKey, page: 1 }); }, [resetKey]);
  const onSortingChange = useCallback((next: DataTableSorting) => { setSort(next); setPosition({ key: resetKey, page: 1 }); }, [resetKey]);
  return useMemo(() => ({ page, pageSize, sorting, onPageChange, onPageSizeChange, onSortingChange }),
    [page, pageSize, sorting, onPageChange, onPageSizeChange, onSortingChange]);
}
