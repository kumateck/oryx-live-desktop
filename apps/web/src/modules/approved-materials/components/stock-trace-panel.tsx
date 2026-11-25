import { useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { KeyFact, KeyFacts } from "@/shared/detail/key-facts";
import { ServerDataTable, dataTableColumns, useServerTable } from "@/shared/datatable";
import { formatDateTime } from "@/shared/format/dates";
import { PrintButton } from "@/shared/print/print-button";
import { Skeleton } from "@/shared/skeleton/skeleton";
import { useAccess } from "@/shared/auth/use-access";
import { stockPrintPermissions } from "../lib/approved-material-access";
import { useStockPeriod } from "../hooks/use-stock-period";
import { useStockTrace } from "../hooks/use-stock-trace";
import { stockTraceLabels, stockTraceStates, type StockTrace, type StockTraceRow } from "../schemas/stock-trace";
import { traceQuantity } from "./stock-trace-print";
import { StockReportPreview } from "./stock-report-preview";

export type StockTraceView = "reconciliation" | "floor" | "consumed";
const titles: Record<StockTraceView, string> = { reconciliation: "Stock reconciliation", floor: "On production floor", consumed: "Consumed stock" };
const column = dataTableColumns<StockTraceRow>();
const columns = column.columns([
  column.accessor("state", { header: "Position", size: 160, cell: ({ row }) => stockTraceLabels[row.original.state] }),
  column.accessor("materialBatchNumber", { header: "Material lot / location", cell: ({ row }) => <div className="min-w-0"><div>{row.original.materialBatchNumber ?? "Lot not recorded"}</div><div className="break-words text-xs text-muted-foreground">{[row.original.warehouse, row.original.shelf].filter(Boolean).join(" · ")}</div></div> }),
  column.accessor("quantity", { header: "Quantity", size: 140, cell: ({ row }) => <span className="font-medium tabular-nums">{traceQuantity(row.original.quantity, row.original.unit)}</span> }),
  column.display({ id: "trace", header: "Reference / production batch", cell: ({ row }) => <div className="min-w-0 break-words"><div>{row.original.reference || "Reference not recorded"}</div><div className="text-xs text-muted-foreground">{[row.original.product, row.original.productBatchNumber].filter(Boolean).join(" · ")}</div></div> }),
  column.display({ id: "evidence", header: "Evidence", cell: ({ row }) => <div className="min-w-0 break-words"><div>{row.original.evidence}</div><div className="text-xs text-muted-foreground">{[formatDateTime(row.original.occurredAt), row.original.actor].filter(Boolean).join(" · ")}</div></div> }),
]);

function ReconciliationFacts({ data }: { data: StockTrace }) {
  const amount = (value: number) => traceQuantity(value, data.unit);
  return <div className="space-y-3">
    <KeyFacts>
      <KeyFact label="Opening store balance" value={amount(data.openingBalance)} />
      <KeyFact label="Receipts" value={amount(data.received)} />
      <KeyFact label="Outward movements" value={amount(data.issued)} />
      <KeyFact label="Closing bin card" value={amount(data.ledgerClosing)} />
      <KeyFact label="On shelves" value={amount(data.storeStock)} />
      <KeyFact label="Reserved on shelves" value={amount(data.reservedStock)} />
      <KeyFact label="Free on shelves" value={amount(data.freeStock)} />
      <KeyFact label="Expired / unavailable" value={amount(data.expiredStock + data.unavailableStock)} />
      <KeyFact label="On production floor" value={amount(data.productionFloorStock)} />
      <KeyFact label="Confirmed consumed" value={amount(data.consumedStock)} />
      <KeyFact label="Awaiting shelf receipt" value={amount(data.inTransitStock)} />
      <KeyFact label="Bin card difference" value={amount(data.ledgerGap)} />
    </KeyFacts>
    <p className="text-sm text-muted-foreground">Opening + receipts − outward movements = closing bin card. Reserved stock stays on the shelves; it is included in shelf stock. Floor stock excludes recorded returns and confirmed consumption.</p>
  </div>;
}

export function StockTracePanel({ materialId, departmentId, kind, view, search }: { materialId: string; departmentId: string; kind: 0 | 1; view: StockTraceView; search: string }) {
  const [since, setSince] = useStockPeriod();
  const { has } = useAccess();
  const mayPrint = has(stockPrintPermissions[kind]);
  const query = useStockTrace(materialId, departmentId, kind, since);
  const data = query.data;
  const printMaterial = data ? { id: data.materialId, code: data.materialCode, name: data.materialName, kind, category: data.category, pharmacopoeia: data.pharmacopoeia } : null;
  const table = useServerTable({ pageSize: 20, resetKey: `${materialId}:${view}:${search}:${since}` });
  const rows = useMemo(() => {
    const words = search.toLowerCase().trim().split(/\s+/).filter(Boolean);
    return (query.data?.rows ?? []).filter((row) => (view === "reconciliation" || row.state === stockTraceStates[view])
      && words.every((word) => [row.materialBatchNumber, row.warehouse, row.shelf, row.reference, row.product, row.productBatchNumber, row.actor, row.evidence].join(" ").toLowerCase().includes(word)));
  }, [query.data, view, search]);
  const visible = rows.slice((table.page - 1) * table.pageSize, table.page * table.pageSize);
  return <div className="space-y-4">
    <div className="flex flex-wrap items-end justify-between gap-3">
      <div><h2 className="text-base font-semibold">{titles[view]}</h2><p className="text-xs text-muted-foreground">{query.data ? `Snapshot ${formatDateTime(query.data.generatedAt) ?? ""}` : "Current stock and recorded evidence"}</p></div>
      <div className="flex flex-wrap items-end gap-2">
        <label className="space-y-1 text-xs font-medium">Store balance period from<Input aria-label="Store balance period from" type="date" value={since} onChange={(event) => { if (event.target.value) setSince(event.target.value); }} className="h-8 w-40" /></label>
        {data && mayPrint && printMaterial ? <PrintButton label={view === "reconciliation" ? "Print reconciliation" : view === "floor" ? "Print production floor" : "Print consumed"} preview={(close) => <StockReportPreview material={printMaterial} departmentId={departmentId} view={view} search={search} onClose={close} />} /> : null}
      </div>
    </div>
    {query.error ? <div role="alert" className="flex flex-wrap items-center gap-2 text-sm"><p>{query.error}</p><Button variant="outline" size="sm" onClick={query.retry}>Retry</Button></div> : null}
    {query.loading ? <Skeleton className="h-40 w-full" /> : null}
    {query.data?.gaps.length ? <section role="alert" className="space-y-1 rounded-md border border-destructive/50 p-3 text-sm"><h3 className="font-semibold">Stock needs reconciliation</h3><ul className="list-disc space-y-1 pl-4">{query.data.gaps.map((gap) => <li key={gap}>{gap}</li>)}</ul></section> : null}
    {query.data && view === "reconciliation" ? <ReconciliationFacts data={query.data} /> : null}
    {query.data && view !== "reconciliation" ? <p className="text-sm">{view === "floor" ? "On the production floor" : "Confirmed consumed"}: <strong>{traceQuantity(view === "floor" ? query.data.productionFloorStock : query.data.consumedStock, query.data.unit)}</strong>. {view === "floor" ? "Issued movements less recorded returns and consumption." : "Only recorded consumption events are included."}</p> : null}
    <ServerDataTable label={titles[view]} columns={columns} rows={visible} getRowId={(row) => `${row.state}:${row.id}:${row.warehouse}`} page={table.page} pageSize={table.pageSize} totalRows={rows.length}
      onPageChange={table.onPageChange} onPageSizeChange={table.onPageSizeChange} loading={query.loading} fill={false} error={query.error} onRetry={query.retry}
      emptyTitle={search.trim() ? "No stock trace entries match this search" : view === "consumed" ? "No confirmed consumption recorded" : view === "floor" ? "No stock recorded on production floors" : "No stock trace entries"} />
  </div>;
}
