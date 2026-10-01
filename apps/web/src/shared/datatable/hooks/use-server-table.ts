import { useCallback, useMemo, useState } from "react";
import type { DataTableSorting } from "../lib/columns";

/**
 * Page, page size, sorting, and search for a server-paged list. Changing the page size, sorting, or
 * search returns to the first page, so the user is never left on a page that no longer exists.
 */
export function useServerTable(options: { pageSize?: number; sorting?: DataTableSorting } = {}) {
  const [page, setPage] = useState(1);
  const [pageSize, setSize] = useState(options.pageSize ?? 30);
  const [sorting, setSort] = useState<DataTableSorting>(options.sorting ?? []);
  const [search, setTerm] = useState("");
  const onPageSizeChange = useCallback((size: number) => { setSize(size); setPage(1); }, []);
  const onSortingChange = useCallback((next: DataTableSorting) => { setSort(next); setPage(1); }, []);
  const onSearchChange = useCallback((term: string) => { setTerm(term); setPage(1); }, []);
  return useMemo(() => ({
    page, pageSize, sorting, search, onPageChange: setPage, onPageSizeChange, onSortingChange, onSearchChange,
  }), [page, pageSize, sorting, search, onPageSizeChange, onSortingChange, onSearchChange]);
}
