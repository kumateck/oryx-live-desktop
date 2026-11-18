import { ChevronDown } from "lucide-react";
import { ClientDataTable, dataTableColumns } from "@/shared/datatable";
import { StockBatchLocation } from "@/shared/warehouse/stock-batch-location";
import { rackShelfLocation } from "@/shared/warehouse/stock-location";
import { formatDateTime, formatMonthYear } from "@/shared/format/dates";
import { toLargestUnit } from "@/shared/units/quantity";
import type { ReservedBatchGroup, ReservedProductGroup, ReservedTotal } from "../lib/reserved-groups";
import type { ReservedRow } from "../schemas/approved-material-schema";
import { ExpiryCell } from "./expiry-cell";

function Totals({ totals }: { totals: readonly ReservedTotal[] }) {
  return <div className="space-y-1 tabular-nums">{totals.map(total => <div key={total.key}>
    {toLargestUnit(total.quantity, total.unit, "calculated")?.text ?? String(total.quantity)}
    {!total.unit ? <span className="ml-1 text-xs text-muted-foreground">(unit not recorded)</span> : null}
  </div>)}</div>;
}

const allocation = dataTableColumns<ReservedRow>();
const allocationColumns = allocation.columns([
  allocation.accessor(row => row.dateTime ?? "", { id: "reservedOn", header: "Reserved on", size: 165, cell: ({ row }) => formatDateTime(row.original.dateTime) ?? "–" }),
  allocation.accessor(row => row.materialBatchNumber ?? "", { id: "lot", header: "Material batch", cell: ({ row }) => <div className="min-w-0 break-words">
    <div>{row.original.materialBatchNumber ?? "Not recorded"}</div>
    <StockBatchLocation locations={[rackShelfLocation(row.original.rackName, row.original.shelfName)]} />
    <div className="text-xs text-muted-foreground">AR {row.original.arNumber ?? "–"}</div>
  </div> }),
  allocation.accessor("reserved", { header: "Reserved", size: 140, cell: ({ row }) => toLargestUnit(row.original.reserved, row.original.unit, "calculated")?.text ?? String(row.original.reserved) }),
  allocation.accessor("balance", { header: "Balance after", size: 140, cell: ({ row }) => toLargestUnit(row.original.balance, row.original.unit, "calculated")?.text ?? String(row.original.balance) }),
  allocation.accessor(row => row.effectiveExpiryDate ?? "", { id: "expiry", header: "Valid until", size: 190, cell: ({ row }) => <div>
    <ExpiryCell date={row.original.effectiveExpiryDate} />
    {row.original.effectiveExpiryDate !== row.original.expiryDate ? <span className="text-xs text-muted-foreground">Retest extension · expiry {formatMonthYear(row.original.expiryDate) ?? "not recorded"}</span> : null}
  </div> }),
]);

function ReservedBatch({ batch }: { batch: ReservedBatchGroup }) {
  return <details className="group min-w-0 rounded-md border" data-row-click="ignore">
    <summary className="flex cursor-pointer list-none items-start gap-2 p-3 focus-visible:outline-2 focus-visible:outline-ring">
      <ChevronDown aria-hidden className="mt-0.5 size-4 shrink-0 transition-transform group-open:rotate-180" />
      <div className="min-w-0 flex-1 break-words"><div className="font-medium">Batch {batch.batch ?? "not recorded"}</div>
        <div className="text-xs text-muted-foreground">{batch.schedule ?? "Schedule not recorded"} · {batch.rows.length} allocation(s)</div>
      </div>
      <div className="shrink-0 text-right font-medium"><Totals totals={batch.totals} /></div>
    </summary>
    <div className="min-w-0 border-t p-2">
      <ClientDataTable label={`Allocations for batch ${batch.batch ?? "not recorded"}`} columns={allocationColumns} rows={batch.rows} getRowId={row => row.id} fill={false} />
    </div>
  </details>;
}

const product = dataTableColumns<ReservedProductGroup>();
const reservedProductColumns = product.columns([
  product.accessor(row => row.productName ?? "", { id: "product", header: "Product", size: 230, cell: ({ row }) => <div className="min-w-0 break-words">
    <div className="font-medium">{row.original.productName ?? "Product not recorded"}</div>
    <div className="text-xs text-muted-foreground">{row.original.productCode ?? "Code not recorded"}</div>
  </div> }),
  product.display({ id: "batches", header: "Production batches", cell: ({ row }) => <div className="min-w-0 space-y-2">
    {row.original.batches.map(batch => <ReservedBatch key={batch.id} batch={batch} />)}
  </div> }),
  product.display({ id: "total", header: "Total reserved", size: 180, cell: ({ row }) => <div className="font-semibold"><Totals totals={row.original.totals} /></div> }),
]);

export function ReservedProductGroups({ rows, loading, error, onRetry }: { rows: readonly ReservedProductGroup[]; loading: boolean; error: string | null; onRetry: () => void }) {
  return <ClientDataTable label="Reserved stock by product" columns={reservedProductColumns} rows={rows} getRowId={row => row.id}
    loading={loading} error={error} onRetry={onRetry} fill={false} emptyTitle="Nothing is reserved"
    emptyDescription="Stock is reserved when a production batch is scheduled to use it." />;
}
