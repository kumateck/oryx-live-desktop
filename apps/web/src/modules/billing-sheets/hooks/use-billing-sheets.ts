import { useEffect, useMemo, useState } from "react";
import { pageMeta, useServerTable } from "@/shared/datatable";
import { apiErrorMessage } from "@/shared/errors/api-error-message";
import { usePageSearch } from "@/shared/search/page-search";
import { useGetApiV1ProcurementBillingSheetByBillingSheetIdQuery, useGetApiV1ProcurementBillingSheetInvoiceByInvoiceIdQuery, useGetApiV1ProcurementBillingSheetQuery } from "../api/billing-api";
import { audit } from "../lib/billing-access";
import { billingSheetRowsSchema, billingSheetSchema } from "../schemas/billing-schema";

/** Billing sheets, paged and searched by the backend. */
export function useBillingSheets() {
  const [busy, setBusy] = useState(false);
  const search = usePageSearch("billing sheets", busy);
  const table = useServerTable({ pageSize: 50, resetKey: search });
  const query = useGetApiV1ProcurementBillingSheetQuery({ ...audit, page: table.page, pageSize: table.pageSize, searchQuery: search });
  const parsed = useMemo(() => query.data ? billingSheetRowsSchema.safeParse(query.data.data ?? []) : null, [query.data]);
  const rows = useMemo(() => parsed?.success ? parsed.data : [], [parsed]);
  const meta = pageMeta(query.data, table, rows.length);
  useEffect(() => { setBusy(query.isFetching); }, [query.isFetching]);
  return { rows, search, error: query.error ? apiErrorMessage(query.error) : parsed && !parsed.success ? "The server returned billing sheets the app could not read." : null,
    loading: query.isLoading, refreshing: query.isFetching && !query.isLoading, retry: () => { void query.refetch(); },
    paging: { page: table.page, pageSize: table.pageSize, totalRows: meta.totalRows, onPageChange: table.onPageChange, onPageSizeChange: table.onPageSizeChange } };
}

export function useBillingSheet(id: string) {
  const query = useGetApiV1ProcurementBillingSheetByBillingSheetIdQuery({ ...audit, billingSheetId: id });
  const parsed = useMemo(() => billingSheetSchema.safeParse(query.data ?? null), [query.data]);
  return { sheet: parsed.success ? parsed.data : null, loading: query.isLoading, error: query.error ? apiErrorMessage(query.error) : null, retry: () => { void query.refetch(); } };
}

/** The billing sheet raised for an invoice, for pages that start from the shipment. Read only when there is one to read. */
export function useInvoiceBillingSheet(invoiceId: string | null, wanted: boolean) {
  const query = useGetApiV1ProcurementBillingSheetInvoiceByInvoiceIdQuery({ ...audit, invoiceId: invoiceId ?? "" }, { skip: !wanted || !invoiceId });
  const parsed = useMemo(() => billingSheetSchema.safeParse(query.data ?? null), [query.data]);
  return { sheet: parsed.success ? parsed.data : null, loading: query.isLoading || query.isFetching, error: query.error ? apiErrorMessage(query.error) : null, retry: () => { void query.refetch(); } };
}
