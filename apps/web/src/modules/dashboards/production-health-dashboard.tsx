import { useMemo, useState } from "react";
import { ArrowRightLeft, BadgeCheck, CalendarCheck2, ChartNoAxesColumnIncreasing, ClipboardList, FileClock, FlaskConical, ListChecks, PackageCheck, TriangleAlert, Truck, Undo2 } from "lucide-react";
import { z } from "zod";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { identityApi } from "@/shared/api/generated/identity";
import { reportsApi } from "@/shared/api/generated/reports";
import { BarList, Breakdown, DashboardCard, DashboardHeading, DashboardState, MetricGrid, MetricTile, type ReportQuery } from "@/shared/dashboard/dashboard-kit";
import { periodOptions, periodRange, type Period } from "@/shared/dashboard/periods";
import { compactNumber, percentText, plural, readReport, sumOf } from "@/shared/dashboard/report-values";
import { toLargestUnit } from "@/shared/units/quantity";
import { adherenceSchema, atrSchema, averageAdherence, averageReturnRate, bmrRelease, bmrSchema, deliverySchema, fgtnApprovalSchema, oldestWait, outputSchema, pendingTransfers, requisitionPendingSchema, returnSchema, returnTone,
  scheduleFulfilment, snapshotSchema, yieldPerformance, yieldSchema } from "./lib/production-kpis";

const api = reportsApi;
const context = { module: "Production", subModule: "Dashboard" };
const ALL = "all";
const departmentsSchema = z.object({ data: z.array(z.object({ id: z.string().nullish(), name: z.string().nullish() })).nullish() });
const quantity = (value: number, uom: string | null) => { const shown = toLargestUnit(value, uom, "calculated"); return shown ? `${compactNumber(shown.value)} ${shown.unit}`.trim() : compactNumber(value); };
const tile = (query: ReportQuery) => ({ loading: query.isLoading, failed: Boolean(query.error) });

/** Chooses one production department, or all of them. */
function DepartmentFilter({ value, onChange }: { value: string | undefined; onChange: (value: string | undefined) => void }) {
  // 0 is the server's code for a production department.
  const query = identityApi.useGetApiV1DepartmentQuery({ page: 1, pageSize: 100, type: 0, ...context });
  const parsed = departmentsSchema.safeParse(query.data ?? {});
  const departments = (parsed.success ? parsed.data.data ?? [] : []).filter((item) => item.id);
  return <Select value={value ?? ALL} onValueChange={(next) => onChange(next === ALL ? undefined : next)}>
    <SelectTrigger aria-label="Department" size="sm" className="w-full sm:w-52"><SelectValue placeholder="All departments" /></SelectTrigger>
    <SelectContent position="popper"><SelectItem value={ALL}>All departments</SelectItem>{departments.map((item) => <SelectItem key={item.id!} value={item.id!}>{item.name?.trim() || "Unnamed"}</SelectItem>)}</SelectContent>
  </Select>;
}

