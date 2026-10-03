import { useMemo, useState } from "react";
import { CalendarClock, TrendingDown, TriangleAlert, Wallet, Warehouse } from "lucide-react";
import { z } from "zod";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { identityApi } from "@/shared/api/generated/identity";
import { reportsApi } from "@/shared/api/generated/reports";
import { warehouseApi } from "@/shared/api/generated/warehouse";
import { BarList, DashboardCard, DashboardHeading, DashboardState, MetricGrid, MetricTile, type ReportQuery } from "@/shared/dashboard/dashboard-kit";
import { averageOf, compactNumber, count, list, percentText, plural, readReport, sumOf, text } from "@/shared/dashboard/report-values";
import { byShortfall, capacitySchema, expirySchema, expiryWindows, quantityText, reorderSchema, summariseExpiry } from "./lib/warehouse-kpis";

const api = reportsApi;
const context = { module: "Warehouse", subModule: "Inventory Command Centre" };
const ALL = "all";
// Money and quantities can arrive as text.
const amount = z.union([z.number(), z.string()]).nullish().transform((value) => { const parsed = typeof value === "number" ? value : Number.parseFloat(value ?? ""); return Number.isFinite(parsed) ? parsed : 0; });
export const valuationSchema = list(z.object({ warehouse: text, totalValue: amount }));
export const slowMovingSchema = list(z.object({ material: text, materialCode: text, batchNo: text, warehouse: text, daysSinceLastMove: z.number().nullish(), estValue: amount }));
const namesSchema = z.object({ data: z.array(z.object({ id: z.string().nullish(), name: z.string().nullish() })).nullish() });
const names = (data: unknown) => { const parsed = namesSchema.safeParse(data ?? {}); return (parsed.success ? parsed.data.data ?? [] : []).flatMap((item) => item.id ? [{ value: item.id, label: item.name?.trim() || "Unnamed" }] : []); };

export interface InventoryFilters { warehouseId?: string; departmentId?: string; expiryWindow?: 0 | 1 | 2 | 3; threshold: 90 | 180 | 365 }
const expiryOptions = [{ value: "0", label: "0–30 days" }, { value: "1", label: "31–60 days" }, { value: "2", label: "61–90 days" }, { value: "3", label: "Over 90 days" }];
const thresholdOptions = [{ value: "90", label: "Inactive 90+ days" }, { value: "180", label: "Inactive 180+ days" }, { value: "365", label: "Inactive 365+ days" }];
/** Batches expiring within 90 days: every window except the last. */
export const expiringSoon = (windows: ReturnType<typeof summariseExpiry>) => sumOf(windows.filter((item) => item.label !== expiryWindows[3]), (item) => item.batches);
/** 90% or more full is alarming, 75% or more worth watching. */
export const utilisationTone = (value: number) => value >= 90 ? "danger" as const : value >= 75 ? "warning" as const : "success" as const;

function FilterSelect({ label, value, all, options, onChange }: { label: string; value: string | undefined; all?: string; options: readonly { value: string; label: string }[]; onChange: (value: string | undefined) => void }) {
  return <Select value={value ?? ALL} onValueChange={(next) => onChange(next === ALL ? undefined : next)}><SelectTrigger aria-label={label} size="sm" className="w-full sm:w-44"><SelectValue placeholder={all} /></SelectTrigger>
    <SelectContent position="popper">{all ? <SelectItem value={ALL}>{all}</SelectItem> : null}{options.map((option) => <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>)}</SelectContent></Select>;
}
function InventoryFilterBar({ filters, onChange }: { filters: InventoryFilters; onChange: (filters: InventoryFilters) => void }) {
  const warehouses = warehouseApi.useGetApiV1WarehouseQuery({ page: 1, pageSize: 100, ...context });
  const departments = identityApi.useGetApiV1DepartmentQuery({ page: 1, pageSize: 100, ...context });
  const set = <K extends keyof InventoryFilters>(key: K, value: InventoryFilters[K] | undefined) => { const next = { ...filters }; if (value === undefined) delete next[key]; else next[key] = value; onChange(next); };
  return <div role="group" aria-label="Filters" className="flex flex-wrap items-center gap-2">
    <FilterSelect label="Warehouse" all="All warehouses" value={filters.warehouseId} options={names(warehouses.data)} onChange={(value) => set("warehouseId", value)} />
    <FilterSelect label="Department" all="All departments" value={filters.departmentId} options={names(departments.data)} onChange={(value) => set("departmentId", value)} />
    <FilterSelect label="Expiry window" all="All expiry windows" value={filters.expiryWindow?.toString()} options={expiryOptions} onChange={(value) => set("expiryWindow", value === undefined ? undefined : Number(value) as 0 | 1 | 2 | 3)} />
    <FilterSelect label="Inactivity" value={filters.threshold.toString()} options={thresholdOptions} onChange={(value) => set("threshold", Number(value ?? 90) as 90 | 180 | 365)} />
  </div>;
}

