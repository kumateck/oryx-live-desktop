import { useEffect, useMemo, useState } from "react";
import { useAccess } from "@/shared/auth/use-access";
import { pageMeta, useServerTable } from "@/shared/datatable";
import { apiErrorMessage } from "@/shared/errors/api-error-message";
import { usePageSearch } from "@/shared/search/page-search";
import { useGetApiV1ProcurementSupplierQuery } from "../api/supplier-api";
import { supplierAudit, supplierPermissions } from "../lib/supplier-access";
import { supplierRowsSchema, type SupplierRow } from "../schemas/supplier-list-schema";

const empty: SupplierRow[] = [];
export function useSuppliersList() {
  const { has } = useAccess();
  const [busy, setBusy] = useState(false);
  const search = usePageSearch("suppliers", busy);
  const table = useServerTable({ pageSize: 30, resetKey: search });
  const query = useGetApiV1ProcurementSupplierQuery({ ...supplierAudit, page: table.page, pageSize: table.pageSize, searchQuery: search }, { skip: !has(supplierPermissions.view) });
  const parsed = useMemo(() => query.data ? supplierRowsSchema.safeParse(query.data.data ?? []) : null, [query.data]);
  const rows = parsed?.success ? parsed.data : empty;
  const meta = pageMeta(query.data, table, rows.length);
  const error = query.error ? apiErrorMessage(query.error) : parsed && !parsed.success ? "The server returned supplier records this app could not read." : null;
  useEffect(() => { setBusy(query.isFetching); }, [query.isFetching]);
  return { rows, search, error, loading: query.isLoading, refreshing: query.isFetching && !query.isLoading,
    retry: () => { void query.refetch(); },
    paging: { page: table.page, pageSize: table.pageSize, totalRows: meta.totalRows, onPageChange: table.onPageChange, onPageSizeChange: table.onPageSizeChange } };
}
