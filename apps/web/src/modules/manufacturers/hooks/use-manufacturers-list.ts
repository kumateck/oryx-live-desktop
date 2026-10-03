import { useEffect, useMemo, useState } from "react";
import { useAccess } from "@/shared/auth/use-access";
import { pageMeta, useServerTable } from "@/shared/datatable";
import { apiErrorMessage } from "@/shared/errors/api-error-message";
import { usePageSearch } from "@/shared/search/page-search";
import { useGetApiV1ProcurementManufacturerQuery } from "../api/manufacturer-api";
import { manufacturerAudit, manufacturerPermissions } from "../lib/manufacturer-access";
import { manufacturerRowsSchema, type ManufacturerRow } from "../schemas/manufacturer-list-schema";

const empty: ManufacturerRow[] = [];
export function useManufacturersList() {
  const { has } = useAccess();
  const [busy, setBusy] = useState(false);
  const search = usePageSearch("manufacturers", busy);
  const table = useServerTable({ pageSize: 30, resetKey: search });
  const query = useGetApiV1ProcurementManufacturerQuery({ ...manufacturerAudit, page: table.page, pageSize: table.pageSize, searchQuery: search }, { skip: !has(manufacturerPermissions.view) });
  const parsed = useMemo(() => query.data ? manufacturerRowsSchema.safeParse(query.data.data ?? []) : null, [query.data]);
  const rows = parsed?.success ? parsed.data : empty;
  const meta = pageMeta(query.data, table, rows.length);
  const error = query.error ? apiErrorMessage(query.error) : parsed && !parsed.success ? "The server returned manufacturer records this app could not read." : null;
  useEffect(() => { setBusy(query.isFetching); }, [query.isFetching]);
  return { rows, search, error, loading: query.isLoading, refreshing: query.isFetching && !query.isLoading,
    retry: () => { void query.refetch(); },
    paging: { page: table.page, pageSize: table.pageSize, totalRows: meta.totalRows, onPageChange: table.onPageChange, onPageSizeChange: table.onPageSizeChange } };
}