/** Inventory command centre: what stock is worth, what is at risk of expiring or sitting idle, and how full the shelves are. */
export function InventoryCommandCenterPage() {
  const [filters, setFilters] = useState<InventoryFilters>({ threshold: 90 });
  const warehouse = filters.warehouseId ? { warehouseId: filters.warehouseId } : {};
  const department = filters.departmentId ? { departmentId: filters.departmentId } : {};
  const capacityQuery = api.useGetApiV1ReportWarehouseKpiCapacityUtilisationQuery({ ...context, ...warehouse });
  const valuationQuery = api.useGetApiV1ReportWarehouseInventoryValuationSummaryQuery({ ...context, ...department });
  const expiryQuery = api.useGetApiV1ReportWarehouseKpiExpiryRiskIndexQuery({ ...context, ...warehouse, ...(filters.expiryWindow === undefined ? {} : { expiryWindow: filters.expiryWindow }) });
  const slowQuery = api.useGetApiV1ReportWarehouseSlowMovingInventoryQuery({ ...context, ...warehouse, ...department, threshold: filters.threshold });
  const reorderQuery = api.useGetApiV1ReportWarehouseKpiReorderAlertCountQuery(context);
  const queries = [capacityQuery, valuationQuery, expiryQuery, slowQuery, reorderQuery];

  const capacity = useMemo(() => [...readReport(capacitySchema, capacityQuery.data, [])].sort((a, b) => b.utilisationPercentage - a.utilisationPercentage), [capacityQuery.data]);
  const valuation = useMemo(() => [...readReport(valuationSchema, valuationQuery.data, [])].sort((a, b) => b.totalValue - a.totalValue), [valuationQuery.data]);
  const expiry = useMemo(() => summariseExpiry(readReport(expirySchema, expiryQuery.data, [])), [expiryQuery.data]);
  const slow = useMemo(() => [...readReport(slowMovingSchema, slowQuery.data, [])].sort((a, b) => b.estValue - a.estValue), [slowQuery.data]);
  const alerts = useMemo(() => byShortfall(readReport(reorderSchema, reorderQuery.data, [])), [reorderQuery.data]);
  const tile = (query: ReportQuery) => ({ loading: query.isLoading, failed: Boolean(query.error) });
  const soon = expiringSoon(expiry);

  return <article className="min-w-0 space-y-4">
    <DashboardHeading eyebrow="WAREHOUSE" title="Inventory command centre" description="Stock value, expiry risk, idle stock, reorder alerts and shelf utilisation." queries={queries} actions={<InventoryFilterBar filters={filters} onChange={setFilters} />} />
    <DashboardState queries={queries}>
      <MetricGrid columns="xl:grid-cols-5">
        <MetricTile label="Total inventory value" value={compactNumber(sumOf(valuation, (row) => row.totalValue))} note="Estimated value across all warehouses (GHS)" icon={Wallet} {...tile(valuationQuery)} />
        <MetricTile label="Estimated value at risk" value={compactNumber(sumOf(slow, (row) => row.estValue))} note={`Slow-moving stock, no movement in ${filters.threshold}+ days`} icon={TrendingDown} tone={slow.length > 0 ? "warning" : "none"} {...tile(slowQuery)} />
        <MetricTile label="Batches expiring soon" value={soon} note="Within the next 90 days" icon={CalendarClock} tone={soon > 0 ? "danger" : "none"} {...tile(expiryQuery)} />
        <MetricTile label="Average shelf utilisation" value={percentText(averageOf(capacity, (row) => row.utilisationPercentage))} note={`Across ${plural(capacity.length, "warehouse")}`} icon={Warehouse} {...tile(capacityQuery)} />
        <MetricTile label="Materials below reorder" value={alerts.length} note="In your department" icon={TriangleAlert} tone={alerts.length > 0 ? "warning" : "none"} {...tile(reorderQuery)} />
      </MetricGrid>
      <div className="grid gap-3 lg:grid-cols-2">
        <DashboardCard title="Inventory value by warehouse" note="The warehouses holding the most estimated stock value (GHS)." query={valuationQuery} empty={valuation.length === 0} emptyMessage="No valuation for this department.">
          <BarList share={false} format={compactNumber} items={valuation.slice(0, 8).map((row, index) => ({ label: row.warehouse ?? (index === 0 ? "Unassigned" : `Unassigned ${index + 1}`), value: row.totalValue }))} />
          {valuation.length > 8 ? <p className="text-xs text-muted-foreground">Showing the 8 largest of {valuation.length}.</p> : null}
        </DashboardCard>
        <DashboardCard title="Expiry risk" note="Batches by time remaining before expiry." query={expiryQuery} empty={expiry.every((item) => item.batches === 0)} emptyMessage="No batches in this expiry window.">
          <BarList share={false} items={expiry.filter((item) => item.batches > 0).map((item) => ({ label: item.label, value: item.batches, tone: item.label === expiryWindows[0] ? "danger" as const : item.label === expiryWindows[3] ? "success" as const : "warning" as const,
            note: item.quantities.map((quantity) => quantityText(quantity.quantity, quantity.uom)).join(", ") || undefined }))} />
        </DashboardCard>
      </div>
      <div className="grid gap-3 lg:grid-cols-3">
        <DashboardCard title="Slow-moving inventory" note="No stock movement, by estimated value at risk." query={slowQuery} empty={slow.length === 0} emptyMessage="No slow-moving stock for this threshold.">
          <div className="max-h-96 overflow-auto"><table className="w-full text-sm"><thead><tr className="text-left text-xs text-muted-foreground"><th scope="col" className="py-1 font-medium">Material</th><th scope="col" className="py-1 font-medium">Warehouse</th><th scope="col" className="py-1 text-right font-medium">Idle days</th><th scope="col" className="py-1 text-right font-medium">Est. value</th></tr></thead>
            <tbody className="divide-y">{slow.map((item, index) => <tr key={`${item.materialCode ?? "item"}-${item.batchNo ?? "batch"}-${index}`}><th scope="row" className="py-1.5 text-left font-medium break-words">{item.material ?? "–"}{item.batchNo ? <span className="block text-xs font-normal text-muted-foreground">{item.batchNo}</span> : null}</th>
              <td className="py-1.5">{item.warehouse ?? "–"}</td><td className="py-1.5 text-right">{item.daysSinceLastMove?.toLocaleString() ?? "–"}</td><td className="py-1.5 text-right whitespace-nowrap">{compactNumber(item.estValue)}</td></tr>)}</tbody></table></div>
        </DashboardCard>
        <DashboardCard title="Reorder alerts" note="Your department, largest shortfall first." query={reorderQuery} empty={alerts.length === 0} emptyMessage="No materials below reorder level.">
          <div className="max-h-96 overflow-auto"><table className="w-full text-sm"><thead><tr className="text-left text-xs text-muted-foreground"><th scope="col" className="py-1 font-medium">Material</th><th scope="col" className="py-1 text-right font-medium">Current</th><th scope="col" className="py-1 text-right font-medium">Reorder at</th><th scope="col" className="py-1 text-right font-medium">Shortfall</th></tr></thead>
            <tbody className="divide-y">{alerts.map((item, index) => <tr key={`${item.materialCode ?? "item"}-${index}`}><th scope="row" className="py-1.5 text-left font-medium break-words">{item.material ?? "–"}</th><td className="py-1.5 text-right whitespace-nowrap">{quantityText(item.currentStock, item.uom)}</td>
              <td className="py-1.5 text-right whitespace-nowrap">{quantityText(item.reorderLevel, item.uom)}</td><td className="py-1.5 text-right whitespace-nowrap font-semibold text-destructive">{quantityText(item.shortfall, item.uom)}</td></tr>)}</tbody></table></div>
        </DashboardCard>
        <DashboardCard title="Shelf utilisation" note="Occupied shelves as a share of capacity, by warehouse." query={capacityQuery} empty={capacity.length === 0} emptyMessage="No warehouse capacity recorded.">
          <BarList share={false} format={(value) => `${value.toFixed(0)}%`} items={capacity.map((item, index) => ({ label: item.warehouse ?? `Warehouse ${index + 1}`, value: item.utilisationPercentage, tone: utilisationTone(item.utilisationPercentage), note: `${item.occupiedShelves.toLocaleString()} / ${item.totalShelves.toLocaleString()} shelves` }))} />
        </DashboardCard>
      </div>
    </DashboardState>
  </article>;
}
