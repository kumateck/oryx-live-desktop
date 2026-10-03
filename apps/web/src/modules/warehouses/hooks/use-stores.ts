import { useEffect, useMemo, useState } from "react";
import { pageMeta, useServerTable } from "@/shared/datatable";
import { apiErrorMessage } from "@/shared/errors/api-error-message";
import { usePageSearch } from "@/shared/search/page-search";
import { useGetApiV1WarehouseLocationQuery, useGetApiV1WarehouseQuery } from "../api/store-api";
import { locationAudit, storeAudit } from "../lib/store-rules";
import { locationRowsSchema, storeRowsSchema } from "../schemas/store-schema";

/** Every store, paged and searched by the backend. */
export function useStores() {
  const [busy, setBusy] = useState(false);
  const search = usePageSearch("stores", busy);
  const table = useServerTable({ pageSize: 50, resetKey: search });
  const query = useGetApiV1WarehouseQuery({ ...storeAudit, page: table.page, pageSize: table.pageSize, searchQuery: search });
  const parsed = useMemo(() => query.data ? storeRowsSchema.safeParse(query.data.data ?? []) : null, [query.data]);
  const rows = useMemo(() => parsed?.success ? parsed.data : [], [parsed]);
  const meta = pageMeta(query.data, table, rows.length);
  useEffect(() => { setBusy(query.isFetching); }, [query.isFetching]);
  return { rows, search, error: query.error ? apiErrorMessage(query.error) : parsed && !parsed.success ? "The server returned stores the app could not read." : null,
    loading: query.isLoading, refreshing: query.isFetching && !query.isLoading, retry: () => { void query.refetch(); },
    paging: { page: table.page, pageSize: table.pageSize, totalRows: meta.totalRows, onPageChange: table.onPageChange, onPageSizeChange: table.onPageSizeChange } };
}

/** Every location, paged and searched by the backend. */
export function useStoreLocations() {
  const [busy, setBusy] = useState(false);
  const search = usePageSearch("locations", busy);
  const table = useServerTable({ pageSize: 50, resetKey: search });
  const query = useGetApiV1WarehouseLocationQuery({ ...locationAudit, page: table.page, pageSize: table.pageSize, searchQuery: search });
  const parsed = useMemo(() => query.data ? locationRowsSchema.safeParse(query.data.data ?? []) : null, [query.data]);
  const rows = useMemo(() => parsed?.success ? parsed.data : [], [parsed]);
  const meta = pageMeta(query.data, table, rows.length);
  useEffect(() => { setBusy(query.isFetching); }, [query.isFetching]);
  return { rows, search, error: query.error ? apiErrorMessage(query.error) : parsed && !parsed.success ? "The server returned locations the app could not read." : null,
    loading: query.isLoading, refreshing: query.isFetching && !query.isLoading, retry: () => { void query.refetch(); },
    paging: { page: table.page, pageSize: table.pageSize, totalRows: meta.totalRows, onPageChange: table.onPageChange, onPageSizeChange: table.onPageSizeChange } };
}

/** Stores to stand a new location in. Setup lists are short, so one page is read. */
export function useStoreOptions() {
  const query = useGetApiV1WarehouseQuery({ ...locationAudit, page: 1, pageSize: 200 });
  const stores = useMemo(() => { const parsed = storeRowsSchema.safeParse(query.data?.data ?? null); return parsed.success ? parsed.data : []; }, [query.data]);
  return { stores, loading: query.isLoading, error: query.error ? apiErrorMessage(query.error) : null, retry: () => { void query.refetch(); } };
}
