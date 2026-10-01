import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { useSearchParams } from "react-router";
import { normalizeSearchTerm, searchParam } from "./search-term";

/** What the open page offers to the header search. */
export interface PageSearchTarget {
  /** Plural name of the records, for the placeholder: "users" gives "Search users". */
  label: string;
  /** True while the page is fetching results for the current term. */
  busy: boolean;
}

interface PageSearchContextValue {
  target: PageSearchTarget | null;
  register: (target: PageSearchTarget | null) => void;
}

const PageSearchContext = createContext<PageSearchContextValue | null>(null);

/** Connects the header search box to whichever page is open. Placed once, in the workspace shell. */
export function PageSearchProvider({ children }: { children: ReactNode }) {
  const [target, setTarget] = useState<PageSearchTarget | null>(null);
  const register = useCallback((next: PageSearchTarget | null) => {
    setTarget((current) => current?.label === next?.label && current?.busy === next?.busy ? current : next);
  }, []);
  const value = useMemo(() => ({ target, register }), [target, register]);
  return <PageSearchContext.Provider value={value}>{children}</PageSearchContext.Provider>;
}

export function usePageSearchTarget(): PageSearchTarget | null {
  return useContext(PageSearchContext)?.target ?? null;
}

/**
 * Called by a list page to receive the header search. Returns the term to filter by, read from the
 * address. The page announces what it searches and whether it is busy; it is forgotten when the page closes.
 */
export function usePageSearch(label: string, busy = false): string {
  const context = useContext(PageSearchContext);
  const register = context?.register;
  const [params] = useSearchParams();
  useEffect(() => { register?.({ label, busy }); }, [register, label, busy]);
  useEffect(() => () => register?.(null), [register]);
  return normalizeSearchTerm(params.get(searchParam));
}
