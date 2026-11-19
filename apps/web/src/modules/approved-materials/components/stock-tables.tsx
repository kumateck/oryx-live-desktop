import { StockBatchLocation } from "@/shared/warehouse/stock-batch-location";
import { rackShelfLocation } from "@/shared/warehouse/stock-location";
import { Link } from "react-router";
import { PermissionGuard } from "@/shared/auth/permission-guard";
import { useMemo } from "react";
import { ServerDataTable, dataTableColumns, pageMeta, useServerTable } from "@/shared/datatable";
import { apiErrorMessage } from "@/shared/errors/api-error-message";
import { formatDate, formatMonthYear } from "@/shared/format/dates";
import { toLargestUnit } from "@/shared/units/quantity";
import {
  useGetApiV1MaterialByMaterialIdBatchesV2AndDepartmentIdQuery, useGetApiV1MaterialByMaterialIdReservedQuery, useGetApiV1WarehouseBincardinformationByMaterialIdAndDepartmentIdQuery,
} from "../api/approved-material-api";
import { audit } from "../lib/approved-material-access";
import { binCardRowsSchema, reservedRowsSchema, shelfBatchRowsSchema, type BinCardRow, type ShelfBatchRow } from "../schemas/approved-material-schema";
import { groupReservedProducts } from "../lib/reserved-groups";
import { UnstartReservationRepair } from "./unstart-reservation-repair";
import { ReservedProductGroups } from "./reserved-product-groups";
import { ExpiryCell } from "./expiry-cell";

const quantity = (value: number, unit: string | null) => toLargestUnit(value, unit, "calculated")?.text ?? String(value);
const dash = <span className="text-muted-foreground">–</span>;
interface Props { materialId: string; departmentId: string }

const batchColumn = dataTableColumns<ShelfBatchRow>();
const batchColumns = batchColumn.columns([
  batchColumn.accessor((row) => row.batchNumber ?? "", { id: "batch", header: "Batch", cell: ({ row }) => <div>{row.original.batchNumber ?? dash}<StockBatchLocation locations={[rackShelfLocation(row.original.rack, row.original.shelf)]} />{row.original.batchId ? <PermissionGuard require={{ kind: "all", permissions: ["CanViewExpiredMaterials"] }}><Link className="block text-xs text-primary underline underline-offset-2" to={`/warehouse/expired-materials/${encodeURIComponent(row.original.batchId)}`}>Batch validity</Link></PermissionGuard> : null}</div> }),
  batchColumn.accessor((row) => row.shelf ?? "", { id: "shelf", header: "Shelf", cell: ({ row }) => row.original.shelf ? <div><div className="font-medium">{row.original.shelf}</div>
    <div className="text-xs text-muted-foreground">{[row.original.rack, row.original.location, row.original.floor].filter(Boolean).join(" · ")}</div></div> : dash }),
  batchColumn.accessor("quantity", { header: "Quantity", size: 150, cell: ({ row }) => row.original.warehouseQuantity != null && row.original.warehouseUnit ? quantity(row.original.warehouseQuantity, row.original.warehouseUnit) : quantity(row.original.quantity, row.original.unit) }),
  // Each row's share of the list's totals: free to use + reserved, or all of it expired or not released.
  batchColumn.accessor((row) => row.free ?? -1, { id: "free", header: "Free to use", size: 150, cell: ({ row }) => {
    const { stockState, free, stockUnit } = row.original;
    if (stockState === "Expired") return <span className="text-destructive">Expired</span>;
    if (stockState === "NotReleased") return <span className="text-destructive">Not released</span>;
    return free === null ? dash : <span className="font-medium">{quantity(free, stockUnit)}</span>; } }),
  batchColumn.accessor((row) => row.reserved ?? -1, { id: "reserved", header: "Reserved", size: 140, cell: ({ row }) =>
    row.original.reserved ? quantity(row.original.reserved, row.original.stockUnit) : dash }),
  batchColumn.accessor((row) => formatMonthYear(row.manufacturingDate) ?? "", { id: "made", header: "Manufactured", size: 150, cell: ({ row }) => formatMonthYear(row.original.manufacturingDate) ?? dash }),
  batchColumn.accessor((row) => row.effectiveExpiryDate ?? "", { id: "expiry", header: "Valid until", size: 190, cell: ({ row }) => <div><ExpiryCell date={row.original.effectiveExpiryDate} />{row.original.effectiveExpiryDate !== row.original.expiryDate ? <span className="text-xs text-muted-foreground">Retest extension · expiry {formatMonthYear(row.original.expiryDate) ?? "not recorded"}</span> : null}</div> }),
  batchColumn.accessor((row) => formatMonthYear(row.retestDate) ?? "", { id: "retest", header: "Retest", size: 150, cell: ({ row }) => formatMonthYear(row.original.retestDate) ?? dash }),
]);

