import { useEffect, useMemo, useState } from "react";
import { pageMeta, useServerTable } from "@/shared/datatable";
import { apiErrorMessage } from "@/shared/errors/api-error-message";
import type { MaterialKind } from "@/shared/reference-data/kind-tabs";
import { usePageSearch } from "@/shared/search/page-search";
import { useGetApiV1WarehouseLocationQuery, useGetApiV1WarehouseRackQuery } from "../api/rack-api";
import { rackAudit } from "../lib/rack-access";
import { storageLocationsSchema, storageRackRowsSchema, type StorageLocation, type StorageRack } from "../schemas/rack-schema";

const none: StorageRack[] = [];
const noLocations: StorageLocation[] = [];

/** The racks of raw or packaging stores, paged and searched by the backend. */
export function useStorageRacks(kind: MaterialKind | null) {
  const [busy, setBusy] = useState(false);
  const search = usePageSearch("racks", busy);
  const table = useServerTable({ pageSize: 50, resetKey: `${search}:${kind}` });
  const query = useGetApiV1WarehouseRackQuery({ ...rackAudit, kind: kind ?? 0, page: table.page, pageSize: table.pageSize, searchQuery: search }, { skip: kind === null });
  const parsed = useMemo(() => query.data ? storageRackRowsSchema.safeParse(query.data.data ?? []) : null, [query.data]);
  const rows = parsed?.success ? parsed.data : none;
  const meta = pageMeta(query.data, table, rows.length);
  useEffect(() => { setBusy(query.isFetching); }, [query.isFetching]);
  return {
    rows, search, error: query.error ? apiErrorMessage(query.error) : parsed && !parsed.success ? "The server returned racks the app could not read." : null,
    loading: query.isLoading, refreshing: query.isFetching && !query.isLoading, retry: () => { void query.refetch(); },
    paging: { page: table.page, pageSize: table.pageSize, totalRows: meta.totalRows, onPageChange: table.onPageChange, onPageSizeChange: table.onPageSizeChange },
  };
}

/** The locations of one kind of store, to stand a new rack in. */
export function useStorageLocations(kind: MaterialKind) {
  const query = useGetApiV1WarehouseLocationQuery({ ...rackAudit, materialKind: kind, page: 1, pageSize: 200 });
  const locations = useMemo(() => { const parsed = storageLocationsSchema.safeParse(query.data?.data ?? null); return parsed.success ? parsed.data.filter((location) => location.kind === kind) : noLocations; }, [query.data, kind]);
  return { locations, loading: query.isLoading, error: query.error ? apiErrorMessage(query.error) : null, retry: () => { void query.refetch(); } };
}
