import { useEffect, useMemo, useState } from "react";
import { pageMeta, useServerTable } from "@/shared/datatable";
import { apiErrorMessage } from "@/shared/errors/api-error-message";
import { useKindTabs } from "@/shared/reference-data/kind-tabs";
import { usePageSearch } from "@/shared/search/page-search";
import { useGetApiV1MaterialDepartmentQuery } from "../api/material-location-api";
import { audit, materialLocationPermissions } from "../lib/material-location-access";
import { materialStockRowsSchema, type MaterialStockRow } from "../schemas/material-location-schema";

const none: MaterialStockRow[] = [];

/** The department's materials of the open kind with their stock levels, paged and searched by the backend. */
export function useMaterialStockList() {
  const kinds = useKindTabs(materialLocationPermissions);
  const [busy, setBusy] = useState(false);
  const search = usePageSearch("materials", busy);
  const table = useServerTable({ pageSize: 50, resetKey: `${search}:${kinds.kind}` });
  const query = useGetApiV1MaterialDepartmentQuery({ ...audit, kind: kinds.kind ?? 0, page: table.page, pageSize: table.pageSize, searchQuery: search }, { skip: kinds.kind === null });
  const parsed = useMemo(() => query.data ? materialStockRowsSchema.safeParse(query.data.data ?? []) : null, [query.data]);
  const rows = parsed?.success ? parsed.data : none;
  const meta = pageMeta(query.data, table, rows.length);
  useEffect(() => { setBusy(query.isFetching); }, [query.isFetching]);
  return {
    kinds, rows, search,
    error: query.error ? apiErrorMessage(query.error) : parsed && !parsed.success ? "The server returned stock records the app could not read." : null,
    loading: query.isLoading, refreshing: query.isFetching && !query.isLoading, retry: () => { void query.refetch(); },
    paging: { page: table.page, pageSize: table.pageSize, totalRows: meta.totalRows, onPageChange: table.onPageChange, onPageSizeChange: table.onPageSizeChange },
  };
}
