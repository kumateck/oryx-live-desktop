import { useCallback, useEffect, useMemo, useState } from "react";
import { useGetApiV1WarehouseShelfQuery, useLazyGetApiV1WarehouseRackQuery } from "@/modules/racks/api/rack-api";
import { shelfAudit } from "@/modules/racks/lib/rack-access";
import { storageRackRowsSchema, storageShelfRowsSchema, type StorageShelf } from "@/modules/racks/schemas/rack-schema";
import { pageMeta, useServerTable } from "@/shared/datatable";
import { apiErrorMessage } from "@/shared/errors/api-error-message";
import type { SelectLoader } from "@/shared/forms/form-wizard-types";
import type { MaterialKind } from "@/shared/reference-data/kind-tabs";
import { usePageSearch } from "@/shared/search/page-search";

const none: StorageShelf[] = [];

/** The shelves of raw or packaging stores, paged and searched by the backend. */
export function useStorageShelves(kind: MaterialKind | null) {
  const [busy, setBusy] = useState(false);
  const search = usePageSearch("shelves", busy);
  const table = useServerTable({ pageSize: 50, resetKey: `${search}:${kind}` });
  const query = useGetApiV1WarehouseShelfQuery({ ...shelfAudit, materialKind: kind ?? 0, page: table.page, pageSize: table.pageSize, searchQuery: search }, { skip: kind === null });
  const parsed = useMemo(() => query.data ? storageShelfRowsSchema.safeParse(query.data.data ?? []) : null, [query.data]);
  const rows = parsed?.success ? parsed.data : none;
  const meta = pageMeta(query.data, table, rows.length);
  useEffect(() => { setBusy(query.isFetching); }, [query.isFetching]);
  return {
    rows, search, error: query.error ? apiErrorMessage(query.error) : parsed && !parsed.success ? "The server returned shelves the app could not read." : null,
    loading: query.isLoading, refreshing: query.isFetching && !query.isLoading, retry: () => { void query.refetch(); },
    paging: { page: table.page, pageSize: table.pageSize, totalRows: meta.totalRows, onPageChange: table.onPageChange, onPageSizeChange: table.onPageSizeChange },
  };
}

const rackPageSize = 20;
/** Racks of one kind, a page at a time and searched by name, for choosing the rack a shelf goes on. */
export function useRackOptions(kind: MaterialKind): SelectLoader {
  const [load] = useLazyGetApiV1WarehouseRackQuery();
  return useCallback<SelectLoader>(async (search, page) => {
    const data = await load({ ...shelfAudit, kind, page, pageSize: rackPageSize, searchQuery: search }).unwrap();
    const racks = storageRackRowsSchema.parse(data.data ?? []);
    return { options: racks.map((rack) => ({ value: rack.id, label: [rack.name, rack.location, rack.warehouse].filter(Boolean).join(" · ") })),
      hasNext: page * rackPageSize < (data.totalRecordCount ?? 0), hasPrevious: page > 1 };
  }, [load, kind]);
}
