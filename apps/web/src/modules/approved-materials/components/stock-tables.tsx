import { useMemo } from "react";
import { ClientDataTable, ServerDataTable, dataTableColumns, pageMeta, useServerTable } from "@/shared/datatable";
import { apiErrorMessage } from "@/shared/errors/api-error-message";
import { formatDate, formatDateTime, formatMonthYear } from "@/shared/format/dates";
import { toLargestUnit } from "@/shared/units/quantity";
import {
  useGetApiV1MaterialByMaterialIdBatchesV2AndDepartmentIdQuery, useGetApiV1MaterialByMaterialIdReservedQuery, useGetApiV1WarehouseBincardinformationByMaterialIdAndDepartmentIdQuery,
} from "../api/approved-material-api";
import { audit } from "../lib/approved-material-access";
import { binCardRowsSchema, reservedRowsSchema, shelfBatchRowsSchema, type BinCardRow, type ReservedRow, type ShelfBatchRow } from "../schemas/approved-material-schema";
import { ExpiryCell } from "./expiry-cell";

const quantity = (value: number, unit: string | null) => toLargestUnit(value, unit, "calculated")?.text ?? String(value);
const dash = <span className="text-muted-foreground">–</span>;
interface Props { materialId: string; departmentId: string }

const batchColumn = dataTableColumns<ShelfBatchRow>();
const batchColumns = batchColumn.columns([
  batchColumn.accessor((row) => row.batchNumber ?? "", { id: "batch", header: "Batch", cell: ({ row }) => row.original.batchNumber ?? dash }),
  batchColumn.accessor((row) => row.shelf ?? "", { id: "shelf", header: "Shelf", cell: ({ row }) => row.original.shelf ? <div><div className="font-medium">{row.original.shelf}</div>
    <div className="text-xs text-muted-foreground">{[row.original.rack, row.original.location, row.original.floor].filter(Boolean).join(" · ")}</div></div> : dash }),
  batchColumn.accessor("quantity", { header: "Quantity", size: 150, cell: ({ row }) => quantity(row.original.quantity, row.original.unit) }),
  batchColumn.accessor((row) => formatMonthYear(row.manufacturingDate) ?? "", { id: "made", header: "Manufactured", size: 150, cell: ({ row }) => formatMonthYear(row.original.manufacturingDate) ?? dash }),
  batchColumn.accessor((row) => row.expiryDate ?? "", { id: "expiry", header: "Expiry", size: 190, cell: ({ row }) => <ExpiryCell date={row.original.expiryDate} /> }),
  batchColumn.accessor((row) => formatDate(row.retestDate) ?? "", { id: "retest", header: "Retest", size: 150, cell: ({ row }) => formatDate(row.original.retestDate) ?? dash }),
]);

/** Where the material's approved stock sits: one row per batch per shelf. */
export function StockByBatchTable({ materialId, departmentId }: Props) {
  const table = useServerTable({ pageSize: 20, resetKey: materialId });
  const query = useGetApiV1MaterialByMaterialIdBatchesV2AndDepartmentIdQuery({ ...audit, materialId, departmentId, page: table.page, pageSize: table.pageSize });
  const rows = useMemo(() => { const parsed = shelfBatchRowsSchema.safeParse(query.data?.data ?? null); return parsed.success ? parsed.data : []; }, [query.data]);
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

const reservedColumn = dataTableColumns<ReservedRow>();
const reservedColumns = reservedColumn.columns([
  reservedColumn.accessor((row) => row.dateTime ?? "", { id: "schedule", header: "Schedule", cell: ({ row }) => <div className="min-w-0"><div className="font-medium">{row.original.schedule ?? "–"}</div>
    <div className="text-xs text-muted-foreground">{formatDateTime(row.original.dateTime) ?? "–"}</div></div> }),
  reservedColumn.accessor((row) => row.productName ?? "", { id: "product", header: "Reserved for", cell: ({ row }) => <div className="min-w-0"><div className="break-words font-medium">{row.original.productName ?? "–"}</div>
    <div className="text-xs text-muted-foreground">{row.original.productCode ?? "–"} · batch {row.original.productBatchNumber ?? "–"}</div></div> }),
  reservedColumn.accessor((row) => row.materialBatchNumber ?? "", { id: "batch", header: "Material batch", cell: ({ row }) => <div><div>{row.original.materialBatchNumber ?? "–"}</div>
    <div className="text-xs text-muted-foreground">AR {row.original.arNumber ?? "–"}</div></div> }),
  reservedColumn.accessor("reserved", { header: "Reserved", size: 140, cell: ({ row }) => <span className="font-medium">{quantity(row.original.reserved, row.original.unit)}</span> }),
  reservedColumn.accessor("balance", { header: "Balance after", size: 140, cell: ({ row }) => quantity(row.original.balance, row.original.unit) }),
  reservedColumn.accessor((row) => row.expiryDate ?? "", { id: "expiry", header: "Expiry", size: 190, cell: ({ row }) => <ExpiryCell date={row.original.expiryDate} /> }),
]);

/** Stock of the material set aside for production batches that have not drawn it yet. */
export function ReservedTable({ materialId, departmentId }: Props) {
  const query = useGetApiV1MaterialByMaterialIdReservedQuery({ ...audit, materialId, departmentId });
  const rows = useMemo(() => { const parsed = reservedRowsSchema.safeParse(query.data ?? null); return parsed.success ? parsed.data : []; }, [query.data]);
  return <ClientDataTable label="Reserved stock" columns={reservedColumns} rows={rows} getRowId={(row) => row.id} loading={query.isLoading}
    error={query.error ? apiErrorMessage(query.error) : null} onRetry={() => { void query.refetch(); }} fill={false} emptyTitle="Nothing is reserved" emptyDescription="Stock is reserved when a production batch is scheduled to use it." />;
}
