import { useMemo } from "react";
import { z } from "zod";
import { Link, useNavigate, useParams, useSearchParams } from "react-router";
import { Eye, PackageOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { noteRowsSchema, shippersOf, useGetApiV1ProductionScheduleApprovedProductsByProductIdQuery, useGetApiV1ProductionScheduleApprovedProductsQuery, type TransferNote } from "@/modules/finished-goods-notes/notes";
import { productsApi } from "@/shared/api/generated/products";
import { warehouseApi } from "@/shared/api/generated/warehouse";
import { ClientDataTable, ServerDataTable, dataTableColumns, pageMeta, useServerTable } from "@/shared/datatable";
import { DetailGroup, DetailItem } from "@/shared/detail/detail-list";
import { Tabs, useTabParam, type TabItem } from "@/shared/detail/tabs";
import { TableMenu, TableMenuHeader } from "@/shared/actions";
import { apiErrorMessage } from "@/shared/errors/api-error-message";
import { formatDate, formatMonthYear } from "@/shared/format/dates";
import { PageHeader } from "@/shared/navigation/page-header";
import { KindSwitch } from "@/shared/reference-data/kind-switch";
import { RichTextView } from "@/shared/rich-text/rich-text-view";
import { usePageSearch } from "@/shared/search/page-search";
import { DetailPageSkeleton } from "@/shared/skeleton/page-skeletons";
import { PackQuantity } from "@/shared/packing/pack-quantity";
import { addSplits, formatShippers } from "@/shared/packing/packs";

export const approvedProductsPath = "/warehouse/approved-products";
export const approvedProductPackingPath = (id: string) => `${approvedProductsPath}/${id}/packing-style`;
const viewPermission = "CanViewApprovedProducts";
const audit = { module: "Warehouse", subModule: "Approved Products" } as const;
const { useGetApiV1ProductByProductIdQuery } = productsApi;
const { useGetApiV1WarehouseBincardinformationByProductIdProductQuery } = warehouseApi;
const text = z.string().nullish().transform((value) => value?.trim() || null);
const amount = z.number().nullish().transform((value) => typeof value === "number" && Number.isFinite(value) ? value : 0);

const productRows = z.array(z.object({ product: z.object({ id: z.string().nullish(), code: text, name: text, division: z.number().nullish() }).nullish(), totalQuantity: amount, totalRemainingQuantity: amount, totalLoose: amount })).nullish()
  .transform((value) => (value ?? []).flatMap((entry) => entry.product?.id ? [{ id: entry.product.id, code: entry.product.code, name: entry.product.name ?? "Unnamed product", division: entry.product.division ?? null, total: entry.totalQuantity, remaining: entry.totalRemainingQuantity, loose: entry.totalLoose }] : []));
type ApprovedProduct = z.infer<typeof productRows>[number];

/** What the store received of a set of transfers, and how that breaks into shippers and loose packs. */
export function receivedSummary(notes: readonly (Pick<TransferNote, "received" | "perShipper" | "packing" | "unit"> & Partial<Pick<TransferNote, "total" | "remaining">>)[]) {
  const totals = notes.reduce((sum, note) => { const split = shippersOf(note.received, note.perShipper); return { received: sum.received + note.received, shippers: sum.shippers + split.shippers, loose: sum.loose + split.loose }; }, { received: 0, shippers: 0, loose: 0 });
  // Each batch is split by its own shipper size, then the shippers and loose packs are added up.
  const of = (packs: (note: (typeof notes)[number]) => number) => ({ packs: notes.reduce((sum, note) => sum + packs(note), 0), split: addSplits(notes.map((note) => shippersOf(packs(note), note.perShipper))) });
  const transferred = of((note) => note.total ?? 0), remaining = of((note) => note.remaining ?? 0);
  // A product can be packed more than one way; the styles are listed rather than the first one assumed.
  return { ...totals, transferred, remaining, packings: [...new Set(notes.flatMap((note) => note.packing ? [`${note.packing}${note.perShipper ? ` (${note.perShipper} per shipper)` : ""}`] : []))], unit: notes[0]?.unit ?? null };
}

/** The packing columns of one product, read from its approved transfers. Each row reads its own, and the answers are cached. */
function PackingCell({ productId, part }: { productId: string; part: "packing" | "transferred" | "received" | "remaining" }) {
  const query = useGetApiV1ProductionScheduleApprovedProductsByProductIdQuery({ ...audit, productId });
  const summary = useMemo(() => { const parsed = noteRowsSchema.safeParse(query.data ?? []); return parsed.success ? receivedSummary(parsed.data) : null; }, [query.data]);
  if (query.isLoading) return <span className="inline-block h-4 w-16 animate-pulse rounded bg-muted" />;
  if (!summary) return <span className="text-muted-foreground">–</span>;
  if (part === "packing") return <span className="break-words">{summary.packings.join(", ") || "–"}</span>;
  if (part === "transferred") return <PackQuantity packs={summary.transferred.packs} split={summary.transferred.split} />;
  if (part === "remaining") return <PackQuantity packs={summary.remaining.packs} split={summary.remaining.split} className={summary.remaining.packs === 0 ? "text-destructive" : undefined} />;
  return <PackQuantity packs={summary.received} split={{ shippers: summary.shippers, loose: summary.loose }} />;
}

const column = dataTableColumns<ApprovedProduct>();
const columns = column.columns([
  column.accessor("name", { header: "Product", cell: ({ row }) => <div className="min-w-0"><div className="break-words font-medium">{row.original.name}</div><div className="text-xs text-muted-foreground">{row.original.code ?? "No code"}</div></div> }),
  column.display({ id: "packing", header: "Packing", cell: ({ row }) => <PackingCell productId={row.original.id} part="packing" /> }),
  column.display({ id: "transferred", header: "Transferred", size: 200, cell: ({ row }) => <PackingCell productId={row.original.id} part="transferred" /> }),
  column.display({ id: "received", header: "Received", size: 200, cell: ({ row }) => <PackingCell productId={row.original.id} part="received" /> }),
  column.display({ id: "remaining", header: "Remaining", size: 200, cell: ({ row }) => <PackingCell productId={row.original.id} part="remaining" /> }),
  column.display({ id: "actions", header: TableMenuHeader, size: 56, cell: ({ row }) => <TableMenu label={`Actions for ${row.original.name}`} items={[
    { id: "packing", label: "View packing style", icon: PackageOpen, require: viewPermission, to: approvedProductPackingPath(row.original.id) },
    { id: "open", label: "Open product", icon: Eye, require: viewPermission, to: `${approvedProductsPath}/${row.original.id}` },
  ]} /> }),
]);

/** Beta-lactam and non-beta-lactam products are made apart and listed apart, like foreign and local suppliers. */
type Division = 0 | 1;
const divisionLabels: Record<Division, string> = { 0: "Beta-lactam", 1: "Non-beta-lactam" };
const divisionTabs = [{ value: 0 }, { value: 1 }] as const;

/**
 * The division that is open, kept in the address as `?division=` so it survives reload. With none chosen,
 * a list holding only non-beta-lactam products (a production user sees only their own division) opens on that.
 */
function useDivision(rows: readonly ApprovedProduct[]) {
  const [params, setParams] = useSearchParams();
  const requested = params.get("division");
  const division: Division = requested === "1" ? 1 : requested === "0" ? 0
    : rows.some((row) => row.division === 1) && !rows.some((row) => row.division === 0) ? 1 : 0;
  const select = (next: Division) => setParams((current) => { const updated = new URLSearchParams(current); updated.set("division", String(next)); return updated; }, { replace: true });
  return { division, select };
}

/** Finished products the store holds, approved and ready to be packed for customers. */
export function ApprovedProductsPage() {
  const navigate = useNavigate();
  const search = usePageSearch("approved products");
  const query = useGetApiV1ProductionScheduleApprovedProductsQuery({ ...audit });
  const parsed = useMemo(() => query.data ? productRows.safeParse(query.data) : null, [query.data]);
  // The server sends every product at once, so the search narrows them here.
  const all = useMemo(() => parsed?.success ? parsed.data : [], [parsed]);
  const { division, select } = useDivision(all);
  const rows = useMemo(() => { const needle = search.trim().toLowerCase(); return all.filter((row) => (row.division === null || row.division === division) && (!needle || `${row.name} ${row.code ?? ""}`.toLowerCase().includes(needle))); }, [all, division, search]);
  return <section className="page-fill">
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div><p className="eyebrow">FG WAREHOUSE</p><h1 className="text-xl font-semibold">Approved products</h1></div>
      <KindSwitch tabs={divisionTabs} kind={division} onSelect={select} labels={divisionLabels} label="Division" />
    </div>
    <ClientDataTable label="Approved products" columns={columns} rows={rows} getRowId={(row) => row.id} fill loading={query.isLoading} refreshing={query.isFetching && !query.isLoading} onRetry={() => void query.refetch()}
      onRowOpen={(row) => void navigate(`${approvedProductsPath}/${row.id}`)} error={query.error ? apiErrorMessage(query.error) : parsed && !parsed.success ? "The server returned products the app could not read." : null}
      emptyTitle={search.trim() ? "No products match this search" : `No approved ${divisionLabels[division].toLowerCase()} products`} emptyDescription={search.trim() ? "Search by product name or code." : "A product appears here once a transfer from production is approved."} />
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
  stockColumn.accessor("total", { header: "Transferred", size: 190, cell: ({ row }) => <PackQuantity packs={row.original.total} perShipper={row.original.perShipper} /> }),
  stockColumn.accessor("received", { header: "Received", size: 190, cell: ({ row }) => <PackQuantity packs={row.original.received} perShipper={row.original.perShipper} /> }),
  stockColumn.accessor("remaining", { header: "Remaining", size: 190, cell: ({ row }) => <PackQuantity packs={row.original.remaining} perShipper={row.original.perShipper} /> }),
]);
const binRows = z.array(z.object({ id: z.string().nullish(), createdAt: z.string().nullish(), description: text, wayBill: text, arNumber: text, quantityReceived: amount, quantityIssued: amount, balanceQuantity: amount, uoM: z.object({ symbol: text }).nullish(),
  batch: z.object({ batchNumber: text, manufacturingDate: z.string().nullish(), expiryDate: z.string().nullish() }).nullish() })).nullish().transform((value) => (value ?? []).map((entry, index) => ({ ...entry, id: entry.id ?? `entry-${index}`, unit: entry.uoM?.symbol ?? null })));
