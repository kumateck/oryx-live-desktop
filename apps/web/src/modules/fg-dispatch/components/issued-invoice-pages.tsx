import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useAccess } from "@/shared/auth/use-access";
import { ServerDataTable, dataTableColumns, pageMeta, useServerTable } from "@/shared/datatable";
import { DetailGroup, DetailItem } from "@/shared/detail/detail-list";
import { apiErrorMessage } from "@/shared/errors/api-error-message";
import { formatDate, formatDateTime } from "@/shared/format/dates";
import { PageHeader } from "@/shared/navigation/page-header";
import { PrintButton } from "@/shared/print/print-button";
import { PrintPreviewDialog } from "@/shared/print/print-preview-dialog";
import { PrintFacts, PrintHeader, PrintSignatures } from "@/shared/print/print-sheet";
import { formatMoney } from "@/shared/procurement/price";
import { usePageSearch } from "@/shared/search/page-search";
import { DetailPageSkeleton } from "@/shared/skeleton/page-skeletons";
import type { DomainEntitiesInvoicesInvoiceDto as Invoice } from "@/shared/api/generated/production";
import { useGetApiV1ProductionOrdersInvoiceQuery, useGetApiV1ProductionOrdersInvoiceByIdQuery } from "../api/dispatch-api";
import { invoiceAudit, invoicesPath, proformaInvoicePath } from "../lib/dispatch";
import { invoiceSchema } from "../schemas/dispatch-schema";
import { CustomerPoDialog } from "./customer-po-dialog";
import { InvoiceLines } from "./invoice-lines";
import type { PricedLine } from "../lib/dispatch";
const amount = (row: Invoice) => (row.amounts ?? []).map((a) => formatMoney(a.amount ?? 0, a.currency?.symbol ?? a.currency?.name ?? "")).join(" + ");
const column = dataTableColumns<Invoice>();
const columns = column.columns([
  column.accessor((row) => row.code ?? "Legacy invoice (number missing)", { id: "code", header: "Issued invoice" }),
  column.accessor((row) => row.customer?.name ?? "", { id: "customer", header: "Customer" }),
  column.accessor((row) => row.proformaInvoice?.customerPoNumber ?? "", { id: "po", header: "Customer PO" }),
  column.accessor((row) => row.createdAt ?? "", { id: "date", header: "Issued", cell: ({ row }) => formatDate(row.original.createdAt) }),
  column.display({ id: "amount", header: "Frozen amount", cell: ({ row }) => amount(row.original) }),
  column.display({ id: "status", header: "Status", cell: ({ row }) => <Badge variant={row.original.voided ? "destructive" : "default"}>{row.original.voided ? "Voided" : "Issued"}</Badge> }),
]);
export function IssuedInvoiceListPage() {
  const navigate = useNavigate(); const search = usePageSearch("issued invoices");
  const table = useServerTable({ pageSize: 30, resetKey: search });
  const query = useGetApiV1ProductionOrdersInvoiceQuery({ ...invoiceAudit, searchQuery: search, page: table.page, pageSize: table.pageSize });
  const rows = query.currentData?.data ?? []; const meta = pageMeta(query.currentData, table, rows.length);
  return <section className="page-fill">
    <PageHeader title="Issued invoices" crumbs={[{ label: "FG Warehouse" }, { label: "Invoices" }]} />
    <ServerDataTable label="Issued invoices" columns={columns} rows={rows} getRowId={(row) => row.id ?? ""} page={table.page} pageSize={table.pageSize} totalRows={meta.totalRows}
      onPageChange={table.onPageChange} onPageSizeChange={table.onPageSizeChange} loading={query.isLoading} refreshing={query.isFetching && !query.isLoading}
      error={query.error ? apiErrorMessage(query.error) : null} onRetry={() => void query.refetch()} onRowOpen={(row) => void navigate(`${invoicesPath}/${row.id}`)}
      emptyTitle="No issued invoices" emptyDescription="Verify the customer PO and complete approval, then issue its invoice from the proforma." />
  </section>;
}
function IssuedDetail({ invoice }: { invoice: Invoice }) {
  const { has } = useAccess(); const [voiding, setVoiding] = useState(false);
  const parsed = invoiceSchema.safeParse(invoice.proformaInvoice); const proforma = parsed.success ? parsed.data : null;
  const currencies = new Map((invoice.amounts ?? []).flatMap((row) => row.currency?.id ? [[row.currency.id, row.currency.symbol ?? row.currency.name ?? ""] as const] : []));
  const lines: PricedLine[] = (proforma?.products ?? []).map((product) => ({ key: product.key, productName: product.name, genericName: product.genericName,
    code: product.code, quantity: product.quantity, perShipper: 0, unitPrice: product.savedUnitPrice ?? 0, currency: currencies.get(product.savedCurrencyId ?? "") ?? null,
    packingStyle: proforma?.allocation?.products.find((line) => line.productId === product.productId && line.packingId === product.packingId)?.sources[0]?.packing ?? null,
    currencyKey: product.savedCurrencyId ?? "", source: "saved" }));
  const priced = { lines, loading: false, unavailable: !proforma || proforma.products.length === 0 || proforma.products.some((product) => product.savedUnitPrice === null || !product.savedCurrencyId) };
  return <article className="space-y-4">
    <PageHeader title={`Invoice ${invoice.code ?? "(number missing)"}`} crumbs={[{ label: "Invoices", to: invoicesPath }, { label: invoice.code ?? "Invoice" }]} actions={<>
      <PrintButton preview={(close) => <PrintPreviewDialog title={`Invoice ${invoice.code ?? ""}`} ready={!priced.loading && !priced.unavailable && Boolean(proforma)} onClose={close}>
        <PrintHeader title={invoice.voided ? "VOIDED INVOICE" : "Invoice"} reference={invoice.code} />
        <PrintFacts facts={[{ label: "Customer", value: invoice.customer?.name }, { label: "Address", value: invoice.customer?.address }, { label: "Issued", value: formatDate(invoice.createdAt) },
          { label: "Proforma", value: proforma?.code }, { label: "Customer PO", value: proforma?.customerPoNumber }, { label: "Due", value: formatDate(invoice.dueDate) },
          { label: "Frozen totals", value: amount(invoice) }, { label: "Void reason", value: invoice.voidReason }]} />
        {priced.unavailable ? <p role="status" className="text-sm text-amber-700 dark:text-amber-400">This historical invoice has no complete saved pack-price breakdown. Its frozen financial totals remain visible; resolve its source evidence before printing.</p> : null}
    <InvoiceLines lines={priced.lines} loading={priced.loading} unavailable={priced.unavailable} print />
        <PrintSignatures roles={["Prepared by Finance", "Approved by"]} />
      </PrintPreviewDialog>} />
      {!invoice.voided && proforma && has("CanVoidFinishedGoodsInvoice") ? <Button size="sm" variant="outline" onClick={() => setVoiding(true)}>Void invoice</Button> : null}
    </>} />
    <Badge variant={invoice.voided ? "destructive" : "default"}>{invoice.voided ? "Voided · retained for audit" : "Issued"}</Badge>
    <DetailGroup title="Commercial record"><DetailItem label="Customer" value={invoice.customer?.name} /><DetailItem label="Customer PO" value={proforma?.customerPoNumber} />
      <DetailItem label="Issued" value={formatDateTime(invoice.createdAt)} /><DetailItem label="Due" value={formatDate(invoice.dueDate)} /><DetailItem label="Frozen totals" value={amount(invoice)} />
      <DetailItem label="Voided" value={formatDateTime(invoice.voidedAt)} /><DetailItem label="Void evidence" value={invoice.voidReason} />
      <DetailItem label="Proforma" value={proforma && has("CanViewProformaInvoice") ? <Link className="text-primary underline" to={proformaInvoicePath(proforma.id)}>{proforma.code}</Link> : proforma?.code} /></DetailGroup>
    <InvoiceLines lines={priced.lines} loading={priced.loading} unavailable={priced.unavailable} />
    <DetailGroup title="Receivable balances">{(invoice.balances ?? []).map((balance) => <DetailItem key={balance.currencyId} label={balance.currencySymbol ?? balance.currencyName ?? "Currency"}
      value={`Paid ${formatMoney(balance.amountPaid ?? 0, balance.currencySymbol ?? "")} · Outstanding ${formatMoney(balance.outstandingBalance ?? 0, balance.currencySymbol ?? "")}`} />)}</DetailGroup>
    {voiding && proforma ? <CustomerPoDialog invoice={{ ...proforma, issuedInvoiceId: invoice.id ?? null }} action="void" onClose={() => setVoiding(false)} /> : null}
  </article>;
}
export function IssuedInvoiceDetailPage() {
  const { id = "" } = useParams(); const query = useGetApiV1ProductionOrdersInvoiceByIdQuery({ ...invoiceAudit, id }, { skip: !id });
  if (query.isLoading) return <DetailPageSkeleton label="Loading issued invoice" groups={3} />;
  if (!query.data) return <div role="alert"><p>{query.error ? apiErrorMessage(query.error) : "Invoice unavailable."}</p><Button variant="outline" onClick={() => void query.refetch()}>Retry</Button></div>;
  return <IssuedDetail invoice={query.data} />;
}
