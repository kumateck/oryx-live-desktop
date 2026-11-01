import { useMemo, useState } from "react";
import { Plus, X } from "lucide-react";
import { useNavigate, useSearchParams } from "react-router";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useAccess } from "@/shared/auth/use-access";
import { ServerDataTable, dataTableColumns, pageMeta, useServerTable } from "@/shared/datatable";
import { apiErrorMessage } from "@/shared/errors/api-error-message";
import { formatDate } from "@/shared/format/dates";
import { PageHeader } from "@/shared/navigation/page-header";
import { usePageSearch } from "@/shared/search/page-search";
import { useGetApiV1CostingPricingAgreementsQuery, type PricingAgreement } from "../api/costing-api";
import { useCurrencyOptions } from "../hooks/use-costing-choices";
import { agreementPath, agreementState, agreementStateLabels, costingAudit, costingPermissions, priceIn } from "../lib/costing";
import { AgreementDialog } from "./agreement-dialog";
import { CostingTabs } from "./costing-tabs";

const column = dataTableColumns<PricingAgreement>();
const columns = column.columns([
  column.accessor((row) => row.customerName ?? "", { id: "customer", header: "Customer" }),
  column.accessor((row) => row.productName ?? "", { id: "product", header: "Product", cell: ({ row }) => <span className="break-words">{row.original.productName ?? "–"}<span className="block text-xs text-muted-foreground">{row.original.productPackingName ?? ""}</span></span> }),
  column.accessor((row) => row.agreedPrice ?? 0, { id: "price", header: "Price per pack", cell: ({ row }) => <span className="font-medium">{priceIn(row.original.agreedPrice, row.original.currency)}</span> }),
  column.accessor((row) => row.effectiveFrom ?? "", { id: "period", header: "In effect", cell: ({ row }) => `${formatDate(row.original.effectiveFrom) ?? "–"} to ${row.original.effectiveTo ? formatDate(row.original.effectiveTo) ?? "–" : "open"}` }),
  column.accessor((row) => agreementState(row.effectiveFrom, row.effectiveTo), { id: "state", header: "Status", cell: ({ row }) => { const state = agreementState(row.original.effectiveFrom, row.original.effectiveTo);
    return <Badge variant={state === "active" ? "secondary" : "outline"}>{agreementStateLabels[state]}</Badge>; } }),
]);

/** Customer pricing agreements across every customer, optionally for one customer or only those in effect today. */
export function AgreementsPage() {
  const [params, setParams] = useSearchParams(); const navigate = useNavigate(); const { has } = useAccess();
  const search = usePageSearch("pricing agreements", false);
  const customerId = params.get("customer") ?? undefined;
  const current = params.get("state") === "active";
  const table = useServerTable({ pageSize: 30, resetKey: `${search}|${customerId ?? ""}|${current}` });
  const [today] = useState(() => new Date().toISOString());
  const query = useGetApiV1CostingPricingAgreementsQuery({ ...costingAudit, page: table.page, pageSize: table.pageSize, searchQuery: search, ...(customerId ? { customerId } : {}), ...(current ? { activeOn: today } : {}) });
  const rows = useMemo(() => query.currentData?.data ?? [], [query.currentData]);
  const meta = pageMeta(query.currentData, table, rows.length);
  const currencies = useCurrencyOptions();
  const [adding, setAdding] = useState(false);
  const change = (key: string, value: string | null) => setParams((old) => { const next = new URLSearchParams(old); if (value === null) next.delete(key); else next.set(key, value); return next; });
  const customerName = rows.find((row) => row.customerId === customerId)?.customerName ?? "one customer";
  return <section className="page-fill">
    <PageHeader title="Costing" crumbs={[{ label: "Finance" }, { label: "Costing", to: "/finance/costing" }, { label: "Customer agreements" }]}
      actions={has(costingPermissions.manage) ? <Button size="sm" onClick={() => setAdding(true)}><Plus />Add agreement</Button> : null} />
    <CostingTabs />
    <div className="flex flex-wrap items-center gap-2">
      <div role="group" aria-label="Agreement period" className="flex flex-wrap gap-1">{([["all", "All agreements"], ["active", "In effect today"]] as const).map(([value, label]) => <Button key={value} size="sm" variant={(current ? "active" : "all") === value ? "secondary" : "ghost"}
        aria-pressed={(current ? "active" : "all") === value} onClick={() => change("state", value === "all" ? null : value)}>{label}</Button>)}</div>
      {customerId ? <Button size="sm" variant="outline" onClick={() => change("customer", null)} aria-label={`Show every customer instead of ${customerName}`}>Customer: {customerName}<X /></Button> : null}
    </div>
    <ServerDataTable label="Customer pricing agreements" columns={columns} rows={rows} getRowId={(row) => row.id ?? ""} page={table.page} pageSize={table.pageSize} totalRows={meta.totalRows}
      onPageChange={table.onPageChange} onPageSizeChange={table.onPageSizeChange} loading={query.isLoading} refreshing={query.isFetching && !query.isLoading}
      error={query.error ? apiErrorMessage(query.error) : null} onRetry={() => void query.refetch()} onRowOpen={(row) => { if (row.id) void navigate(agreementPath(row.id)); }}
      emptyTitle="No matching pricing agreements" emptyDescription="Without an agreement, quotations use the product's list price." />
    {adding ? <AgreementDialog agreement={null} customer={customerId ? { value: customerId, label: customerName } : null} currencies={currencies.options}
      onSaved={(id) => { if (id) void navigate(agreementPath(id)); }} onClose={() => setAdding(false)} /> : null}
  </section>;
}
