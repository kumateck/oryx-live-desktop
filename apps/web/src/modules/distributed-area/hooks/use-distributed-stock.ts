import { useEffect, useMemo, useState } from "react";
import { useCurrentUser } from "@/shared/auth/session-provider";
import { pageMeta, useServerTable } from "@/shared/datatable";
import { apiErrorMessage } from "@/shared/errors/api-error-message";
import type { MaterialKind } from "@/shared/reference-data/kind-tabs";
import { usePageSearch } from "@/shared/search/page-search";
import { useGetApiV1ProcurementDistributeMaterialQuery } from "../api/distributed-api";
import { audit, awaitingShelving } from "../lib/distributed-access";
import { distributedRowsSchema, type DistributedStock } from "../schemas/distributed-schema";

const none: DistributedStock[] = [];

/** Stock delivered to the user's department that is still waiting to be put on shelves. */
export function useDistributedStock(kind: MaterialKind | null) {
  const departmentId = useCurrentUser()?.departmentId ?? null;
  const [busy, setBusy] = useState(false);
  const search = usePageSearch("received stock", busy);
  const table = useServerTable({ pageSize: 50, resetKey: `${search}:${kind}` });
  const query = useGetApiV1ProcurementDistributeMaterialQuery({ ...audit, kind: kind ?? 0, status: awaitingShelving, page: table.page, pageSize: table.pageSize, searchQuery: search, ...(departmentId ? { departmentId } : {}) },
    { skip: kind === null || !departmentId });
  const parsed = useMemo(() => query.data ? distributedRowsSchema.safeParse(query.data.data ?? []) : null, [query.data]);
  const rows = parsed?.success ? parsed.data : none;
  const meta = pageMeta(query.data, table, rows.length);
  useEffect(() => { setBusy(query.isFetching); }, [query.isFetching]);
  return {
    rows, search, noDepartment: !departmentId, error: query.error ? apiErrorMessage(query.error) : parsed && !parsed.success ? "The server returned received stock the app could not read." : null,
    loading: query.isLoading, refreshing: query.isFetching && !query.isLoading, retry: () => { void query.refetch(); },
    paging: { page: table.page, pageSize: table.pageSize, totalRows: meta.totalRows, onPageChange: table.onPageChange, onPageSizeChange: table.onPageSizeChange },
  };
}