/** Production health: schedules, output, yield, testing backlog, returns and what is waiting to move. */
export function ProductionHealthDashboardPage() {
  const [period, setPeriod] = useState<Period>("month");
  const [departmentId, setDepartmentId] = useState<string>();
  const range = useMemo(() => ({ ...context, ...periodRange(period), ...(departmentId ? { departmentId } : {}) }), [period, departmentId]);
  // The snapshot is always the signed-in user's department, today; the period and department do not narrow it.
  const snapshotQuery = api.useGetApiV1ReportProductionDashboardQuery(context);
  const adherenceQuery = api.useGetApiV1ReportKpiScheduleAdherenceQuery(range);
  const bmrQuery = api.useGetApiV1ReportKpiBmrReleaseRateQuery(range);
  const yieldQuery = api.useGetApiV1ReportKpiYieldPerformanceQuery(range);
  const outputQuery = api.useGetApiV1ReportKpiProductionOutputVolumeQuery(range);
  const atrQuery = api.useGetApiV1ReportKpiAtrTestingBacklogQuery(range);
  const returnQuery = api.useGetApiV1ReportKpiMaterialReturnRateQuery(range);
  const requisitionQuery = api.useGetApiV1ReportKpiStockRequisitionPendingQuery(range);
  const fgtnQuery = api.useGetApiV1ReportKpiFgtnPendingApprovalQuery(range);
  const deliveryQuery = api.useGetApiV1ReportKpiProductionOrderDeliveryStatusQuery(range);
  const queries = [snapshotQuery, adherenceQuery, bmrQuery, yieldQuery, outputQuery, atrQuery, returnQuery, requisitionQuery, fgtnQuery, deliveryQuery];

  const snapshot = useMemo(() => readReport(snapshotSchema, snapshotQuery.data, {}), [snapshotQuery.data]);
  const adherence = useMemo(() => readReport(adherenceSchema, adherenceQuery.data, []), [adherenceQuery.data]);
  const bmr = useMemo(() => bmrRelease(readReport(bmrSchema, bmrQuery.data, [])), [bmrQuery.data]);
  const yields = useMemo(() => yieldPerformance(readReport(yieldSchema, yieldQuery.data, [])), [yieldQuery.data]);
  const output = useMemo(() => [...readReport(outputSchema, outputQuery.data, [])].sort((a, b) => b.totalBatchCount - a.totalBatchCount), [outputQuery.data]);
  const atr = useMemo(() => [...readReport(atrSchema, atrQuery.data, [])].sort((a, b) => b.totalBacklog - a.totalBacklog), [atrQuery.data]);
  const returns = useMemo(() => [...readReport(returnSchema, returnQuery.data, [])].sort((a, b) => b.returnRatePercentage - a.returnRatePercentage), [returnQuery.data]);
  const requisitions = useMemo(() => readReport(requisitionPendingSchema, requisitionQuery.data, []), [requisitionQuery.data]);
  const approvals = useMemo(() => readReport(fgtnApprovalSchema, fgtnQuery.data, []), [fgtnQuery.data]);
  const delivery = useMemo(() => readReport(deliverySchema, deliveryQuery.data, []), [deliveryQuery.data]);
  const schedule = snapshot.productionScheduleReport, transfer = snapshot.stockTransferReport, requisition = snapshot.requisitionReport, shortages = snapshot.materialsBelowReorderLevel;
  const backlog = sumOf(atr, (row) => row.totalBacklog);

  return <article className="min-w-0 space-y-4">
    <DashboardHeading eyebrow="PRODUCTION" title="Production health" description="Schedules, output, yield, testing backlog and material flow across production." queries={queries} period={period} periods={periodOptions(["today", "week", "month"])} onPeriod={setPeriod}
      actions={<DepartmentFilter value={departmentId} onChange={setDepartmentId} />} />
    <DashboardState queries={queries}>
      <MetricGrid columns="xl:grid-cols-6">
        <MetricTile label="Schedule fulfilment" value={percentText(scheduleFulfilment(schedule))} note={`${plural(schedule?.completedScheduleCount ?? 0, "schedule")} completed`} icon={ListChecks} {...tile(snapshotQuery)} />
        <MetricTile label="Schedule adherence" value={percentText(averageAdherence(adherence))} note={`Across ${plural(adherence.length, "department")}`} icon={CalendarCheck2} {...tile(adherenceQuery)} />
        <MetricTile label="Batches packed" value={sumOf(output, (row) => row.totalBatchCount)} note={`${plural(output.length, "department")} reporting output`} icon={PackageCheck} {...tile(outputQuery)} />
        <MetricTile label="ATR testing backlog" value={backlog} note={`Oldest waiting ${plural(oldestWait(atr), "day")}`} icon={FlaskConical} tone={backlog > 0 ? "warning" : "none"} {...tile(atrQuery)} />
        <MetricTile label="Material return rate" value={percentText(averageReturnRate(returns))} note={`Across ${plural(returns.length, "department")}`} icon={Undo2} {...tile(returnQuery)} />
        <MetricTile label="Material shortage alerts" value={shortages.length} note="In your department" icon={TriangleAlert} tone={shortages.length > 0 ? "danger" : "none"} {...tile(snapshotQuery)} />
        <MetricTile label="Stock requisitions pending" value={sumOf(requisitions, (row) => row.inProgress)} note={`Across ${plural(requisitions.length, "department")}`} icon={ClipboardList} {...tile(requisitionQuery)} />
        <MetricTile label="FGTN pending approval" value={sumOf(approvals, (row) => row.pendingApproval)} note={`Across ${plural(approvals.length, "department")}`} icon={FileClock} {...tile(fgtnQuery)} />
        <MetricTile label="Order delivery status" value={sumOf(delivery, (row) => row.orderCount)} note={`${sumOf(delivery, (row) => row.delivered).toLocaleString()} delivered`} icon={Truck} {...tile(deliveryQuery)} />
        <MetricTile label="Stock transfers pending" value={pendingTransfers(transfer)} note="In progress or approved for issue" icon={ArrowRightLeft} {...tile(snapshotQuery)} />
        <MetricTile label="BMR release rate" value={percentText(bmr.rate)} note={`${bmr.issued.toLocaleString()} issued of ${bmr.total.toLocaleString()}`} icon={BadgeCheck} {...tile(bmrQuery)} />
        <MetricTile label="Yield performance" value={percentText(yields.rate)} note={`${plural(yields.batches, "completed batch", "completed batches")}`} icon={ChartNoAxesColumnIncreasing} {...tile(yieldQuery)} />
      </MetricGrid>
      <div className="grid gap-3 lg:grid-cols-2">
        <DashboardCard title="Schedule adherence by department" note="Completed production schedules, on time against delayed." query={adherenceQuery} empty={adherence.length === 0}>
          <ul className="space-y-3">{adherence.map((row, index) => <li key={`${row.department ?? "department"}-${index}`} className="space-y-1"><p className="text-sm font-medium">{row.department ?? "Unassigned"} <span className="font-normal text-muted-foreground">· {percentText(row.adherencePercentage)}</span></p>
            <BarList items={[{ label: "On time", value: row.onTime, tone: "success" }, { label: "Delayed", value: row.delayed, tone: "danger" }]} /></li>)}</ul>
        </DashboardCard>
        <DashboardCard title="Output volume by department" note="Batches packed, highest first." query={outputQuery} empty={output.length === 0}>
          <BarList share={false} items={output.map((row, index) => ({ label: row.department ?? (index === 0 ? "Unassigned" : `Unassigned ${index + 1}`), value: row.totalBatchCount }))} />
        </DashboardCard>
      </div>
      <DashboardCard title="Pipeline snapshot" note="Requisitions, schedules and stock transfers in progress in your department." query={snapshotQuery}>
        <div className="grid gap-4 sm:grid-cols-3">
          <div><h3 className="text-xs font-medium text-muted-foreground">Requisitions</h3><Breakdown total={(requisition?.newRequisitionsCount ?? 0) + (requisition?.pendingRequisitionsCount ?? 0) + (requisition?.sourcedRequisitionsCount ?? 0) + (requisition?.completedRequisitionsCount ?? 0)}
            rows={[["New", requisition?.newRequisitionsCount ?? 0], ["Pending", requisition?.pendingRequisitionsCount ?? 0], ["Sourced", requisition?.sourcedRequisitionsCount ?? 0], ["Completed", requisition?.completedRequisitionsCount ?? 0]]} /></div>
          <div><h3 className="text-xs font-medium text-muted-foreground">Production schedules</h3><Breakdown total={(schedule?.newScheduleCount ?? 0) + (schedule?.inProgressScheduleCount ?? 0) + (schedule?.delayedScheduleCount ?? 0) + (schedule?.completedScheduleCount ?? 0)}
            rows={[["New", schedule?.newScheduleCount ?? 0], ["In progress", schedule?.inProgressScheduleCount ?? 0], ["Delayed", schedule?.delayedScheduleCount ?? 0], ["Completed", schedule?.completedScheduleCount ?? 0]]} /></div>
          <div><h3 className="text-xs font-medium text-muted-foreground">Stock transfers</h3><Breakdown total={(transfer?.inProgressCount ?? 0) + (transfer?.approvedCount ?? 0) + (transfer?.issuedCount ?? 0) + (transfer?.rejectedCount ?? 0)}
            rows={[["In progress", transfer?.inProgressCount ?? 0], ["Approved", transfer?.approvedCount ?? 0], ["Issued", transfer?.issuedCount ?? 0], ["Rejected", transfer?.rejectedCount ?? 0]]} /></div>
        </div>
      </DashboardCard>
      <div className="grid gap-3 lg:grid-cols-3">
        <DashboardCard title="Materials below reorder level" note="Your department." query={snapshotQuery} empty={shortages.length === 0} emptyMessage="No materials below reorder level.">
          <table className="w-full text-sm"><thead><tr className="text-left text-xs text-muted-foreground"><th scope="col" className="py-1 font-medium">Material</th><th scope="col" className="py-1 text-right font-medium">Current</th><th scope="col" className="py-1 text-right font-medium">Reorder at</th></tr></thead>
            <tbody className="divide-y">{shortages.map((item, index) => <tr key={`${item.materialCode ?? "item"}-${index}`}><th scope="row" className="py-1.5 text-left font-medium break-words">{item.materialName ?? "–"}</th>
              <td className="py-1.5 text-right whitespace-nowrap text-destructive">{quantity(item.currentQuantity, item.uomSymbol)}</td><td className="py-1.5 text-right whitespace-nowrap">{quantity(item.reOrderLevel, item.uomSymbol)}</td></tr>)}</tbody></table>
        </DashboardCard>
        <DashboardCard title="ATR testing backlog" note="Analytical test requests waiting, by department." query={atrQuery} empty={atr.length === 0} emptyMessage="No backlog.">
          <table className="w-full text-sm"><thead><tr className="text-left text-xs text-muted-foreground"><th scope="col" className="py-1 font-medium">Department</th><th scope="col" className="py-1 text-right font-medium">Backlog</th><th scope="col" className="py-1 text-right font-medium">Testing</th><th scope="col" className="py-1 text-right font-medium">Oldest (days)</th></tr></thead>
            <tbody className="divide-y">{atr.map((item, index) => <tr key={`${item.department ?? "department"}-${index}`}><th scope="row" className="py-1.5 text-left font-medium">{item.department ?? "–"}</th><td className="py-1.5 text-right">{item.totalBacklog.toLocaleString()}</td><td className="py-1.5 text-right">{item.testing.toLocaleString()}</td><td className="py-1.5 text-right">{item.oldestWaitingDays.toLocaleString()}</td></tr>)}</tbody></table>
        </DashboardCard>
        <DashboardCard title="Material return rate" note="Returned against issued materials, by department." query={returnQuery} empty={returns.length === 0} emptyMessage="No returns in this period.">
          <table className="w-full text-sm"><thead><tr className="text-left text-xs text-muted-foreground"><th scope="col" className="py-1 font-medium">Department</th><th scope="col" className="py-1 text-right font-medium">Issued</th><th scope="col" className="py-1 text-right font-medium">Returned</th><th scope="col" className="py-1 text-right font-medium">Rate</th></tr></thead>
            <tbody className="divide-y">{returns.map((item, index) => { const tone = returnTone(item.returnRatePercentage); return <tr key={`${item.department ?? "department"}-${index}`}><th scope="row" className="py-1.5 text-left font-medium">{item.department ?? "–"}</th><td className="py-1.5 text-right">{compactNumber(item.totalIssuedQuantity)}</td><td className="py-1.5 text-right">{compactNumber(item.totalReturnedQuantity)}</td>
              <td className={`py-1.5 text-right font-semibold ${tone === "danger" ? "text-destructive" : tone === "warning" ? "text-amber-700 dark:text-amber-400" : "text-emerald-700 dark:text-emerald-400"}`}>{percentText(item.returnRatePercentage)}</td></tr>; })}</tbody></table>
        </DashboardCard>
      </div>
    </DashboardState>
  </article>;
}
