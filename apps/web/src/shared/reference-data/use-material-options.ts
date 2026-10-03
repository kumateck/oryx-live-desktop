import { useCallback } from "react";
import { materialsApi } from "@/shared/api/generated/materials";
import type { SelectLoader } from "@/shared/forms/form-wizard-types";

const { useLazyGetApiV1MaterialQuery } = materialsApi;
const noExcluded: readonly string[] = [];

/** Searches one page at a time. The caller supplies the selected material kind. */
export function useMaterialOptions(kind: 0 | 1 | null, excludedIds: readonly string[] = noExcluded): SelectLoader {
  const [load] = useLazyGetApiV1MaterialQuery();
  return useCallback(async (search, page, signal) => {
    if (kind === null) return { options: [], hasNext: false, hasPrevious: false };
    const pending = load({ kind, page, pageSize: 30, searchQuery: search, module: "Settings", subModule: "Materials" });
    signal.addEventListener("abort", () => pending.abort(), { once: true });
    const result = await pending.unwrap();
    const excluded = new Set(excludedIds);
    return {
      options: (result.data ?? []).flatMap((item) => item.id && item.name && !excluded.has(item.id)
        ? [{ value: item.id, label: `${item.code ? `${item.code} · ` : ""}${item.name}` }] : []),
      hasPrevious: page > 1, hasNext: page < (result.pageCount ?? page),
    };
  }, [load, kind, excludedIds]);
}
