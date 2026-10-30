import { useMemo } from "react";
import { z } from "zod";
import { Link, useNavigate, useParams } from "react-router";
import { Button } from "@/components/ui/button";
import { noteRowsSchema, useGetApiV1ProductionScheduleApprovedProductsByProductIdQuery, useGetApiV1ProductionScheduleApprovedProductsQuery, type TransferNote } from "@/modules/finished-goods-notes/notes";
import { productsApi } from "@/shared/api/generated/products";
import { warehouseApi } from "@/shared/api/generated/warehouse";
import { ClientDataTable, ServerDataTable, dataTableColumns, pageMeta, useServerTable } from "@/shared/datatable";
import { DetailGroup, DetailItem } from "@/shared/detail/detail-list";
import { Tabs, useTabParam, type TabItem } from "@/shared/detail/tabs";
import { apiErrorMessage } from "@/shared/errors/api-error-message";
import { formatDate, formatMonthYear } from "@/shared/format/dates";
import { PageHeader } from "@/shared/navigation/page-header";
import { RichTextView } from "@/shared/rich-text/rich-text-view";
import { usePageSearch } from "@/shared/search/page-search";
import { DetailPageSkeleton } from "@/shared/skeleton/page-skeletons";
import { toLargestUnit } from "@/shared/units/quantity";
import { addCounts, countText, emptyCount, fgCount, fgText, type FgCount } from "@/shared/packing/fg-quantity";

export const approvedProductsPath = "/warehouse/approved-products";
const audit = { module: "Warehouse", subModule: "Approved Products" } as const;
const { useGetApiV1ProductByProductIdQuery } = productsApi;
const { useGetApiV1WarehouseBincardinformationByProductIdProductQuery } = warehouseApi;
const text = z.string().nullish().transform((value) => value?.trim() || null);
const amount = z.number().nullish().transform((value) => typeof value === "number" && Number.isFinite(value) ? value : 0);
const show = (value: number, unit: string | null) => toLargestUnit(value, unit, "calculated")?.text ?? value.toLocaleString();

const productRows = z.array(z.object({ product: z.object({ id: z.string().nullish(), code: text, name: text }).nullish(), totalQuantity: amount, totalRemainingQuantity: amount, totalLoose: amount })).nullish()
  .transform((value) => (value ?? []).flatMap((entry) => entry.product?.id ? [{ id: entry.product.id, code: entry.product.code, name: entry.product.name ?? "Unnamed product", total: entry.totalQuantity, remaining: entry.totalRemainingQuantity, loose: entry.totalLoose }] : []));
type ApprovedProduct = z.infer<typeof productRows>[number];

type StockPart = "transferred" | "received" | "remaining";

/**
 * What a product's approved transfers add up to. The server holds yield; each transfer is converted to shippers
 * and loose packs with its own packing style, so loose packs from different batches are not counted as a full shipper.
 */
export function stockSummary(notes: readonly Pick<TransferNote, "total" | "received" | "remaining" | "perShipper" | "packing" | "layout">[]) {
  const add = (sum: FgCount, value: number, note: (typeof notes)[number]) => addCounts(sum, fgCount(value, note.layout) ?? emptyCount());
  const totals = notes.reduce((sum, note) => ({ transferred: add(sum.transferred, note.total, note), received: add(sum.received, note.received, note), remaining: add(sum.remaining, note.remaining, note) }),
    { transferred: emptyCount(), received: emptyCount(), remaining: emptyCount() });
  // A product can be packed more than one way; the styles are listed rather than the first one assumed.
  return { ...totals, baseName: notes[0]?.layout.baseName ?? null, packings: [...new Set(notes.flatMap((note) => note.packing ? [`${note.packing}${note.perShipper ? ` (${note.perShipper} per shipper)` : ""}`] : []))] };
}

