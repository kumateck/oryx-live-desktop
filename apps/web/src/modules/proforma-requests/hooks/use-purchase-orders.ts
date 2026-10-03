import { useEffect, useMemo, useState } from "react";
import { pageMeta, useServerTable } from "@/shared/datatable";
import { apiErrorMessage } from "@/shared/errors/api-error-message";
import type { SupplierType } from "@/shared/procurement/supplier-type";
import { usePageSearch } from "@/shared/search/page-search";
import { useGetApiV1ProcurementPurchaseOrderQuery } from "../api/purchase-order-api";
import { purchaseOrderRowsSchema, type PurchaseOrder } from "../schemas/purchase-order-schema";

const none: PurchaseOrder[] = [];
type Status = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11;

/** Purchase orders of one supplier type, at one stage or (with no status) at any, newest first, searched by order number. */
export function usePurchaseOrders({ type, status, audit }: { type: SupplierType | null; status: Status | null; audit: { module: string; subModule: string } }) {
  const [busy, setBusy] = useState(false);
  const search = usePageSearch("purchase orders", busy);
  const table = useServerTable({ pageSize: 50, resetKey: `${search}:${type}:${status}` });
  const query = useGetApiV1ProcurementPurchaseOrderQuery({ ...audit, type: type ?? 0, ...(status === null ? {} : { status }), page: table.page, pageSize: table.pageSize, searchQuery: search }, { skip: type === null });
  const parsed = useMemo(() => query.data ? purchaseOrderRowsSchema.safeParse(query.data.data ?? []) : null, [query.data]);
  const rows = parsed?.success ? parsed.data : none;
  const meta = pageMeta(query.data, table, rows.length);
  useEffect(() => { setBusy(query.isFetching); }, [query.isFetching]);
  return {
    rows, search, error: query.error ? apiErrorMessage(query.error) : parsed && !parsed.success ? "The server returned purchase orders the app could not read." : null,
    loading: query.isLoading, refreshing: query.isFetching && !query.isLoading, retry: () => { void query.refetch(); },
    paging: { page: table.page, pageSize: table.pageSize, totalRows: meta.totalRows, onPageChange: table.onPageChange, onPageSizeChange: table.onPageSizeChange },
  };
}
