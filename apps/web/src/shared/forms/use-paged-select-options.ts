import { useEffect, useState } from "react";
import type { SelectLoader, SelectPage } from "./form-wizard-types";

interface LoadResult {
  key: string;
  status: "ready" | "error";
  page?: SelectPage;
}

const noOptions: SelectPage["options"] = [];

/**
 * One page of options from a loader, reloaded when the search, page, or loader changes.
 * While the next page is on its way the previous options stay available (`stale`), so the list
 * and its paging buttons are never removed from the screen mid-click.
 */
export function usePagedSelectOptions(loader: SelectLoader, open: boolean, search: string, page: number, revision: number, debounceMs = 300) {
  const [result, setResult] = useState<LoadResult | null>(null);
  const [lastPage, setLastPage] = useState<SelectPage | null>(null);
  const key = `${search}\u0000${page}\u0000${revision}`;

  useEffect(() => {
    if (!open) return;
    const request = new AbortController();
    const timer = window.setTimeout(() => {
      void loader(search, page, request.signal).then((loaded) => {
        if (request.signal.aborted) return;
        setResult({ key, status: "ready", page: loaded });
        setLastPage(loaded);
      }).catch(() => {
        if (!request.signal.aborted) setResult({ key, status: "error" });
      });
    }, debounceMs);
    return () => { window.clearTimeout(timer); request.abort(); };
  }, [loader, open, search, page, revision, debounceMs, key]);

  const current = result?.key === key ? result : null;
  const loading = open && current === null;
  const shown = current?.page ?? (loading ? lastPage : null);
  return {
    options: shown?.options ?? noOptions,
    hasNext: current?.page?.hasNext ?? false,
    hasPrevious: current?.page?.hasPrevious ?? false,
    loading,
    /** True while the options shown belong to the previous request. */
    stale: loading && shown !== null,
    error: current?.status === "error",
  };
}