type BinEntry = z.infer<typeof binRows>[number];
const binColumn = dataTableColumns<BinEntry>();
const binColumnsFor = (shipperSize: (batch: string | null | undefined) => number) => binColumn.columns([
  binColumn.accessor((row) => row.createdAt ?? "", { id: "date", header: "Date", size: 130, cell: ({ row }) => formatDate(row.original.createdAt) ?? "–" }),
  binColumn.accessor((row) => row.description ?? "", { id: "description", header: "Description", cell: ({ row }) => row.original.description ? <RichTextView html={row.original.description} className="text-sm" /> : "–" }),
  binColumn.display({ id: "batch", header: "Batch", size: 190, cell: ({ row }) => <div><div className="font-medium">{row.original.batch?.batchNumber ?? "–"}</div><div className="text-xs text-muted-foreground">Made {formatMonthYear(row.original.batch?.manufacturingDate) ?? "–"} · expires {formatMonthYear(row.original.batch?.expiryDate) ?? "–"}</div></div> }),
  binColumn.display({ id: "reference", header: "Reference", size: 190, cell: ({ row }) => <div><div>Waybill {row.original.wayBill ?? "–"}</div><div className="text-xs text-muted-foreground">AR {row.original.arNumber ?? "–"}</div></div> }),
  binColumn.display({ id: "movement", header: "Received and issued", size: 210, cell: ({ row }) => <div><div>In {formatShippers(shippersOf(row.original.quantityReceived, shipperSize(row.original.batch?.batchNumber)))}</div><div className="text-xs text-muted-foreground">Out {formatShippers(shippersOf(row.original.quantityIssued, shipperSize(row.original.batch?.batchNumber)))}</div></div> }),
  binColumn.accessor("balanceQuantity", { header: "Balance", size: 140, cell: ({ row }) => <PackQuantity packs={row.original.balanceQuantity} perShipper={shipperSize(row.original.batch?.batchNumber)} /> }),
]);