/** Where the material's approved stock sits: one row per batch per shelf. */
export function StockByBatchTable({ materialId, departmentId }: Props) {
  const table = useServerTable({ pageSize: 20, resetKey: materialId });
  const query = useGetApiV1MaterialByMaterialIdBatchesV2AndDepartmentIdQuery({ ...audit, materialId, departmentId, page: table.page, pageSize: table.pageSize });
  const rows = useMemo(() => { const parsed = shelfBatchRowsSchema.safeParse(query.data?.data ?? null); return parsed.success ? parsed.data.filter((row) => row.quantity > 0) : []; }, [query.data]);
  const meta = pageMeta(query.data, table, rows.length);
  return <ServerDataTable label="Stock by batch" columns={batchColumns} rows={rows} getRowId={(row) => row.id} page={table.page} pageSize={table.pageSize} totalRows={meta.totalRows}
    onPageChange={table.onPageChange} onPageSizeChange={table.onPageSizeChange} loading={query.isLoading} refreshing={query.isFetching && !query.isLoading}
    error={query.error ? apiErrorMessage(query.error) : null} onRetry={() => { void query.refetch(); }} fill={false} emptyTitle="No stock on shelves" />;
}

const cardColumn = dataTableColumns<BinCardRow>();
const cardColumns = cardColumn.columns([
  cardColumn.accessor((row) => row.date ?? "", { id: "date", header: "Date", size: 130, cell: ({ row }) => formatDate(row.original.date) ?? dash }),
  cardColumn.display({ id: "reference", header: "Reference", cell: ({ row }) => <div className="min-w-0"><div className="break-words">{row.original.requisition ? `Requisition ${row.original.requisition}` : row.original.wayBill ? `Waybill ${row.original.wayBill}` : "No reference"}</div>
    <div className="text-xs text-muted-foreground">AR {row.original.arNumber ?? "–"}</div></div> }),
  cardColumn.display({ id: "source", header: "Supplied by", cell: ({ row }) => row.original.supplier || row.original.manufacturer ? <div className="min-w-0"><div className="break-words">{row.original.supplier ?? "–"}</div>
    <div className="break-words text-xs text-muted-foreground">Made by {row.original.manufacturer ?? "–"}</div></div> : dash }),
  cardColumn.display({ id: "batch", header: "Batch", cell: ({ row }) => <div className="min-w-0"><div>{row.original.batchNumber ?? "–"}</div>
    <div className="text-xs text-muted-foreground">{row.original.warehouse ?? "Warehouse not recorded"}</div></div> }),
  cardColumn.accessor("received", { header: "Received", size: 130, cell: ({ row }) => row.original.received ? quantity(row.original.received, row.original.unit) : dash }),
  cardColumn.accessor("issued", { header: "Issued", size: 130, cell: ({ row }) => row.original.issued ? quantity(row.original.issued, row.original.unit) : dash }),
  cardColumn.accessor("balance", { header: "Balance", size: 130, cell: ({ row }) => <span className="font-medium">{quantity(row.original.balance, row.original.unit)}</span> }),
  cardColumn.display({ id: "product", header: "Issued to", cell: ({ row }) => row.original.product ? <div className="min-w-0"><div className="break-words">{row.original.product}</div>
    <div className="text-xs text-muted-foreground">Batch {row.original.productBatch ?? "–"}</div></div> : dash }),
]);

/** Every receipt and issue of the material, with the balance after each. `search` comes from the page's header search. */
export function BinCardTable({ materialId, departmentId, search }: Props & { search: string }) {
  const table = useServerTable({ pageSize: 20, resetKey: `${materialId}:${search}` });
  const query = useGetApiV1WarehouseBincardinformationByMaterialIdAndDepartmentIdQuery({ module: "Warehouse", subModule: "Bin Card", materialId, departmentId, page: table.page, pageSize: table.pageSize, searchQuery: search });
  const rows = useMemo(() => { const parsed = binCardRowsSchema.safeParse(query.data?.data ?? null); return parsed.success ? parsed.data : []; }, [query.data]);
  const meta = pageMeta(query.data, table, rows.length);
  return <ServerDataTable label="Bin card" columns={cardColumns} rows={rows} getRowId={(row) => row.id} page={table.page} pageSize={table.pageSize} totalRows={meta.totalRows}
    onPageChange={table.onPageChange} onPageSizeChange={table.onPageSizeChange} loading={query.isLoading} refreshing={query.isFetching && !query.isLoading}
    error={query.error ? apiErrorMessage(query.error) : null} onRetry={() => { void query.refetch(); }} fill={false}
    emptyTitle={search.trim() ? "No entries match this search" : "No bin card entries"} />;
}

/** Stock of the material set aside for production batches that have not drawn it yet. */
export function ReservedTable({ materialId, departmentId, kind }: Props & { kind: 0 | 1 }) {
  const query = useGetApiV1MaterialByMaterialIdReservedQuery({ ...audit, materialId, departmentId });
  const rows = useMemo(() => { const parsed = reservedRowsSchema.safeParse(query.data ?? null); return parsed.success ? groupReservedProducts(parsed.data) : []; }, [query.data]);
  return <div className="space-y-3"><div className="flex flex-wrap items-center justify-between gap-3"><p className="text-sm text-muted-foreground">Grouped by product · expand a batch to see its allocations.</p>
    <UnstartReservationRepair key={materialId} materialId={materialId} kind={kind} /></div>
    <ReservedProductGroups rows={rows} loading={query.isLoading} error={query.error ? apiErrorMessage(query.error) : null}
    onRetry={() => { void query.refetch(); }} /></div>;
}
