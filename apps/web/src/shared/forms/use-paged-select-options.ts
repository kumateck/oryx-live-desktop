import { useEffect, useState } from "react";
import type { SelectLoader, SelectPage } from "./form-wizard-types";

interface LoadResult {
  key: string;
  status: "ready" | "error";
  page?: SelectPage;
}

export function usePagedSelectOptions(loader: SelectLoader, open: boolean, search: string, page: number, revision: number, debounceMs = 300) {
  const [result, setResult] = useState<LoadResult | null>(null);
  const key = `${search}\u0000${page}\u0000${revision}`;

  useEffect(() => {
    if (!open) return;
    const request = new AbortController();
    const timer = window.setTimeout(() => {
      void loader(search, page, request.signal).then((loaded) => {
        if (!request.signal.aborted) setResult({ key, status: "ready", page: loaded });
      }).catch(() => {
        if (!request.signal.aborted) setResult({ key, status: "error" });
      });
    }, debounceMs);
    return () => { window.clearTimeout(timer); request.abort(); };
  }, [loader, open, search, page, revision, debounceMs, key]);

  const current = result?.key === key ? result : null;
  return {
    options: current?.page?.options ?? [],
    hasNext: current?.page?.hasNext ?? false,
    hasPrevious: current?.page?.hasPrevious ?? false,
    loading: open && current === null,
    error: current?.status === "error",
  };
}