/** One product's packing or stock, read from its approved transfers. Each row reads its own, and the answers are cached. */
function PackingCell({ productId, part, empty = false }: { productId: string; part: "packing" | StockPart; empty?: boolean }) {
  const query = useGetApiV1ProductionScheduleApprovedProductsByProductIdQuery({ ...audit, productId });
  const summary = useMemo(() => { const parsed = noteRowsSchema.safeParse(query.data ?? []); return parsed.success ? stockSummary(parsed.data) : null; }, [query.data]);
  if (query.isLoading) return <span className="inline-block h-4 w-16 animate-pulse rounded bg-muted" />;
  if (!summary) return <span className="text-muted-foreground">–</span>;
  if (part === "packing") return <span className="break-words">{summary.packings.join(", ") || "–"}</span>;
  return <span className={part === "transferred" ? undefined : empty ? "font-medium text-destructive" : "font-medium"}>{countText(summary[part], summary.baseName)}</span>;
}

const column = dataTableColumns<ApprovedProduct>();
const columns = column.columns([
  column.accessor("name", { header: "Product", cell: ({ row }) => <div className="min-w-0"><div className="break-words font-medium">{row.original.name}</div><div className="text-xs text-muted-foreground">{row.original.code ?? "No code"}</div></div> }),
  column.display({ id: "packing", header: "Packing", cell: ({ row }) => <PackingCell productId={row.original.id} part="packing" /> }),
  column.accessor("total", { header: "Transferred", size: 210, cell: ({ row }) => <PackingCell productId={row.original.id} part="transferred" /> }),
  column.display({ id: "received", header: "Received", size: 210, cell: ({ row }) => <PackingCell productId={row.original.id} part="received" /> }),
  column.accessor("remaining", { header: "Remaining", size: 210, cell: ({ row }) => <PackingCell productId={row.original.id} part="remaining" empty={row.original.remaining === 0} /> }),
]);

/** Finished products the store holds, approved and ready to be packed for customers. */
export function ApprovedProductsPage() {
  const navigate = useNavigate();
  const search = usePageSearch("approved products");
  const query = useGetApiV1ProductionScheduleApprovedProductsQuery({ ...audit });
  const parsed = useMemo(() => query.data ? productRows.safeParse(query.data) : null, [query.data]);
  // The server sends every product at once, so the search narrows them here.
  const rows = useMemo(() => { const needle = search.trim().toLowerCase(); return (parsed?.success ? parsed.data : []).filter((row) => !needle || `${row.name} ${row.code ?? ""}`.toLowerCase().includes(needle)); }, [parsed, search]);
  return <section className="page-fill">
    <div><p className="eyebrow">FG WAREHOUSE</p><h1 className="text-xl font-semibold">Approved products</h1></div>
    <ClientDataTable label="Approved products" columns={columns} rows={rows} getRowId={(row) => row.id} fill loading={query.isLoading} refreshing={query.isFetching && !query.isLoading} onRetry={() => void query.refetch()}
      onRowOpen={(row) => void navigate(`${approvedProductsPath}/${row.id}`)} error={query.error ? apiErrorMessage(query.error) : parsed && !parsed.success ? "The server returned products the app could not read." : null}
      emptyTitle={search.trim() ? "No products match this search" : "No approved products"} emptyDescription={search.trim() ? "Search by product name or code." : "A product appears here once a transfer from production is approved."} />
  </section>;
}

const productSchema = z.object({ id: z.string().nullish(), name: text, code: text, category: z.object({ name: text }).nullish(), packageStyle: text, labelClaim: text, filledWeight: text, shelfLife: text, storageCondition: text,
  baseQuantity: z.number().nullish(), fullBatchSize: z.number().nullish(), price: z.number().nullish(), baseUoM: z.object({ symbol: text }).nullish(), packings: z.array(z.object({ name: text, isDefault: z.boolean().nullish() })).nullish(),
  equipment: z.object({ name: text, equipmentNumber: text, location: text, capacityQuantity: z.number().nullish(), department: z.object({ name: text }).nullish() }).nullish() });
