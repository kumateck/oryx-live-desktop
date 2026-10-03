import { useMemo } from "react";
import { pageMeta, useServerTable } from "@/shared/datatable";
import { apiErrorMessage } from "@/shared/errors/api-error-message";
import type { SupplierType } from "@/shared/procurement/supplier-type";
import { useGetApiV1RequisitionSourceSupplierQuery } from "../api/quotation-request-api";
import { audit } from "../lib/quotation-request-access";
import { quotationRequestRowsSchema, type QuotationRequest } from "../schemas/quotation-request-schema";

const none: QuotationRequest[] = [];

/** Suppliers with materials to be quoted, of one supplier type: those not yet asked, or those already asked. */
export function useQuotationRequests(type: SupplierType | null, sent: boolean) {
  const table = useServerTable({ pageSize: 50, resetKey: `${type}:${sent}` });
  const query = useGetApiV1RequisitionSourceSupplierQuery({ ...audit, source: type ?? 0, sent, page: table.page, pageSize: table.pageSize }, { skip: type === null });
  const parsed = useMemo(() => query.data ? quotationRequestRowsSchema.safeParse(query.data.data ?? []) : null, [query.data]);
  const rows = parsed?.success ? parsed.data : none;
  const meta = pageMeta(query.data, table, rows.length);
  return {
    rows, error: query.error ? apiErrorMessage(query.error) : parsed && !parsed.success ? "The server returned quotation requests the app could not read." : null,
    loading: query.isLoading, refreshing: query.isFetching && !query.isLoading, retry: () => { void query.refetch(); },
    paging: { page: table.page, pageSize: table.pageSize, totalRows: meta.totalRows, onPageChange: table.onPageChange, onPageSizeChange: table.onPageSizeChange },
  };
}
