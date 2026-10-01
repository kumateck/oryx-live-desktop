import { useEffect, useMemo, useState } from "react";
import { pageMeta, useServerTable } from "@/shared/datatable";
import { apiErrorMessage } from "@/shared/errors/api-error-message";
import { usePageSearch } from "@/shared/search/page-search";
import { useGetApiV1ProductionScheduleQuery } from "../api/schedule-api";
import { audit } from "../lib/schedule-access";
import { scheduleListSchema, type ScheduleRow } from "../schemas/schedule-schema";

const none: ScheduleRow[] = [];

/** Production schedules, paged and searched by the backend. */
export function useSchedulesList() {
  const [busy, setBusy] = useState(false);
  const search = usePageSearch("production schedules", busy);
  const table = useServerTable({ pageSize: 50, resetKey: search });
  const query = useGetApiV1ProductionScheduleQuery({ ...audit, page: table.page, pageSize: table.pageSize, searchQuery: search });
  const parsed = useMemo(() => query.data ? scheduleListSchema.safeParse(query.data.data ?? []) : null, [query.data]);
  const rows = parsed?.success ? parsed.data : none;
  const meta = pageMeta(query.data, table, rows.length);

  useEffect(() => { setBusy(query.isFetching); }, [query.isFetching]);

  return {
    rows, search,
    error: query.error ? apiErrorMessage(query.error) : parsed && !parsed.success ? "The server returned schedules the app could not read." : null,
    loading: query.isLoading,
    refreshing: query.isFetching && !query.isLoading,
    retry: () => { void query.refetch(); },
    paging: { page: table.page, pageSize: table.pageSize, totalRows: meta.totalRows, onPageChange: table.onPageChange, onPageSizeChange: table.onPageSizeChange },
  };
}
