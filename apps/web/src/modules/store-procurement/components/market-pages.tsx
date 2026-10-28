import { useEffect, useMemo, useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { useNavigate, useParams, useSearchParams } from "react-router";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogBody, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Spinner } from "@/components/ui/spinner";
import { inventoryApi } from "@/shared/api/generated/inventory";
import { settingsApi } from "@/shared/api/generated/settings";
import { useAccess } from "@/shared/auth/use-access";
import { usePermissionAction } from "@/shared/auth/use-permission-action";
import { ServerDataTable, dataTableColumns, pageMeta, useServerTable } from "@/shared/datatable";
import { apiErrorMessage } from "@/shared/errors/api-error-message";
import { formatDate, formatDateTime } from "@/shared/format/dates";
import { Store, storeIds, storeValue, stores } from "@/shared/inventory/stores";
import { PageHeader } from "@/shared/navigation/page-header";
import { DetailPageSkeleton } from "@/shared/skeleton/page-skeletons";
import { keys, marketPageSchema, marketSchema, marketVendorPageSchema, money, paths, procurementAudit, type MarketRequisition } from "../lib/procurement";

const column = dataTableColumns<MarketRequisition>();

/** Items sent to the open market, waiting for quotes or already decided. */
export function MarketListPage() {
  const navigate = useNavigate();
  const [closed, setClosed] = useState(false);
  const table = useServerTable({ pageSize: 50, resetKey: String(closed) });
  const query = inventoryApi.useGetApiV1ProcurementInventoryMarketQuery({ ...procurementAudit, closed, page: table.page, pageSize: table.pageSize }, { refetchOnMountOrArgChange: 30 });
  const parsed = useMemo(() => query.data ? marketPageSchema.safeParse(query.data) : null, [query.data]);
  const rows = useMemo(() => parsed?.success ? parsed.data.data : [], [parsed]);
  const meta = pageMeta(query.data, table, rows.length);
  const columns = useMemo(() => column.columns([
    column.accessor("name", { header: "Item", cell: ({ row }) => <div><div className="font-medium">{row.original.name}</div><div className="font-mono text-xs text-muted-foreground">{row.original.code}</div></div> }),
    column.accessor((m) => m.requisitionCode ?? "", { id: "requisition", header: "Requisition", size: 150, cell: ({ row }) => row.original.requisitionCode ?? "–" }),
    column.accessor("quantity", { header: "Quantity", size: 120, cell: ({ row }) => `${String(row.original.quantity)} ${row.original.unit}`.trim() }),
    column.accessor("vendorCount", { header: "Quotes collected", size: 150 }),
    column.accessor("closed", { header: "Status", size: 130, cell: ({ row }) => <Badge variant={row.original.closed ? "default" : "outline"}>{row.original.closed ? "Vendor chosen" : "Collecting"}</Badge> }),
  ]), []);
  return <section className="page-fill">
    <header className="flex flex-wrap items-start justify-between gap-3"><div><p className="eyebrow">STORE PROCUREMENT</p><h1 className="text-xl font-semibold">Open market collection</h1>
      <p className="text-sm text-muted-foreground">Quotes gathered from open-market vendors for each item. Compare and choose them in the price comparison.</p></div>
      <div className="flex gap-2" role="group" aria-label="Status">
        <Button size="sm" variant={closed ? "outline" : "default"} aria-pressed={!closed} onClick={() => setClosed(false)}>Collecting</Button>
        <Button size="sm" variant={closed ? "default" : "outline"} aria-pressed={closed} onClick={() => setClosed(true)}>Vendor chosen</Button></div></header>
    <ServerDataTable label="Open market items" columns={columns} rows={rows} getRowId={(m) => m.id} page={table.page} pageSize={table.pageSize} totalRows={meta.totalRows}
      onPageChange={table.onPageChange} onPageSizeChange={table.onPageSizeChange} loading={query.isLoading} refreshing={query.isFetching && !query.isLoading} onRetry={() => void query.refetch()}
      onRowOpen={(m) => void navigate(`${paths.market}/${m.id}`)}
      error={query.error ? apiErrorMessage(query.error) : parsed && !parsed.success ? "The server returned items the app could not read." : null}
      emptyTitle={closed ? "No decided items" : "Nothing is being collected"} />
  </section>;
}

