import { VendorPricesDialog } from "./vendor-prices-dialog";
import { useMemo, useState } from "react";
import { HandCoins, Printer, Send } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ConfirmActionDialog, TableMenu, TableMenuHeader } from "@/shared/actions";
import { inventoryApi } from "@/shared/api/generated/inventory";
import { ServerDataTable, dataTableColumns, pageMeta, useServerTable } from "@/shared/datatable";
import { apiErrorMessage } from "@/shared/errors/api-error-message";
import { formatDate } from "@/shared/format/dates";
import { PrintPreviewDialog } from "@/shared/print/print-preview-dialog";
import { PrintFacts, PrintHeader, PrintTable, type PrintColumn } from "@/shared/print/print-sheet";
import { keys, procurementAudit, vendorQuotationPageSchema, type VendorQuotation } from "../lib/procurement";

const column = dataTableColumns<VendorQuotation>();
type Line = VendorQuotation["items"][number];
const printColumns: PrintColumn<Line>[] = [
  { id: "n", header: "#", cell: (_row, index) => index + 1, width: "6%" },
  { id: "item", header: "Item", cell: (row) => <>{row.name}<small>{row.code}</small></> },
  { id: "quantity", header: "Quantity", align: "right", cell: (row) => `${String(row.quantity)} ${row.unit}`.trim() },
  { id: "price", header: "Unit price", cell: () => "", width: "16%" },
  { id: "per", header: "Priced per", cell: () => "", width: "12%" },
];

function RequestPrint({ quotation, onClose }: { quotation: VendorQuotation; onClose: () => void }) {
  return <PrintPreviewDialog title={`Quotation request · ${quotation.vendor.name}`} note="A paper copy. Printing does not send the request." onClose={onClose}>
    <PrintHeader title="Quotation request" reference={quotation.requisitionCode} />
    <PrintFacts facts={[{ label: "Vendor", value: quotation.vendor.name }, { label: "Contact", value: [quotation.vendor.contact, quotation.vendor.phone, quotation.vendor.email].filter(Boolean).join(" · ") || "–" },
      { label: "Address", value: quotation.vendor.address ?? "–" }, { label: "Items", value: String(quotation.items.length) }, { label: "Prices in", value: quotation.vendor.currency || "–" }]} />
    <p className="print-note">Please quote your unit price for each item below, stating the unit the price is per, with availability and delivery time.</p>
    <PrintTable columns={printColumns} rows={quotation.items} rowKey={(row) => row.id} empty="No items on this request" />
  </PrintPreviewDialog>;
}

function useQuotationList(received: boolean) {
  const table = useServerTable({ pageSize: 50, resetKey: String(received) });
  const query = inventoryApi.useGetApiV1ProcurementInventoryVendorQuotationsQuery({ ...procurementAudit, received, page: table.page, pageSize: table.pageSize }, { refetchOnMountOrArgChange: 30 });
  const parsed = useMemo(() => query.data ? vendorQuotationPageSchema.safeParse(query.data) : null, [query.data]);
  const rows = useMemo(() => parsed?.success ? parsed.data.data : [], [parsed]);
  return { table, query, rows, meta: pageMeta(query.data, table, rows.length), error: query.error ? apiErrorMessage(query.error) : parsed && !parsed.success ? "The server returned quotations the app could not read." : null };
}

const baseColumns = [
  column.accessor((q) => q.vendor.name, { id: "vendor", header: "Vendor", cell: ({ row }) => <div><div className="font-medium">{row.original.vendor.name}</div>
    <div className="text-xs text-muted-foreground">{[row.original.vendor.phone, row.original.vendor.email].filter(Boolean).join(" · ") || "–"}</div></div> }),
  column.accessor((q) => q.requisitionCode ?? "", { id: "requisition", header: "Requisition", size: 140, cell: ({ row }) => row.original.requisitionCode ?? "–" }),
  column.accessor((q) => q.items.length, { id: "items", header: "Items", size: 80 }),
];

