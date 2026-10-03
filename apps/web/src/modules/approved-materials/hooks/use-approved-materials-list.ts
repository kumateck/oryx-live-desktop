import { useEffect, useMemo, useState } from "react";
import { pageMeta, useServerTable } from "@/shared/datatable";
import { apiErrorMessage } from "@/shared/errors/api-error-message";
import { useKindTabs } from "@/shared/reference-data/kind-tabs";
import { usePageSearch } from "@/shared/search/page-search";
import { useGetApiV1MaterialApprovedMaterialsQuery } from "../api/approved-material-api";
import { approvedMaterialPermissions, audit } from "../lib/approved-material-access";
import { approvedMaterialRowsSchema, type ApprovedMaterialRow } from "../schemas/approved-material-schema";

const none: ApprovedMaterialRow[] = [];

/** Approved stock of the kind the user has open, paged and searched by the backend. */
export function useApprovedMaterialsList() {
  const kinds = useKindTabs(approvedMaterialPermissions);
  const [busy, setBusy] = useState(false);
  const search = usePageSearch("approved materials", busy);
  const table = useServerTable({ pageSize: 50, resetKey: `${search}:${kinds.kind}` });
  const query = useGetApiV1MaterialApprovedMaterialsQuery({ ...audit, kind: kinds.kind ?? 0, page: table.page, pageSize: table.pageSize, searchQuery: search }, { skip: kinds.kind === null });
  const parsed = useMemo(() => query.data ? approvedMaterialRowsSchema.safeParse(query.data.data ?? []) : null, [query.data]);
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
