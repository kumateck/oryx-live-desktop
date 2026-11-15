import { useCallback, useState } from "react";

const storageKey = (userId: string) => `oryx.reports.pinned.${userId}`;

function readPinned(userId: string | null): string[] {
  if (!userId) return [];
  try {
    const stored: unknown = JSON.parse(window.localStorage.getItem(storageKey(userId)) ?? "[]");
    return Array.isArray(stored) ? stored.filter((value): value is string => typeof value === "string") : [];
  } catch { return []; }
}

/** Reports a person pinned to the top of the hub. A convenience kept on this computer only. */
export function usePinnedReports(userId: string | null) {
  const [pinned, setPinned] = useState(() => readPinned(userId));
  const toggle = useCallback((slug: string) => {
    setPinned((current) => {
      const next = current.includes(slug) ? current.filter((value) => value !== slug) : [...current, slug];
      if (userId) try { window.localStorage.setItem(storageKey(userId), JSON.stringify(next)); } catch { /* preference stays in memory */ }
      return next;
    });
  }, [userId]);
  return { pinned, toggle };
}
