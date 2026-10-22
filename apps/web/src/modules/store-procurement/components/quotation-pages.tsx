import { useMemo, useState } from "react";
import { HandCoins, Printer, Send } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogBody, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { ConfirmActionDialog, TableMenu, TableMenuHeader } from "@/shared/actions";
import { inventoryApi } from "@/shared/api/generated/inventory";
import { usePermissionAction } from "@/shared/auth/use-permission-action";
import { ServerDataTable, dataTableColumns, pageMeta, useServerTable } from "@/shared/datatable";
import { apiErrorMessage } from "@/shared/errors/api-error-message";
import { formatDate } from "@/shared/format/dates";
import { PrintPreviewDialog } from "@/shared/print/print-preview-dialog";
import { PrintFacts, PrintHeader, PrintTable, type PrintColumn } from "@/shared/print/print-sheet";
import { keys, procurementAudit, vendorQuotationPageSchema, vendorQuotationSchema, type VendorQuotation } from "../lib/procurement";

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

function PricesDialog({ quotation, onClose }: { quotation: VendorQuotation; onClose: () => void }) {
  const permission = usePermissionAction({ kind: "all", permissions: [keys.responsesView, keys.responseSend] });
  const [reread] = inventoryApi.useLazyGetApiV1ProcurementInventoryVendorQuotationByVendorQuotationIdQuery();
  const [receive, receiving] = inventoryApi.usePostApiV1ProcurementInventoryVendorQuotationByVendorQuotationIdReceiveMutation();
  const [prices, setPrices] = useState<Record<string, { price: string; per: string }>>(() =>
    Object.fromEntries(quotation.items.map((i) => [i.id, { price: i.price === null ? "" : String(i.price), per: i.priceUnit ?? i.unit }])));
  const [message, setMessage] = useState("");
  const problems = quotation.items.flatMap((i) => { const n = Number(prices[i.id]?.price ?? ""); return !prices[i.id]?.price.trim() || !Number.isFinite(n) || n <= 0 ? [i.id] : []; });
  const save = async () => {
    setMessage("");
    if (problems.length) { setMessage("Enter a price greater than zero for every item."); return; }
    const denied = permission.check();
    if (denied) { setMessage(denied); return; }
    const fresh = await reread({ ...procurementAudit, vendorQuotationId: quotation.id }, false);
    const current = fresh.data ? vendorQuotationSchema.safeParse(fresh.data) : null;
    if (!current?.success || current.data.received || current.data.items.length !== quotation.items.length) { setMessage("This quotation changed after you opened it. Close this and open it again."); return; }
    const result = await receive({ ...procurementAudit, vendorQuotationId: quotation.id,
      body: quotation.items.map((i) => ({ id: i.id, price: Number(prices[i.id]?.price), priceUoM: prices[i.id]?.per.trim() || null })) });
    if ("error" in result) { setMessage(apiErrorMessage(result.error)); return; }
    toast.success("Prices recorded", { description: "They are now in the price comparison." });
    onClose();
  };
  return <Dialog open onOpenChange={(open) => { if (!open && !receiving.isLoading) onClose(); }}>
    <DialogContent className="sm:max-w-3xl"><DialogHeader><DialogTitle>Prices from {quotation.vendor.name}</DialogTitle>
      <DialogDescription>Enter the unit price the vendor quoted for each item{quotation.vendor.currency ? `, in ${quotation.vendor.currency}` : ""}.</DialogDescription></DialogHeader>
      <form noValidate className="flex min-h-0 min-w-0 flex-1 flex-col gap-4" onSubmit={(event) => { event.preventDefault(); event.stopPropagation(); void save(); }}>
        <DialogBody><div className="max-w-full overflow-x-auto"><table className="w-full min-w-[36rem] text-left text-sm"><thead className="border-b text-xs text-muted-foreground"><tr>
          {["Item", "Quantity", "Unit price", "Priced per"].map((h) => <th key={h} scope="col" className="p-2">{h}</th>)}</tr></thead>
          <tbody>{quotation.items.map((i) => <tr key={i.id} className="border-b last:border-0"><td className="p-2"><div className="font-medium">{i.name}</div><div className="font-mono text-xs text-muted-foreground">{i.code}</div></td>
            <td className="p-2">{`${String(i.quantity)} ${i.unit}`.trim()}</td>
            <td className="p-2"><Input aria-label={`Unit price for ${i.name}`} inputMode="decimal" className="w-32" value={prices[i.id]?.price ?? ""} aria-invalid={problems.includes(i.id) && message ? true : undefined}
              onChange={(event) => setPrices((current) => ({ ...current, [i.id]: { price: event.target.value, per: current[i.id]?.per ?? "" } }))} /></td>
            <td className="p-2"><Input aria-label={`Priced per for ${i.name}`} className="w-28" value={prices[i.id]?.per ?? ""}
              onChange={(event) => setPrices((current) => ({ ...current, [i.id]: { price: current[i.id]?.price ?? "", per: event.target.value } }))} /></td></tr>)}</tbody></table></div>
          {message ? <p role="alert" className="mt-3 text-sm text-destructive">{message}</p> : null}</DialogBody>
        <DialogFooter><Button type="button" variant="outline" disabled={receiving.isLoading} onClick={onClose}>Cancel</Button>
          <Button type="submit" disabled={receiving.isLoading}>{receiving.isLoading ? <><Spinner />Saving…</> : "Record prices"}</Button></DialogFooter>
      </form></DialogContent></Dialog>;
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
    {pricing ? <PricesDialog quotation={pricing} onClose={() => setPricing(null)} /> : null}
  </section>;
}
