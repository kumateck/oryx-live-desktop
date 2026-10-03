import { useCallback, useEffect, useMemo, useState } from "react";
import { materialsApi } from "@/shared/api/generated/materials";
import { settingsApi } from "@/shared/api/generated/settings";
import { pageMeta, useServerTable } from "@/shared/datatable";
import { apiErrorMessage } from "@/shared/errors/api-error-message";
import type { MaterialKind } from "@/shared/reference-data/kind-tabs";
import { usePageSearch } from "@/shared/search/page-search";
import { createAudit } from "../lib/requisition-access";
import { categoryOptionsSchema, pickRowsSchema, type PickRow } from "../schemas/requisition-schema";

const none: PickRow[] = [];

/**
 * The department's materials of one kind, to choose from when raising a purchase requisition.
 * The choice is kept by material, so it survives paging, searching and filtering; it lives only as long as the page is open.
 */
export function useMaterialPicker(kind: MaterialKind) {
  const [busy, setBusy] = useState(false);
  const [category, setCategory] = useState<string | null>(null);
  const [chosen, setChosen] = useState<ReadonlyMap<string, PickRow>>(() => new Map());
  const search = usePageSearch("materials", busy);
  const table = useServerTable({ pageSize: 50, resetKey: `${search}:${category}` });
  const query = materialsApi.useGetApiV1MaterialDepartmentQuery({ ...createAudit, kind, page: table.page, pageSize: table.pageSize, searchQuery: search,
    sortLabel: "materialname", sortDirection: 1, ...(category ? { materialCategoryId: category } : {}) });
  const categories = settingsApi.useGetApiV1CollectionByItemTypeQuery({ ...createAudit, itemType: "MaterialCategory", materialKind: kind });
  const parsed = useMemo(() => query.data ? pickRowsSchema.safeParse(query.data.data ?? []) : null, [query.data]);
  const rows = parsed?.success ? parsed.data : none;
  const meta = pageMeta(query.data, table, rows.length);
  useEffect(() => { setBusy(query.isFetching); }, [query.isFetching]);

  // The table reports the whole selection by id; rows of other pages are known only from when they were chosen.
  const select = useCallback((ids: Set<string>) => setChosen((current) => {
    const next = new Map<string, PickRow>();
    for (const id of ids) { const row = rows.find((item) => item.id === id) ?? current.get(id); if (row) next.set(id, row); }
    return next;
  }), [rows]);
  const selected = useMemo(() => new Set(chosen.keys()), [chosen]);

  return {
    rows, search, category, setCategory, selected, select, chosen: useMemo(() => [...chosen.values()], [chosen]), clear: useCallback(() => setChosen(new Map()), []),
    categories: useMemo(() => categoryOptionsSchema.parse(categories.data ?? []), [categories.data]),
    error: query.error ? apiErrorMessage(query.error) : parsed && !parsed.success ? "The server returned materials the app could not read." : null,
    loading: query.isLoading, refreshing: query.isFetching && !query.isLoading, retry: () => { void query.refetch(); },
    paging: { page: table.page, pageSize: table.pageSize, totalRows: meta.totalRows, onPageChange: table.onPageChange, onPageSizeChange: table.onPageSizeChange },
  };
}
