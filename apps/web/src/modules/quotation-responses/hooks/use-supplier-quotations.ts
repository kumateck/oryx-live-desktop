import { useMemo } from "react";
import { pageMeta, useServerTable } from "@/shared/datatable";
import { apiErrorMessage } from "@/shared/errors/api-error-message";
import type { SupplierType } from "@/shared/procurement/supplier-type";
import { useGetApiV1RequisitionSourceSupplierQuotationQuery } from "../api/quotation-response-api";
import { audit } from "../lib/quotation-response-access";
import { supplierQuotationRowsSchema, type SupplierQuotation } from "../schemas/quotation-response-schema";

const none: SupplierQuotation[] = [];

/** Requests sent to suppliers of one type: those still waiting for prices, or those with prices recorded. */
export function useSupplierQuotations(type: SupplierType | null, received: boolean) {
  const table = useServerTable({ pageSize: 50, resetKey: `${type}:${received}` });
  const query = useGetApiV1RequisitionSourceSupplierQuotationQuery({ ...audit, supplierType: type ?? 0, received, page: table.page, pageSize: table.pageSize }, { skip: type === null });
  const parsed = useMemo(() => query.data ? supplierQuotationRowsSchema.safeParse(query.data.data ?? []) : null, [query.data]);
  const rows = parsed?.success ? parsed.data : none;
  const meta = pageMeta(query.data, table, rows.length);
  return {
    rows, error: query.error ? apiErrorMessage(query.error) : parsed && !parsed.success ? "The server returned quotations the app could not read." : null,
    loading: query.isLoading, refreshing: query.isFetching && !query.isLoading, retry: () => { void query.refetch(); },
    paging: { page: table.page, pageSize: table.pageSize, totalRows: meta.totalRows, onPageChange: table.onPageChange, onPageSizeChange: table.onPageSizeChange },
  };
}
