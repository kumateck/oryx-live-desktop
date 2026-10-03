import { useMemo, useState } from "react";
import { Boxes, ClipboardList, TriangleAlert, Users, Wrench } from "lucide-react";
import { z } from "zod";
import { reportsApi } from "@/shared/api/generated/reports";
import { BarList, DashboardCard, DashboardHeading, DashboardState, MetricGrid, MetricTile } from "@/shared/dashboard/dashboard-kit";
import { periodFilter, periodOptions, type Period } from "@/shared/dashboard/periods";

const { useGetApiV1ReportServicesDashboardQuery, useGetApiV1ReportGeneralInventoryDashboardQuery, useGetApiV1ReportItemsBelowReorderQuery } = reportsApi;
const count = z.number().nullish().transform((value) => typeof value === "number" && Number.isFinite(value) ? value : 0);
const text = z.string().nullish().transform((value) => value?.trim() || null);

const jobs = z.object({ pending: count, acknowledged: count, assigned: count, jobStarted: count, completed: count, sentToExternal: count, quotationReceived: count, contractorSelected: count, approved: count, cancelled: count });
export const servicesSchema = z.object({ totalServiceCount: count, totalContractorsCount: count, jobRequisitionCount: jobs.nullish() });
/** Every job requisition, whatever stage it is at. */
export const totalJobs = (value: z.infer<typeof jobs> | null | undefined) => value ? Object.values(value).reduce((sum, item) => sum + item, 0) : 0;

/** The service catalogue, the contractors, and where job requisitions stand. */
export function ServicesDashboardPage() {
  const [period, setPeriod] = useState<Period>("all");
  const query = useGetApiV1ReportServicesDashboardQuery({ module: "Services", subModule: "Dashboard", filter: periodFilter[period] });
  const data = useMemo(() => { const parsed = servicesSchema.safeParse(query.data ?? {}); return parsed.success ? parsed.data : null; }, [query.data]);
  const job = data?.jobRequisitionCount ?? null;
  const state = { loading: query.isLoading, failed: Boolean(query.error) };
  return <article className="min-w-0 space-y-4">
    <DashboardHeading eyebrow="SERVICES" title="Services dashboard" description="The service catalogue, contractor capacity, and the flow of job requisitions." queries={[query]} period={period} periods={periodOptions()} onPeriod={setPeriod} />
    <DashboardState queries={[query]}>
      <MetricGrid columns="xl:grid-cols-4">
        <MetricTile label="Services" value={data?.totalServiceCount ?? 0} note="In the service catalogue" icon={Wrench} {...state} />
        <MetricTile label="Contractors" value={data?.totalContractorsCount ?? 0} note="Registered contractors" icon={Users} {...state} />
        <MetricTile label="Job requisitions" value={totalJobs(job)} note="In this period" icon={ClipboardList} {...state} />
        <MetricTile label="Pending requisitions" value={job?.pending ?? 0} note="Not yet acknowledged" icon={ClipboardList} tone={(job?.pending ?? 0) > 0 ? "warning" : "none"} {...state} />
      </MetricGrid>
      <div className="grid gap-3 lg:grid-cols-2">
        <DashboardCard title="Active work" note="The stages before sourcing and completion." query={query}><BarList items={[{ label: "Pending", value: job?.pending ?? 0, tone: "warning" }, { label: "Acknowledged", value: job?.acknowledged ?? 0 }, { label: "Assigned", value: job?.assigned ?? 0 },
          { label: "Job started", value: job?.jobStarted ?? 0, tone: "success" }, { label: "Sent to an external contractor", value: job?.sentToExternal ?? 0, tone: "muted" }]} /></DashboardCard>
        <DashboardCard title="Sourcing and outcomes" note="External sourcing, approvals, and how requisitions ended." query={query}><BarList items={[{ label: "Quotation received", value: job?.quotationReceived ?? 0 }, { label: "Contractor selected", value: job?.contractorSelected ?? 0 },
          { label: "Approved", value: job?.approved ?? 0, tone: "success" }, { label: "Completed", value: job?.completed ?? 0, tone: "success" }, { label: "Cancelled", value: job?.cancelled ?? 0, tone: "danger" }]} /></DashboardCard>
      </div>
    </DashboardState>
  </article>;
}

export const storesSchema = z.object({ totalvendors: count, itemCounts: z.object({ total: count, generalSoreCount: count, equipmentStoreCount: count, itStoreCount: count, reagentStoreCount: count }).nullish(),
  itemStockRequisitions: z.object({ total: count, pendingCount: count, partialCount: count, completedCount: count }).nullish() });
