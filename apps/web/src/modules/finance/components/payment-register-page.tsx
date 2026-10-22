import { useMemo } from "react";
import { useSearchParams, useNavigate } from "react-router";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ServerDataTable, dataTableColumns, pageMeta, useServerTable } from "@/shared/datatable";
import { apiErrorMessage } from "@/shared/errors/api-error-message";
import { formatDate } from "@/shared/format/dates";
import { PageHeader } from "@/shared/navigation/page-header";
import { usePageSearch } from "@/shared/search/page-search";
import { formatMoney } from "@/shared/procurement/price";
import { financeApi, type PaymentRow } from "../api/finance-api";
import { financeAudit, paymentPath } from "../lib/access";
import { labelFor, methods, payableTypes, PaymentStatus, statuses } from "../lib/payments";
import { PaymentToolbar } from "./payment-toolbar";
const column = dataTableColumns<PaymentRow>();
const columns = column.columns([
  column.accessor((row) => row.reference ?? "", { id: "reference", header: "Reference" }),
  column.accessor((row) => row.paymentDate ?? "", { id: "date", header: "Payment date", cell: ({ row }) => formatDate(row.original.paymentDate) ?? "Not recorded" }),
  column.accessor((row) => row.amount ?? "", { id: "amount", header: "Amount", cell: ({ row }) => formatMoney(row.original.amount, row.original.currency?.name) }),
  column.accessor((row) => row.payableType === 3 ? "Receipt" : "Payment", { id: "entry", header: "Entry" }),
  column.accessor((row) => labelFor(payableTypes, row.payableType), { id: "document", header: "Document type" }),
  column.accessor((row) => labelFor(methods, row.method), { id: "method", header: "Method" }),
  column.accessor((row) => row.status ?? "", { id: "status", header: "Status", cell: ({ row }) => <Badge variant={row.original.status === 2 ? "destructive" : "outline"}>{labelFor(statuses, row.original.status)}</Badge> }),
]);
export function PaymentRegisterPage() {
  const [params, setParams] = useSearchParams(); const navigate = useNavigate();
  const search = usePageSearch("payments and receipts", false);
  const status = params.get("status") === "0" ? PaymentStatus.Pending : params.get("status") === "1" ? PaymentStatus.Approved : params.get("status") === "2" ? PaymentStatus.Rejected : undefined;
  const receipt = params.get("entry") === "receipt" ? true : params.get("entry") === "payment" ? false : undefined;
  const table = useServerTable({ pageSize: 30, resetKey: `${search}|${status}|${receipt}` });
  const query = financeApi.useGetApiV1PaymentsQuery({ ...financeAudit, page: table.page, pageSize: table.pageSize, searchQuery: search, ...(status === undefined ? {} : { status }), ...(receipt === undefined ? {} : { isReceipt: receipt }) });
  const rows = useMemo(() => query.currentData?.data ?? [], [query.currentData]);
  const meta = pageMeta(query.currentData, table, rows.length);
  const change = (key: string, value: string) => setParams((old) => { const next = new URLSearchParams(old); next.set(key, value); return next; });
  return <section className="page-fill"><PageHeader title="Payments & receipts" crumbs={[{ label: "Finance" }, { label: "Payments & receipts" }]} actions={<PaymentToolbar />} />
    <div className="flex flex-wrap gap-3"><div role="group" aria-label="Entry kind" className="flex flex-wrap gap-1">{["all", "payment", "receipt"].map((value) => <Button key={value} size="sm" variant={(params.get("entry") ?? "all") === value ? "secondary" : "ghost"} onClick={() => change("entry", value)} aria-pressed={(params.get("entry") ?? "all") === value}>{value === "all" ? "All entries" : value === "receipt" ? "Receipts" : "Payments"}</Button>)}</div>
      <div role="group" aria-label="Payment status" className="flex flex-wrap gap-1">{["all", "0", "1", "2"].map((value) => <Button key={value} size="sm" variant={(status === undefined ? "all" : String(status)) === value ? "secondary" : "ghost"} aria-pressed={(status === undefined ? "all" : String(status)) === value} onClick={() => change("status", value)}>{value === "all" ? "All statuses" : labelFor(statuses, Number(value))}</Button>)}</div></div>
    <ServerDataTable label="Payments and receipts" columns={columns} rows={rows} getRowId={(row) => row.id ?? ""} page={table.page} pageSize={table.pageSize} totalRows={meta.totalRows} onPageChange={table.onPageChange} onPageSizeChange={table.onPageSizeChange}
      loading={query.isLoading} refreshing={query.isFetching && !query.isLoading} error={query.error ? apiErrorMessage(query.error) : rows.some((row) => !row.id) ? "The register contains an unreadable entry. Refresh before opening a record." : null}
      onRetry={() => void query.refetch()} onRowOpen={(row) => { if (row.id) void navigate(paymentPath(row.id)); }} emptyTitle="No matching payments or receipts" emptyDescription="Change the filters or record a transaction against an existing document." />
    <p className="text-sm text-muted-foreground">Payments and receipts share Settings → Approvals → Payment. Only final approval reduces outstanding balances. If no workflow stages are configured, the backend automatically approves the entry and logs the reason. The recorder cannot review their own entry.</p>
  </section>;
}