const stockColumn = dataTableColumns<TransferNote>();
const stockColumns = stockColumn.columns([
  stockColumn.accessor((row) => row.batchNumber ?? "", { id: "batch", header: "Batch", size: 170, cell: ({ row }) => <span className="font-medium">{row.original.batchNumber ?? "–"}</span> }),
  stockColumn.display({ id: "dates", header: "Manufactured and expiry", size: 200, cell: ({ row }) => <div><div>Made {formatMonthYear(row.original.made) ?? "–"}</div><div className="text-xs text-muted-foreground">Expires {formatMonthYear(row.original.expires) ?? "–"}</div></div> }),
  stockColumn.display({ id: "packing", header: "Packing", cell: ({ row }) => <div><div>{row.original.packing ?? "–"}</div><div className="text-xs text-muted-foreground">{row.original.perShipper ? `${row.original.perShipper} per shipper` : "No shipper size"}</div></div> }),
  stockColumn.accessor("total", { header: "Transferred", size: 190, cell: ({ row }) => fgText(row.original.total, row.original.layout) }),
  stockColumn.accessor("received", { header: "Received", size: 190, cell: ({ row }) => fgText(row.original.received, row.original.layout) }),
  stockColumn.accessor("remaining", { header: "Remaining", size: 190, cell: ({ row }) => <span className={row.original.remaining === 0 ? "font-medium text-destructive" : "font-medium"}>{fgText(row.original.remaining, row.original.layout)}</span> }),
]);
const binRows = z.array(z.object({ id: z.string().nullish(), createdAt: z.string().nullish(), description: text, wayBill: text, arNumber: text, quantityReceived: amount, quantityIssued: amount, balanceQuantity: amount, uoM: z.object({ symbol: text }).nullish(),
  batch: z.object({ batchNumber: text, manufacturingDate: z.string().nullish(), expiryDate: z.string().nullish() }).nullish() })).nullish().transform((value) => (value ?? []).map((entry, index) => ({ ...entry, id: entry.id ?? `entry-${index}`, unit: entry.uoM?.symbol ?? null })));
type BinEntry = z.infer<typeof binRows>[number];
const binColumn = dataTableColumns<BinEntry>();
const binColumns = binColumn.columns([
  binColumn.accessor((row) => row.createdAt ?? "", { id: "date", header: "Date", size: 130, cell: ({ row }) => formatDate(row.original.createdAt) ?? "–" }),
  binColumn.accessor((row) => row.description ?? "", { id: "description", header: "Description", cell: ({ row }) => row.original.description ? <RichTextView html={row.original.description} className="text-sm" /> : "–" }),
  binColumn.display({ id: "batch", header: "Batch", size: 190, cell: ({ row }) => <div><div className="font-medium">{row.original.batch?.batchNumber ?? "–"}</div><div className="text-xs text-muted-foreground">Made {formatMonthYear(row.original.batch?.manufacturingDate) ?? "–"} · expires {formatMonthYear(row.original.batch?.expiryDate) ?? "–"}</div></div> }),
  binColumn.display({ id: "reference", header: "Reference", size: 190, cell: ({ row }) => <div><div>Waybill {row.original.wayBill ?? "–"}</div><div className="text-xs text-muted-foreground">AR {row.original.arNumber ?? "–"}</div></div> }),
  binColumn.display({ id: "movement", header: "Received and issued", size: 210, cell: ({ row }) => <div><div>In {show(row.original.quantityReceived, row.original.unit)}</div><div className="text-xs text-muted-foreground">Out {show(row.original.quantityIssued, row.original.unit)}</div></div> }),
  binColumn.accessor("balanceQuantity", { header: "Balance", size: 140, cell: ({ row }) => <span className="font-medium">{show(row.original.balanceQuantity, row.original.unit)}</span> }),
]);

function BinCard({ productId }: { productId: string }) {
  const search = usePageSearch("the bin card");
  const table = useServerTable({ pageSize: 50, resetKey: search });
  const query = useGetApiV1WarehouseBincardinformationByProductIdProductQuery({ ...audit, productId, page: table.page, pageSize: table.pageSize, searchQuery: search });
  const parsed = useMemo(() => query.data ? binRows.safeParse(query.data.data ?? []) : null, [query.data]);
  const rows = parsed?.success ? parsed.data : [];
  const meta = pageMeta(query.data, table, rows.length);
  return <ServerDataTable label="Bin card" columns={binColumns} rows={rows} getRowId={(row) => row.id} page={table.page} pageSize={table.pageSize} totalRows={meta.totalRows} onPageChange={table.onPageChange} onPageSizeChange={table.onPageSizeChange} fill={false}
    loading={query.isLoading} refreshing={query.isFetching && !query.isLoading} onRetry={() => void query.refetch()} error={query.error ? apiErrorMessage(query.error) : parsed && !parsed.success ? "The server returned entries the app could not read." : null}
    emptyTitle="No bin card entries" emptyDescription="Receipts and issues of this product appear here." />;
}

