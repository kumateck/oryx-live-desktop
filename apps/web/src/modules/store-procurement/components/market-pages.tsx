import { MarketQuotesDialog } from "./market-quotes-dialog";
import { useEffect, useMemo, useState } from "react";
import { Plus } from "lucide-react";
import { useNavigate, useParams, useSearchParams } from "react-router";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { inventoryApi } from "@/shared/api/generated/inventory";
import { useAccess } from "@/shared/auth/use-access";
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
    {adding ? <MarketQuotesDialog market={market} existing={quotes.map((q) => q.name.trim().toLowerCase())} onClose={() => setAdding(false)} /> : null}
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