/** Quotation requests to trusted vendors: printed for the vendor and sent by email from the server. */
export function QuotationRequestsPage() {
  const list = useQuotationList(false);
  const [printing, setPrinting] = useState<VendorQuotation | null>(null);
  const [sending, setSending] = useState<VendorQuotation | null>(null);
  const [send] = inventoryApi.usePostApiV1ProcurementInventoryVendorByVendorIdSendQuotationMutation();
  const columns = useMemo(() => column.columns([
    ...baseColumns,
    column.accessor((q) => q.sentAt ?? "", { id: "sent", header: "Request", size: 150, cell: ({ row }) => row.original.sentAt ? <Badge>Sent {formatDate(row.original.sentAt)}</Badge> : <Badge variant="outline">Not sent</Badge> }),
    column.display({ id: "actions", size: 56, enableHiding: false, header: () => <TableMenuHeader />, cell: ({ row }) => <TableMenu label={`Actions for ${row.original.vendor.name}`} items={[
      { id: "print", label: "Print", icon: Printer, require: keys.requestsView, onSelect: () => setPrinting(row.original) },
      ...(row.original.sentAt ? [] : [{ id: "send", label: "Send to vendor", icon: Send, require: { kind: "all" as const, permissions: [keys.requestsView, keys.requestCreate] }, onSelect: () => setSending(row.original) }]),
    ]} /> }),
  ]), []);
  return <section className="page-fill">
    <div><p className="eyebrow">STORE PROCUREMENT</p><h1 className="text-xl font-semibold">Supplier quote requests</h1>
      <p className="text-sm text-muted-foreground">Requests for prices prepared for trusted vendors when items are sourced.</p></div>
    <ServerDataTable label="Quotation requests" columns={columns} rows={list.rows} getRowId={(q) => q.id} page={list.table.page} pageSize={list.table.pageSize} totalRows={list.meta.totalRows}
      onPageChange={list.table.onPageChange} onPageSizeChange={list.table.onPageSizeChange} loading={list.query.isLoading} refreshing={list.query.isFetching && !list.query.isLoading}
      onRetry={() => void list.query.refetch()} error={list.error} emptyTitle="No quotation requests waiting" />
    {printing ? <RequestPrint quotation={printing} onClose={() => setPrinting(null)} /> : null}
    {sending ? <ConfirmActionDialog require={{ kind: "all", permissions: [keys.requestsView, keys.requestCreate] }} destructive={false} title={`Send the request to ${sending.vendor.name}?`}
      description={`The server emails ${sending.vendor.email ?? "the vendor"} a PDF of the ${String(sending.items.length)} item(s) waiting for their prices. Requests already sent are not repeated.`}
      confirmLabel="Send request" busyLabel="Sending…" onClose={() => setSending(null)}
      onConfirm={async () => { const result = await send({ ...procurementAudit, vendorId: sending.vendor.id }); if ("error" in result) return apiErrorMessage(result.error);
        toast.success("Quotation request sent"); return null; }} /> : null}
  </section>;
}

/** Vendors' answers to quotation requests: waiting for prices, and those already priced. */
export function QuotationResponsesPage() {
  const [received, setReceived] = useState(false);
  const list = useQuotationList(received);
  const [pricing, setPricing] = useState<VendorQuotation | null>(null);
  const columns = useMemo(() => column.columns([
    ...baseColumns,
    column.accessor((q) => q.sentAt ?? "", { id: "sent", header: "Sent", size: 120, cell: ({ row }) => formatDate(row.original.sentAt) ?? "Not sent" }),
    column.accessor((q) => q.items.reduce((s, i) => s + (i.price ?? 0) * i.quantity, 0), { id: "total", header: "Quoted value", size: 140,
      cell: ({ row }) => row.original.received ? `${row.original.vendor.currency} ${row.original.items.reduce((s, i) => s + (i.price ?? 0) * i.quantity, 0).toFixed(2)}`.trim() : "–" }),
    column.display({ id: "actions", size: 56, enableHiding: false, header: () => <TableMenuHeader />, cell: ({ row }) => row.original.received ? null : <TableMenu label={`Actions for ${row.original.vendor.name}`} items={[
      { id: "prices", label: "Record prices", icon: HandCoins, require: { kind: "all", permissions: [keys.responsesView, keys.responseSend] }, onSelect: () => setPricing(row.original) },
    ]} /> }),
  ]), []);
  return <section className="page-fill">
    <header className="flex flex-wrap items-start justify-between gap-3"><div><p className="eyebrow">STORE PROCUREMENT</p><h1 className="text-xl font-semibold">Quotation responses</h1>
      <p className="text-sm text-muted-foreground">Prices trusted vendors have quoted. Recorded prices move to the price comparison.</p></div>
      <div className="flex gap-2" role="group" aria-label="Responses">
        <Button size="sm" variant={received ? "outline" : "default"} aria-pressed={!received} onClick={() => setReceived(false)}>Waiting for prices</Button>
        <Button size="sm" variant={received ? "default" : "outline"} aria-pressed={received} onClick={() => setReceived(true)}>Priced</Button></div></header>
    <ServerDataTable label="Quotation responses" columns={columns} rows={list.rows} getRowId={(q) => q.id} page={list.table.page} pageSize={list.table.pageSize} totalRows={list.meta.totalRows}
      onPageChange={list.table.onPageChange} onPageSizeChange={list.table.onPageSizeChange} loading={list.query.isLoading} refreshing={list.query.isFetching && !list.query.isLoading}
      onRetry={() => void list.query.refetch()} error={list.error} emptyTitle={received ? "No priced quotations" : "No quotations waiting for prices"} />
    {pricing ? <VendorPricesDialog quotation={pricing} onClose={() => setPricing(null)} /> : null}
  </section>;
}