type TabId = "stock" | "bin";
const tabs: TabItem<TabId>[] = [{ id: "stock", label: "Stock by batch" }, { id: "bin", label: "Bin card" }];
/** One approved product: what it is, the batches the store holds, and its bin card. */
export function ApprovedProductPage() {
  const { id = "" } = useParams();
  const productQuery = useGetApiV1ProductByProductIdQuery({ ...audit, productId: id }, { skip: !id });
  const stockQuery = useGetApiV1ProductionScheduleApprovedProductsByProductIdQuery({ ...audit, productId: id }, { skip: !id });
  const product = useMemo(() => { const parsed = productSchema.safeParse(productQuery.data ?? null); return parsed.success ? parsed.data : null; }, [productQuery.data]);
  const stock = useMemo(() => { const parsed = noteRowsSchema.safeParse(stockQuery.data ?? []); return parsed.success ? parsed.data : []; }, [stockQuery.data]);
  const [active, select] = useTabParam(tabs, "stock");
  if (productQuery.isLoading) return <DetailPageSkeleton label="Loading product" groups={3} />;
  if (!product) return <div role="alert" className="mx-auto max-w-md space-y-3 py-12 text-center">
    <h1 className="text-lg font-semibold">Product unavailable</h1><p className="text-sm text-muted-foreground">{productQuery.error ? apiErrorMessage(productQuery.error) : "The server returned a product the app could not read."}</p>
    <div className="flex justify-center gap-2"><Button size="sm" variant="outline" onClick={() => void productQuery.refetch()}>Retry</Button><Button asChild size="sm"><Link to={approvedProductsPath}>Approved products</Link></Button></div></div>;
  const unit = product.baseUoM?.symbol ?? null;
  const size = (value: number | null | undefined) => typeof value === "number" ? show(value, unit) : null;
  const packing = (product.packings ?? []).find((item) => item.isDefault)?.name ?? product.packings?.[0]?.name ?? product.packageStyle;
  return <article className="min-w-0 space-y-4">
    <PageHeader title={product.name ?? "Product"} crumbs={[{ label: "Approved products", to: approvedProductsPath }, { label: product.name ?? "Product" }]} />
    <p className="text-sm text-muted-foreground">{product.code ?? "No code"}</p>
    <div className="grid gap-3 lg:grid-cols-3">
      <DetailGroup title="General"><DetailItem label="Category" value={product.category?.name} /><DetailItem label="Package style" value={packing} /><DetailItem label="Label claim" value={product.labelClaim} /><DetailItem label="Filled weight" value={product.filledWeight} />
        <DetailItem label="Shelf life" value={product.shelfLife} /><DetailItem label="Storage" value={product.storageCondition} /></DetailGroup>
      <DetailGroup title="Batch and units"><DetailItem label="Base quantity" value={size(product.baseQuantity)} /><DetailItem label="Batch size" value={size(product.fullBatchSize)} /><DetailItem label="Price" value={typeof product.price === "number" ? product.price.toLocaleString() : null} /></DetailGroup>
      <DetailGroup title="Equipment"><DetailItem label="Name" value={product.equipment?.name} /><DetailItem label="Department" value={product.equipment?.department?.name} /><DetailItem label="Equipment number" value={product.equipment?.equipmentNumber} />
        <DetailItem label="Location" value={product.equipment?.location} /><DetailItem label="Capacity" value={size(product.equipment?.capacityQuantity)} /></DetailGroup>
    </div>
    <Tabs label="Product records" tabs={tabs} active={active} onSelect={select}>
      {active === "stock" ? <ClientDataTable label="Stock by batch" columns={stockColumns} rows={stock} getRowId={(row) => row.id} fill={false} loading={stockQuery.isLoading} onRetry={() => void stockQuery.refetch()} error={stockQuery.error ? apiErrorMessage(stockQuery.error) : null}
        emptyTitle="No approved batches" emptyDescription="Batches appear here once their transfer from production is approved." /> : <BinCard productId={id} />}
    </Tabs>
  </article>;
}