/** The bin card counts packs; each batch is split by the shipper size of its own transfer. */
function BinCard({ productId, stock }: { productId: string; stock: readonly TransferNote[] }) {
  const binColumns = useMemo(() => { const sizes = new Map(stock.map((note) => [note.batchNumber, note.perShipper])); return binColumnsFor((batch) => sizes.get(batch ?? null) ?? 0); }, [stock]);
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
  const packing = (product.packings ?? []).find((item) => item.isDefault)?.name ?? product.packings?.[0]?.name ?? product.packageStyle;
  return <article className="min-w-0 space-y-4">
    <PageHeader title={product.name ?? "Product"} crumbs={[{ label: "Approved products", to: approvedProductsPath }, { label: product.name ?? "Product" }]} />
    <p className="text-sm text-muted-foreground">{product.code ?? "No code"}</p>
    <div className="grid gap-3 lg:grid-cols-2">
      <DetailGroup title="General"><DetailItem label="Category" value={product.category?.name} /><DetailItem label="Package style" value={packing} /><DetailItem label="Label claim" value={product.labelClaim} /><DetailItem label="Filled weight" value={product.filledWeight} />
        <DetailItem label="Shelf life" value={product.shelfLife} /><DetailItem label="Storage" value={product.storageCondition} /><DetailItem label="Price per pack" value={typeof product.price === "number" ? product.price.toLocaleString() : null} /></DetailGroup>
      <DetailGroup title="Equipment"><DetailItem label="Name" value={product.equipment?.name} /><DetailItem label="Department" value={product.equipment?.department?.name} /><DetailItem label="Equipment number" value={product.equipment?.equipmentNumber} />
        <DetailItem label="Location" value={product.equipment?.location} /></DetailGroup>
    </div>
    <Tabs label="Product records" tabs={tabs} active={active} onSelect={select}>
      {active === "stock" ? <ClientDataTable label="Stock by batch" columns={stockColumns} rows={stock} getRowId={(row) => row.id} fill={false} loading={stockQuery.isLoading} onRetry={() => void stockQuery.refetch()} error={stockQuery.error ? apiErrorMessage(stockQuery.error) : null}
        emptyTitle="No approved batches" emptyDescription="Batches appear here once their transfer from production is approved." /> : <BinCard productId={id} stock={stock} />}
    </Tabs>
  </article>;
}