const reorderSchema = z.array(z.object({ itemName: text, code: text, currentQuantity: count, reorderLevel: count })).nullish().transform((value) => value ?? []);
/** Current stock as a percentage of the reorder level; 0 when no level is set. */
export const reorderShare = (item: { currentQuantity: number; reorderLevel: number }) => item.reorderLevel > 0 ? Math.max(0, (item.currentQuantity / item.reorderLevel) * 100) : 0;

/** What the general stores hold, their requisitions and vendors, and what needs reordering. */
export function StoresDashboardPage() {
  const [period, setPeriod] = useState<Period>("week");
  const dashboard = useGetApiV1ReportGeneralInventoryDashboardQuery({ module: "Stores", subModule: "Dashboard", filter: periodFilter[period] });
  const reorder = useGetApiV1ReportItemsBelowReorderQuery({ module: "Stores", subModule: "Dashboard" });
  const data = useMemo(() => { const parsed = storesSchema.safeParse(dashboard.data ?? {}); return parsed.success ? parsed.data : null; }, [dashboard.data]);
  // The items furthest below their reorder level come first.
  const items = useMemo(() => { const parsed = reorderSchema.safeParse(reorder.data ?? []); return parsed.success ? [...parsed.data].sort((a, b) => reorderShare(a) - reorderShare(b)) : []; }, [reorder.data]);
  const state = { loading: dashboard.isLoading, failed: Boolean(dashboard.error) };
  const counts = data?.itemCounts;
  const requisitions = data?.itemStockRequisitions;
  return <article className="min-w-0 space-y-4">
    <DashboardHeading eyebrow="STORES" title="Stores dashboard" description="Items across the stores, requisitions, vendors, and reorder risk." queries={[dashboard, reorder]} period={period} periods={periodOptions()} onPeriod={setPeriod} />
    <DashboardState queries={[dashboard, reorder]}>
      <MetricGrid>
        <MetricTile label="Store items" value={counts?.total ?? 0} note="Across all stores" icon={Boxes} {...state} />
        <MetricTile label="Vendors" value={data?.totalvendors ?? 0} note="Registered vendors" icon={Users} {...state} />
        <MetricTile label="Stock requisitions" value={requisitions?.total ?? 0} note="In this period" icon={ClipboardList} {...state} />
        <MetricTile label="Below reorder level" value={items.length} note="Items to replenish" icon={TriangleAlert} tone={items.length > 0 ? "danger" : "none"} loading={reorder.isLoading} failed={Boolean(reorder.error)} />
      </MetricGrid>
      <div className="grid gap-3 lg:grid-cols-2">
        <DashboardCard title="Items by store" note="How items are spread across the stores." query={dashboard}><BarList items={[{ label: "General store", value: counts?.generalSoreCount ?? 0 }, { label: "Equipment store", value: counts?.equipmentStoreCount ?? 0, tone: "success" },
          { label: "IT store", value: counts?.itStoreCount ?? 0, tone: "muted" }, { label: "Reagent store", value: counts?.reagentStoreCount ?? 0, tone: "warning" }]} /></DashboardCard>
        <DashboardCard title="Stock requisitions" note="How far internal requisitions have been fulfilled." query={dashboard}><BarList items={[{ label: "Pending", value: requisitions?.pendingCount ?? 0, tone: "warning" }, { label: "Part fulfilled", value: requisitions?.partialCount ?? 0 },
          { label: "Completed", value: requisitions?.completedCount ?? 0, tone: "success" }]} /></DashboardCard>
      </div>
      <DashboardCard title="Reorder attention" note="Stock against each item's reorder level, lowest first." query={reorder} empty={items.length === 0} emptyMessage="No item is below its reorder level.">
        <ul className="divide-y text-sm">{items.slice(0, 8).map((item, index) => <li key={`${item.code ?? "item"}-${index}`} className="flex items-center justify-between gap-3 py-1.5">
          <span className="min-w-0"><span className="block break-words font-medium">{item.itemName ?? "Unnamed item"}</span><span className="block text-xs text-muted-foreground">{item.code ?? "No item code"} · {item.currentQuantity.toLocaleString()} in stock, reorder at {item.reorderLevel.toLocaleString()}</span></span>
          <span className="shrink-0 font-semibold text-destructive">{reorderShare(item).toFixed(0)}% of level</span></li>)}</ul>
        {items.length > 8 ? <p className="text-xs text-muted-foreground">Showing the 8 lowest of {items.length}.</p> : null}
      </DashboardCard>
    </DashboardState>
  </article>;
}
