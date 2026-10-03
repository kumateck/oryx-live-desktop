import { useMemo, useState, type ReactNode } from "react";
import { ArrowLeftRight, Clock, Gauge, PackageSearch, TriangleAlert, Truck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { reportsApi } from "@/shared/api/generated/reports";
import { BarList, DashboardCard, DashboardHeading, DashboardState, MetricGrid, MetricTile } from "@/shared/dashboard/dashboard-kit";
import { periodFilter, periodLabels, type Period } from "@/shared/dashboard/periods";
import { formatDateTime } from "@/shared/format/dates";
import { byShortfall, capacitySchema, dockSchema, expirySchema, freshnessSchema, movementSchema, quantityText, readList, receivingSchema, reorderSchema, summariseCapacity, summariseDockToStock, summariseExpiry,
  summariseMovements, summariseReceiving, summariseSwaps, summariseTransfers, swapSchema, transferSchema, type WarehouseScope } from "./lib/warehouse-kpis";
import { WarehouseScopeFilters } from "./warehouse-scope";

const api = reportsApi;
const context = { module: "Warehouse", subModule: "Dashboard" };
const windows: readonly Period[] = ["today", "week", "month"];
const percent = (value: number) => `${value.toFixed(1)}%`;

function PeriodSwitch({ label, value, onChange }: { label: string; value: Period; onChange: (period: Period) => void }) {
  return <div role="group" aria-label={label} className="flex gap-1">{windows.map((period) => <Button key={period} type="button" size="sm" variant={value === period ? "default" : "outline"} aria-pressed={value === period} onClick={() => onChange(period)}>{periodLabels[period]}</Button>)}</div>;
}
function Figure({ value, note }: { value: ReactNode; note: string }) { return <div><p className="text-2xl font-semibold">{value}</p><p className="text-xs text-muted-foreground">{note}</p></div>; }

/** The warehouse command centre: capacity, receiving, transfers, expiry risk, reorder alerts and swap requests. */
export function WarehouseDashboardPage() {
  const [scope, setScope] = useState<WarehouseScope>({});
  const [dockPeriod, setDockPeriod] = useState<Period>("week");
  const [swapPeriod, setSwapPeriod] = useState<Period>("week");
  const scoped = { ...context, ...scope };
  const capacity = api.useGetApiV1ReportWarehouseKpiCapacityUtilisationQuery(scoped);
  const dock = api.useGetApiV1ReportWarehouseKpiDockToStockQuery({ ...scoped, datePreset: periodFilter[dockPeriod] });
  // Transfers and movements are always counted over all time; transfers are not tied to one warehouse.
  const transfers = api.useGetApiV1ReportWarehouseKpiStockTransferFulfilmentQuery({ ...context, datePreset: periodFilter.all });
  const receiving = api.useGetApiV1ReportWarehouseKpiReceivingPipelineQuery(scoped);
  const expiry = api.useGetApiV1ReportWarehouseKpiExpiryRiskIndexQuery(scoped);
  const reorder = api.useGetApiV1ReportWarehouseKpiReorderAlertCountQuery(context);
  const swaps = api.useGetApiV1ReportWarehouseKpiSwapRequestActivityQuery({ ...scoped, datePreset: periodFilter[swapPeriod] });
  const movements = api.useGetApiV1ReportWarehouseKpiMaterialMovementCountQuery({ ...scoped, datePreset: periodFilter.all });
  const freshness = api.useGetApiV1ReportWarehouseKpiFreshnessQuery(scoped);
  const queries = [capacity, dock, transfers, receiving, expiry, reorder, swaps, movements, freshness];

  const warehouses = useMemo(() => readList(capacitySchema, capacity.data), [capacity.data]);
  const shelves = useMemo(() => summariseCapacity(warehouses), [warehouses]);
  const docking = useMemo(() => summariseDockToStock(readList(dockSchema, dock.data)), [dock.data]);
  const transfer = useMemo(() => summariseTransfers(readList(transferSchema, transfers.data)), [transfers.data]);
  const pipeline = useMemo(() => summariseReceiving(readList(receivingSchema, receiving.data)), [receiving.data]);
  const risk = useMemo(() => summariseExpiry(readList(expirySchema, expiry.data)), [expiry.data]);
  const alerts = useMemo(() => byShortfall(readList(reorderSchema, reorder.data)), [reorder.data]);
  const swap = useMemo(() => summariseSwaps(readList(swapSchema, swaps.data)), [swaps.data]);
  const moved = useMemo(() => summariseMovements(readList(movementSchema, movements.data)), [movements.data]);
  const sources = useMemo(() => readList(freshnessSchema, freshness.data), [freshness.data]);
  const critical = risk[0]?.batches ?? 0;
  const tile = (query: { isLoading: boolean; error?: unknown }) => ({ loading: query.isLoading, failed: Boolean(query.error) });

  return <article className="min-w-0 space-y-4">
    <DashboardHeading eyebrow="WAREHOUSE" title="Warehouse dashboard" description="Capacity, receiving, transfers, expiry risk and reorder alerts across the warehouses." queries={queries} actions={<WarehouseScopeFilters scope={scope} onChange={setScope} />} />
    <DashboardState queries={queries}>
      <MetricGrid columns="xl:grid-cols-6">
        <MetricTile label="Capacity in use" value={percent(shelves.utilisation)} note={`${shelves.occupiedShelves.toLocaleString()} of ${shelves.totalShelves.toLocaleString()} shelves`} icon={Gauge} tone={shelves.utilisation >= 90 ? "danger" : "none"} {...tile(capacity)} />
        <MetricTile label="Dock to stock" value={`${docking.averageHours.toFixed(1)} hrs`} note={`Average, ${periodLabels[dockPeriod].toLowerCase()}`} icon={Clock} {...tile(dock)} />
        <MetricTile label="Transfers issued" value={percent(transfer.fulfilment)} note={`${transfer.issued.toLocaleString()} of ${transfer.total.toLocaleString()} transfers`} icon={ArrowLeftRight} to="/warehouse/stock-transfer-requests" {...tile(transfers)} />
        <MetricTile label="Inbound" value={pipeline.total} note="In the receiving pipeline" icon={Truck} to="/warehouse/receiving-area" {...tile(receiving)} />
        <MetricTile label="Expiring within 30 days" value={critical} note="Batches" icon={TriangleAlert} tone={critical > 0 ? "danger" : "none"} to="/warehouse/about-to-expire-materials" {...tile(expiry)} />
        <MetricTile label="Reorder alerts" value={alerts.length} note="Materials below their level" icon={PackageSearch} tone={alerts.length > 0 ? "warning" : "none"} {...tile(reorder)} />
      </MetricGrid>
      <div className="grid gap-3 lg:grid-cols-2">
        <DashboardCard title="Capacity utilisation" note={`${warehouses.length} ${warehouses.length === 1 ? "warehouse" : "warehouses"} in scope`} query={capacity} empty={warehouses.length === 0} emptyMessage="No warehouse matches this scope.">
          <div className="grid grid-cols-3 gap-2"><Figure value={shelves.totalShelves.toLocaleString()} note="Total shelves" /><Figure value={shelves.occupiedShelves.toLocaleString()} note="Occupied" /><Figure value={shelves.availableShelves.toLocaleString()} note="Available" /></div>
          <div role="img" aria-label={`${percent(shelves.utilisation)} of shelves in use`} className="h-2 overflow-hidden rounded-full bg-muted"><div className={shelves.utilisation >= 90 ? "h-full bg-destructive" : "h-full bg-primary"} style={{ width: `${Math.min(100, shelves.utilisation)}%` }} /></div>
          <BarList share={false} format={percent} items={warehouses.slice(0, 6).map((item, index) => ({ label: item.warehouse ?? `Warehouse ${index + 1}`, note: `${item.department ?? "No department"} · ${item.occupiedShelves.toLocaleString()} of ${item.totalShelves.toLocaleString()} shelves`,
            value: item.utilisationPercentage, tone: item.utilisationPercentage >= 90 ? "danger" as const : "primary" as const }))} />
          {warehouses.length > 6 ? <p className="text-xs text-muted-foreground">Showing 6 of {warehouses.length} warehouses. Narrow the scope to see the others.</p> : null}
        </DashboardCard>
        <DashboardCard title="Receiving pipeline" note="Where inbound deliveries stand, from arrival to shelf." query={receiving} empty={pipeline.total === 0} emptyMessage="Nothing inbound in this scope.">
          <Figure value={pipeline.total.toLocaleString()} note="Total inbound" />
          <BarList items={[{ label: "Pending", value: pipeline.pending, tone: "warning" }, { label: "Arrived", value: pipeline.arrived }, { label: "Checked", value: pipeline.checked }, { label: "GRN generated", value: pipeline.grnGenerated },
            { label: "Distributed", value: pipeline.distributed, tone: "muted" }, { label: "Assigned to shelves", value: pipeline.assigned, tone: "success" }]} />
        </DashboardCard>
        <DashboardCard title="Dock-to-stock time" note="From arrival at the dock to being put on a shelf." query={dock} empty={docking.totalRecords === 0} action={<PeriodSwitch label="Dock-to-stock period" value={dockPeriod} onChange={setDockPeriod} />}>
          <div className="grid grid-cols-3 gap-2"><Figure value={`${docking.averageHours.toFixed(1)} hrs`} note="Average" />
            <Figure value={docking.medianHours === null ? "–" : `${docking.medianHours.toFixed(1)} hrs`} note={docking.medianHours === null ? "Median: choose one warehouse" : "Median"} /><Figure value={docking.totalRecords.toLocaleString()} note="Receipts measured" /></div>
        </DashboardCard>
        <DashboardCard title="Transfer fulfilment" note="Stock transfers over all time, across departments." query={transfers} empty={transfer.total === 0} emptyMessage="No stock transfers yet.">
          <Figure value={percent(transfer.fulfilment)} note={`${transfer.issued.toLocaleString()} of ${transfer.total.toLocaleString()} issued`} />
          <BarList items={[{ label: "Pending", value: transfer.pending, tone: "warning" }, { label: "Approved", value: transfer.approved }, { label: "Issued", value: transfer.issued, tone: "success" }, { label: "Rejected", value: transfer.rejected, tone: "danger" }]} />
        </DashboardCard>
        <DashboardCard title="Expiry risk index" note="Batches and quantities by how soon they expire." query={expiry} empty={risk.every((item) => item.batches === 0)} emptyMessage="No batch with an expiry date in this scope." action={critical > 0 ? <span className="rounded-full bg-destructive/10 px-2 py-0.5 text-xs font-medium text-destructive">{critical} critical</span> : undefined}>
          <BarList items={risk.map((item, index) => ({ label: item.label, value: item.batches, note: item.quantities.map((quantity) => quantityText(quantity.quantity, quantity.uom)).join(", ") || undefined, tone: (["danger", "warning", "primary", "success"] as const)[index] }))} format={(value) => `${value.toLocaleString()} ${value === 1 ? "batch" : "batches"}`} />
        </DashboardCard>
        <DashboardCard title="Reorder alerts" note="Materials below their reorder level, largest shortfall first." query={reorder} empty={alerts.length === 0} emptyMessage="No material is below its reorder level.">
          <ul className="divide-y text-sm">{alerts.slice(0, 8).map((item, index) => <li key={`${item.materialCode ?? "material"}-${item.department ?? ""}-${index}`} className="flex items-center justify-between gap-3 py-1.5">
            <span className="min-w-0"><span className="block break-words font-medium">{item.material ?? "Unnamed material"}</span><span className="block text-xs text-muted-foreground">{item.materialCode ?? "No code"} · {item.department ?? "No department"} · {quantityText(item.currentStock, item.uom)} in stock, reorder at {quantityText(item.reorderLevel, item.uom)}</span></span>
            <span className="shrink-0 font-semibold text-destructive">Short {quantityText(item.shortfall, item.uom)}</span></li>)}</ul>
          {alerts.length > 8 ? <p className="text-xs text-muted-foreground">Showing the 8 largest of {alerts.length}.</p> : null}
        </DashboardCard>
        <DashboardCard title="Swap requests" note={swap.period ?? periodLabels[swapPeriod]} query={swaps} empty={swap.total === 0} emptyMessage="No swap requests in this period." action={<PeriodSwitch label="Swap request period" value={swapPeriod} onChange={setSwapPeriod} />}>
          <Figure value={swap.total.toLocaleString()} note="Requests" />
          <BarList items={[{ label: "Pending", value: swap.pending, tone: "warning" }, { label: "Approved", value: swap.approved, tone: "success" }, { label: "Rejected", value: swap.rejected, tone: "danger" }]} />
        </DashboardCard>
        <DashboardCard title="Material movements" note={moved.period ?? "All time"} query={movements} empty={moved.totalMovements === 0} emptyMessage="No material movements in this scope.">
          <Figure value={moved.totalMovements.toLocaleString()} note="Movements" />
          <BarList items={[{ label: "New putaways", value: moved.newPutaways, tone: "success" }, { label: "Adjustments", value: moved.adjustments, tone: "warning" }]} />
        </DashboardCard>
      </div>
      <DashboardCard title="Data freshness" note="When each source behind these figures last changed." query={freshness} empty={sources.length === 0} emptyMessage="The server did not report its sources.">
        <div className="overflow-x-auto"><table className="w-full min-w-[28rem] text-sm"><thead><tr className="text-left text-xs text-muted-foreground"><th scope="col" className="py-1 font-medium">Source</th><th scope="col" className="py-1 text-right font-medium">Records</th><th scope="col" className="py-1 text-right font-medium">Last changed</th></tr></thead>
          <tbody className="divide-y">{sources.map((item, index) => <tr key={`${item.source ?? "source"}-${index}`}><th scope="row" className="py-1.5 text-left font-medium">{item.source ?? "Unnamed source"}</th><td className="py-1.5 text-right">{item.recordCount.toLocaleString()}</td><td className="py-1.5 text-right">{formatDateTime(item.lastChangedAt) ?? "Never"}</td></tr>)}</tbody></table></div>
      </DashboardCard>
    </DashboardState>
  </article>;
}
