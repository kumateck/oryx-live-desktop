import { useEffect, useMemo, useState } from "react";
import { pageMeta, useServerTable } from "@/shared/datatable";
import { apiErrorMessage } from "@/shared/errors/api-error-message";
import { usePageSearch } from "@/shared/search/page-search";
import { useGetApiV1RequisitionQuery } from "../api/requisition-api";
import type { RequisitionStatus, RequisitionType } from "../lib/requisition-status";
import { requisitionRowsSchema } from "../schemas/requisition-schema";

/** Requisitions, newest first, paged and searched by the backend. `status` keeps only requisitions with a line in that state. */
export function useRequisitionsList({ audit, type, status, searchLabel }: { audit: { module: string; subModule: string }; type: RequisitionType | null; status?: RequisitionStatus; searchLabel: string }) {
  const [busy, setBusy] = useState(false);
  const search = usePageSearch(searchLabel, busy);
  const table = useServerTable({ pageSize: 50, resetKey: `${search}:${type}:${status}` });
  const query = useGetApiV1RequisitionQuery({ ...audit, page: table.page, pageSize: table.pageSize, searchQuery: search, ...(type === null ? {} : { type }), ...(status === undefined ? {} : { status }) });
  const rows = useMemo(() => requisitionRowsSchema.parse(query.data?.data ?? []), [query.data]);
  const meta = pageMeta(query.data, table, rows.length);
  useEffect(() => { setBusy(query.isFetching); }, [query.isFetching]);
  return {
    rows, search, error: query.error ? apiErrorMessage(query.error) : null,
    loading: query.isLoading, refreshing: query.isFetching && !query.isLoading, retry: () => { void query.refetch(); },
    paging: { page: table.page, pageSize: table.pageSize, totalRows: meta.totalRows, onPageChange: table.onPageChange, onPageSizeChange: table.onPageSizeChange },
  };
}