interface Quote { key: string; name: string; address: string; phone: string; price: string; payment: string; terms: string; delivery: string }
let quoteCounter = 0;
const newQuote = (): Quote => ({ key: `q-${String(++quoteCounter)}`, name: "", address: "", phone: "", price: "", payment: "", terms: "", delivery: "" });

function QuotesDialog({ market, existing, onClose }: { market: MarketRequisition; existing: readonly string[]; onClose: () => void }) {
  const permission = usePermissionAction({ kind: "all", permissions: [keys.marketSheetsView, keys.marketSheetCreate] });
  const collections = settingsApi.usePostApiV1CollectionMutation();
  const [loadCollections, collectionState] = collections;
  useEffect(() => { void loadCollections({ ...procurementAudit, body: ["TermsOfPayment"] }); }, [loadCollections]);
  const terms = (collectionState.data?.TermsOfPayment ?? []).flatMap((t) => t.id ? [{ value: t.id, label: t.name ?? "Unnamed terms" }] : []);
  const [create, creating] = inventoryApi.usePostApiV1ProcurementInventoryMarketVendorsMutation();
  const [quotes, setQuotes] = useState<Quote[]>([newQuote()]);
  const [message, setMessage] = useState("");
  const update = (key: string, change: Partial<Quote>) => setQuotes((current) => current.map((q) => q.key === key ? { ...q, ...change } : q));
  const problemOf = (q: Quote, all: readonly Quote[]) => {
    const name = q.name.trim().toLowerCase();
    if (!name) return "Enter the vendor's name.";
    if (existing.includes(name) || all.filter((o) => o.name.trim().toLowerCase() === name).length > 1) return "This vendor already has a quote for the item.";
    if (!q.phone.trim()) return "Enter the vendor's phone number.";
    const price = Number(q.price);
    if (!q.price.trim() || !Number.isFinite(price) || price <= 0) return "Enter a unit price greater than zero.";
    if (!q.terms) return "Choose the terms of payment.";
    return null;
  };
  const save = async () => {
    setMessage("");
    if (quotes.some((q) => problemOf(q, quotes))) { setMessage("Complete every quote first."); return; }
    const denied = permission.check();
    if (denied) { setMessage(denied); return; }
    const result = await create({ ...procurementAudit, domainEntitiesItemsRequisitionsCreateMarketRequisitionVendor: { marketRequisitionId: market.id, vendors: quotes.map((q) => ({
      vendorName: q.name.trim(), vendorAddress: q.address.trim() || null, vendorPhoneNumber: q.phone.trim(), pricePerUnit: Number(q.price),
      modeOfPayment: q.payment.trim() || null, termsOfPaymentId: q.terms, deliveryMode: q.delivery.trim() || null, complete: false })) } });
    if ("error" in result) { setMessage(apiErrorMessage(result.error)); return; }
    toast.success(quotes.length === 1 ? "Quote added" : `${String(quotes.length)} quotes added`);
    onClose();
  };
  return <Dialog open onOpenChange={(open) => { if (!open && !creating.isLoading) onClose(); }}>
    <DialogContent className="sm:max-w-5xl"><DialogHeader><DialogTitle>Add open-market quotes</DialogTitle>
      <DialogDescription>{market.name}: {`${String(market.quantity)} ${market.unit}`.trim()}. One row per vendor asked.</DialogDescription></DialogHeader>
      <form noValidate className="flex min-h-0 min-w-0 flex-1 flex-col gap-4" onSubmit={(event) => { event.preventDefault(); event.stopPropagation(); void save(); }}>
        <DialogBody className="space-y-3">{quotes.map((q, index) => { const problem = message ? problemOf(q, quotes) : null; const n = String(index + 1);
          return <fieldset key={q.key} className="grid gap-2 rounded-md border p-3 md:grid-cols-4">
            <legend className="px-1 text-xs text-muted-foreground">Vendor {n}</legend>
            <Input aria-label={`Vendor ${n} name`} placeholder="Vendor name" value={q.name} onChange={(e) => update(q.key, { name: e.target.value })} />
            <Input aria-label={`Vendor ${n} phone`} placeholder="Phone" value={q.phone} onChange={(e) => update(q.key, { phone: e.target.value })} />
            <Input aria-label={`Vendor ${n} unit price`} placeholder="Unit price" inputMode="decimal" value={q.price} onChange={(e) => update(q.key, { price: e.target.value })} />
            <Select value={q.terms} onValueChange={(value) => update(q.key, { terms: value })}><SelectTrigger aria-label={`Vendor ${n} terms of payment`}><SelectValue placeholder="Terms of payment" /></SelectTrigger>
              <SelectContent position="popper">{terms.map((t) => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}</SelectContent></Select>
            <Input aria-label={`Vendor ${n} address`} placeholder="Address" className="md:col-span-2" value={q.address} onChange={(e) => update(q.key, { address: e.target.value })} />
            <Input aria-label={`Vendor ${n} mode of payment`} placeholder="Mode of payment" value={q.payment} onChange={(e) => update(q.key, { payment: e.target.value })} />
            <div className="flex gap-2"><Input aria-label={`Vendor ${n} delivery mode`} placeholder="Delivery mode" value={q.delivery} onChange={(e) => update(q.key, { delivery: e.target.value })} />
              <Button type="button" size="icon" variant="ghost" aria-label={`Remove vendor ${n}`} disabled={quotes.length === 1} onClick={() => setQuotes((c) => c.filter((o) => o.key !== q.key))}><Trash2 /></Button></div>
            {problem ? <p role="alert" className="text-xs text-destructive md:col-span-4">{problem}</p> : null}
          </fieldset>; })}
          <Button type="button" size="sm" variant="outline" onClick={() => setQuotes((c) => [...c, newQuote()])}><Plus />Add vendor</Button>
          {message ? <p role="alert" className="text-sm text-destructive">{message}</p> : null}</DialogBody>
        <DialogFooter><Button type="button" variant="outline" disabled={creating.isLoading} onClick={onClose}>Cancel</Button>
          <Button type="submit" disabled={creating.isLoading}>{creating.isLoading ? <><Spinner />Saving…</> : "Save quotes"}</Button></DialogFooter>
      </form></DialogContent></Dialog>;
}

/** One open-market item and the quotes collected for it. */
export function MarketDetailPage() {
  const { id = "" } = useParams();
  const { can } = useAccess();
  const query = inventoryApi.useGetApiV1ProcurementInventoryMarketByIdQuery({ ...procurementAudit, id }, { skip: !id, refetchOnMountOrArgChange: true });
  const vendors = inventoryApi.useGetApiV1ProcurementInventoryMarketVendorsQuery({ ...procurementAudit, marketRequisitionId: id, page: 1, pageSize: 100 }, { skip: !id, refetchOnMountOrArgChange: true });
  const parsed = useMemo(() => query.data ? marketSchema.safeParse(query.data) : null, [query.data]);
  const quotes = useMemo(() => { const p = vendors.data ? marketVendorPageSchema.safeParse(vendors.data) : null; return p?.success ? p.data.data : []; }, [vendors.data]);
  const [adding, setAdding] = useState(false);
  const crumbs = [{ label: "Open market collection", to: paths.market }];
  if (query.isLoading) return <DetailPageSkeleton label="Loading item" />;
  if (query.error || !parsed?.success) return <article className="space-y-4"><PageHeader title="Open market item" crumbs={crumbs} />
    <p role="alert" className="text-sm text-destructive">{query.error ? apiErrorMessage(query.error) : "The server returned an item the app could not read."}</p></article>;
  const market = parsed.data;
  const canAdd = !market.closed && can({ kind: "all", permissions: [keys.marketSheetsView, keys.marketSheetCreate] });
  return <article className="min-w-0 space-y-4">
    <PageHeader title={market.name} crumbs={[...crumbs, { label: market.name }]} actions={canAdd ? <Button size="sm" onClick={() => setAdding(true)}><Plus />Add quotes</Button> : undefined} />
    <section aria-label="Item" className="grid gap-3 rounded-lg border bg-card p-4 sm:grid-cols-2 lg:grid-cols-4">
      <div><p className="text-xs text-muted-foreground">Code</p><p className="font-mono text-sm">{market.code}</p></div>
      <div><p className="text-xs text-muted-foreground">Quantity</p><p className="text-sm">{`${String(market.quantity)} ${market.unit}`.trim()}</p></div>
      <div><p className="text-xs text-muted-foreground">Requisition</p><p className="text-sm">{market.requisitionCode ?? "–"}</p></div>
      <div><p className="text-xs text-muted-foreground">Status</p><Badge variant={market.closed ? "default" : "outline"}>{market.closed ? "Vendor chosen" : "Collecting quotes"}</Badge></div>
    </section>
    <section aria-label="Quotes" className="space-y-2 rounded-lg border bg-card p-4"><h2 className="font-semibold">Quotes</h2>
      {vendors.error ? <p role="alert" className="text-sm text-destructive">{apiErrorMessage(vendors.error)}</p> : quotes.length === 0 ? <p className="text-sm text-muted-foreground">No quotes collected yet.</p>
        : <div className="max-w-full overflow-x-auto"><table className="w-full min-w-[48rem] text-left text-sm"><thead className="border-b text-xs text-muted-foreground"><tr>
          {["Vendor", "Unit price", "Total", "Payment", "Delivery", "Collected"].map((h) => <th key={h} scope="col" className="p-2">{h}</th>)}</tr></thead>
          <tbody>{quotes.map((q) => <tr key={q.id} className="border-b last:border-0"><td className="p-2"><div className="font-medium">{q.name}{q.complete ? <Badge className="ml-2">Chosen or closed</Badge> : null}</div>
            <div className="text-xs text-muted-foreground">{[q.phone, q.address].filter(Boolean).join(" · ") || "–"}</div></td>
            <td className="p-2">{money(q.price)}</td><td className="p-2">{money(q.price * market.quantity)}</td><td className="p-2">{[q.payment, q.terms].filter(Boolean).join(" · ") || "–"}</td>
            <td className="p-2">{q.delivery ?? "–"}</td><td className="p-2">{formatDate(q.createdAt) ?? "–"}</td></tr>)}</tbody></table></div>}
    </section>
    {adding ? <QuotesDialog market={market} existing={quotes.map((q) => q.name.trim().toLowerCase())} onClose={() => setAdding(false)} /> : null}
  </article>;
}

const ReceiptStatus = { Pending: 0, Approved: 1, Rejected: 2 } as const;
const receiptLabel = (s: number) => s === ReceiptStatus.Approved ? "Received into stock" : s === ReceiptStatus.Rejected ? "Rejected" : "In receiving";

interface PurchasedRow { id: string; item: string; code: string; memo: string; quantity: number; unit: string; status: number; createdAt: string | null; createdBy: string | null }
const purchasedColumn = dataTableColumns<PurchasedRow>();

/** What procurement has bought for each store and where each purchase is: in receiving, received, or rejected. */
export function PurchasedItemsPage() {
  const [params, setParams] = useSearchParams();
  const store = storeValue(params.get("storeType")) ?? Store.General;
  const [status, setStatus] = useState<number>(ReceiptStatus.Pending);
  const table = useServerTable({ pageSize: 50, resetKey: `${String(store)}|${String(status)}` });
  const query = inventoryApi.useGetApiV1ProcurementInventoryPurchasedItemsQuery({ ...procurementAudit, store, status: status as 0 | 1 | 2, page: table.page, pageSize: table.pageSize }, { refetchOnMountOrArgChange: 30 });
  // The published contract declares an array; the server returns a page.
  const page = query.data as unknown as { data?: unknown[]; pageIndex?: number; pageCount?: number; totalRecordCount?: number } | undefined;
  const rows = useMemo<PurchasedRow[]>(() => (page?.data ?? []).flatMap((raw) => {
    const r = raw as { id?: string; quantity?: number; status?: number; createdAt?: string; item?: { name?: string; code?: string; unitOfMeasure?: { symbol?: string; name?: string } }; memo?: { code?: string }; createdBy?: { firstName?: string; lastName?: string } };
    return r.id ? [{ id: r.id, item: r.item?.name ?? "Unnamed item", code: r.item?.code ?? "–", memo: r.memo?.code ?? "–", quantity: r.quantity ?? 0, unit: r.item?.unitOfMeasure?.symbol || r.item?.unitOfMeasure?.name || "",
      status: r.status ?? 0, createdAt: r.createdAt ?? null, createdBy: [r.createdBy?.firstName, r.createdBy?.lastName].filter(Boolean).join(" ") || null }] : [];
  }), [page]);
  const meta = pageMeta(page, table, rows.length);
  const columns = useMemo(() => purchasedColumn.columns([
    purchasedColumn.accessor("item", { header: "Item", cell: ({ row }) => <div><div className="font-medium">{row.original.item}</div><div className="font-mono text-xs text-muted-foreground">{row.original.code}</div></div> }),
    purchasedColumn.accessor("memo", { header: "Memo", size: 150 }),
    purchasedColumn.accessor("quantity", { header: "Quantity", size: 120, cell: ({ row }) => `${String(row.original.quantity)} ${row.original.unit}`.trim() }),
    purchasedColumn.accessor((r) => r.createdAt ?? "", { id: "paid", header: "Paid", size: 170, cell: ({ row }) => formatDateTime(row.original.createdAt) ?? "–" }),
    purchasedColumn.accessor((r) => r.createdBy ?? "", { id: "by", header: "Paid by", cell: ({ row }) => row.original.createdBy ?? "–" }),
    purchasedColumn.accessor("status", { header: "Where it is", size: 170, cell: ({ row }) => <Badge variant={row.original.status === ReceiptStatus.Approved ? "default" : row.original.status === ReceiptStatus.Rejected ? "destructive" : "outline"}>{receiptLabel(row.original.status)}</Badge> }),
  ]), []);
  return <section className="page-fill">
    <header className="flex flex-wrap items-start justify-between gap-3"><div><p className="eyebrow">STORE PROCUREMENT</p><h1 className="text-xl font-semibold">Purchased items</h1>
      <p className="text-sm text-muted-foreground">Paid memo items and whether the store has received them.</p></div>
      <div className="flex flex-wrap gap-2" role="group" aria-label="Where it is">{[ReceiptStatus.Pending, ReceiptStatus.Approved, ReceiptStatus.Rejected].map((s) =>
        <Button key={s} size="sm" variant={status === s ? "default" : "outline"} aria-pressed={status === s} onClick={() => setStatus(s)}>{receiptLabel(s)}</Button>)}</div></header>
    <nav aria-label="Stores" className="flex flex-wrap gap-2">{storeIds.map((s) => <Button key={s} size="sm" variant={s === store ? "default" : "outline"} aria-current={s === store ? "page" : undefined}
      onClick={() => setParams((p) => { p.set("storeType", String(s)); return p; })}>{stores[s]}</Button>)}</nav>
    <ServerDataTable label="Purchased items" columns={columns} rows={rows} getRowId={(r) => r.id} page={table.page} pageSize={table.pageSize} totalRows={meta.totalRows}
      onPageChange={table.onPageChange} onPageSizeChange={table.onPageSizeChange} loading={query.isLoading} refreshing={query.isFetching && !query.isLoading} onRetry={() => void query.refetch()}
      error={query.error ? apiErrorMessage(query.error) : null} emptyTitle="Nothing here" />
  </section>;
}
