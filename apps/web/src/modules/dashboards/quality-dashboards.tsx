import { useMemo, useState } from "react";
import { BadgeCheck, Beaker, Boxes, ClipboardCheck, ClipboardList, Factory, FileCheck, FileText, FlaskConical, PackageCheck, PackageSearch, TestTubes } from "lucide-react";
import { z } from "zod";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { identityApi } from "@/shared/api/generated/identity";
import { reportsApi } from "@/shared/api/generated/reports";
import { useCurrentUser } from "@/shared/auth/session-provider";
import { BarList, Breakdown, DashboardCard, DashboardHeading, DashboardState, MetricGrid, MetricTile, type ReportQuery } from "@/shared/dashboard/dashboard-kit";
import { periodRange } from "@/shared/dashboard/periods";
import { count, readReport } from "@/shared/dashboard/report-values";

const ALL = "all";
const periods = [{ value: "all", label: "All" }, { value: "week", label: "This week" }, { value: "month", label: "This month" }] as const;
type QualityPeriod = (typeof periods)[number]["value"];
type MaterialKind = 0 | 1;
const tile = (query: ReportQuery) => ({ loading: query.isLoading, failed: Boolean(query.error) });

export const qaSchema = z.object({ numberOfBmrRequests: count, numberOfPendingBmrRequests: count, numberOfApprovedBmrRequests: count, numberOfRejectBmrRequests: count, numberOfAnalyticalTestRequests: count, numberOfExpiredAnalyticalTestRequests: count,
  numberOfPendingApprovals: count, numberOfApprovals: count, numberOfRejectedApprovals: count, numberOfManufacturers: count, numberOfNewManufacturers: count, numberOfApprovedManufacturers: count, numberOfExpiredManufacturers: count,
  numberOfProducts: count, numberOfRawMaterials: count, numberOfPackingMaterials: count });
export const qcSchema = z.object({ numberOfStpRawMaterials: count, numberOfStpProducts: count, numberOfAnalyticalRawData: count, numberOfBatchTestCountRawMaterials: count, numberOfBatchTestPendingRawMaterials: count,
  numberOfBatchTestApprovedRawMaterials: count, numberOfBatchTestRejectedRawMaterials: count, numberOfPendingApprovals: count, numberOfApprovals: count, numberOfRejectedApprovals: count });
const rows = (data: unknown) => Array.isArray(data) ? data.length : 0;

/** Narrows the figures to raw or packaging materials. */
function MaterialKindFilter({ value, onChange }: { value: MaterialKind | undefined; onChange: (value: MaterialKind | undefined) => void }) {
  return <Select value={value?.toString() ?? ALL} onValueChange={(next) => onChange(next === ALL ? undefined : Number(next) as MaterialKind)}>
    <SelectTrigger aria-label="Material type" size="sm" className="w-full sm:w-48"><SelectValue /></SelectTrigger>
    <SelectContent position="popper"><SelectItem value={ALL}>All records</SelectItem><SelectItem value="0">Raw materials</SelectItem><SelectItem value="1">Packaging materials</SelectItem></SelectContent></Select>;
}
/** The request arguments both quality reports take: a date range (none for all time) and a material type. */
function useQualityArgs(module: string, period: QualityPeriod, materialKind: MaterialKind | undefined) {
  return useMemo(() => ({ module, subModule: "Dashboard", ...periodRange(period), ...(materialKind === undefined ? {} : { materialKind }) }), [module, period, materialKind]);
}

/** Quality assurance: BMR requests, analytical tests, approvals, manufacturers and what is under QA coverage. */
export function QaDashboardPage() {
  const [period, setPeriod] = useState<QualityPeriod>("month");
  const [materialKind, setMaterialKind] = useState<MaterialKind>();
  const query = reportsApi.useGetApiV1ReportQaDashboardQuery(useQualityArgs("Quality Assurance", period, materialKind));
  const data = useMemo(() => readReport(qaSchema, query.data, {}), [query.data]);
  const state = tile(query);
  const bmr = data.numberOfBmrRequests || data.numberOfPendingBmrRequests + data.numberOfApprovedBmrRequests + data.numberOfRejectBmrRequests;
  const approvals = data.numberOfPendingApprovals + data.numberOfApprovals + data.numberOfRejectedApprovals;
  const manufacturers = data.numberOfManufacturers || data.numberOfNewManufacturers + data.numberOfApprovedManufacturers + data.numberOfExpiredManufacturers;
  return <article className="min-w-0 space-y-4">
    <DashboardHeading eyebrow="QUALITY ASSURANCE" title="QA dashboard" description="Batch record review, analytical tests, approvals and manufacturer qualification." queries={[query]} period={period} periods={periods} onPeriod={setPeriod} actions={<MaterialKindFilter value={materialKind} onChange={setMaterialKind} />} />
    <DashboardState queries={[query]}>
      <MetricGrid columns="xl:grid-cols-6">
        <MetricTile label="BMR requests" value={bmr} note={`${data.numberOfPendingBmrRequests.toLocaleString()} pending review`} icon={FileCheck} {...state} />
        <MetricTile label="Analytical tests" value={data.numberOfAnalyticalTestRequests} note={`${data.numberOfExpiredAnalyticalTestRequests.toLocaleString()} expired`} icon={FlaskConical} {...state} />
        <MetricTile label="QA approvals" value={approvals} note={`${data.numberOfPendingApprovals.toLocaleString()} pending approval`} icon={BadgeCheck} {...state} />
        <MetricTile label="Manufacturers" value={manufacturers} note={`${data.numberOfApprovedManufacturers.toLocaleString()} approved`} icon={Factory} {...state} />
        <MetricTile label="Products" value={data.numberOfProducts} note="Product quality scope" icon={PackageCheck} {...state} />
        <MetricTile label="Materials" value={data.numberOfRawMaterials + data.numberOfPackingMaterials} note={`${data.numberOfRawMaterials.toLocaleString()} raw / ${data.numberOfPackingMaterials.toLocaleString()} packing`} icon={Boxes} {...state} />
      </MetricGrid>
      <DashboardCard title="QA workload and exceptions" note="Each workload against its rejected or expired records." query={query}>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">{([["BMR", data.numberOfBmrRequests, "Rejected", data.numberOfRejectBmrRequests], ["Analytical tests", data.numberOfAnalyticalTestRequests, "Expired", data.numberOfExpiredAnalyticalTestRequests],
          ["Approvals", data.numberOfApprovals, "Rejected", data.numberOfRejectedApprovals], ["Manufacturers", data.numberOfManufacturers, "Expired", data.numberOfExpiredManufacturers]] as const).map(([name, total, exception, exceptions]) =>
          <div key={name} className="space-y-1"><h3 className="text-xs font-medium text-muted-foreground">{name}</h3><BarList share={false} items={[{ label: "Total", value: total }, { label: exception, value: exceptions, tone: "danger" }]} /></div>)}</div>
      </DashboardCard>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <DashboardCard title="BMR requests" note="Batch manufacturing record review." query={query}><BarList items={[{ label: "Pending", value: data.numberOfPendingBmrRequests, tone: "warning" }, { label: "Approved", value: data.numberOfApprovedBmrRequests, tone: "success" }, { label: "Rejected", value: data.numberOfRejectBmrRequests, tone: "danger" }]} /></DashboardCard>
        <DashboardCard title="Approvals" note="QA approval decisions." query={query}><BarList items={[{ label: "Pending", value: data.numberOfPendingApprovals, tone: "warning" }, { label: "Approved", value: data.numberOfApprovals, tone: "success" }, { label: "Rejected", value: data.numberOfRejectedApprovals, tone: "danger" }]} /></DashboardCard>
        <DashboardCard title="Manufacturers" note="Manufacturer qualification state." query={query}><BarList items={[{ label: "New", value: data.numberOfNewManufacturers }, { label: "Approved", value: data.numberOfApprovedManufacturers, tone: "success" }, { label: "Expired", value: data.numberOfExpiredManufacturers, tone: "danger" }]} /></DashboardCard>
        <DashboardCard title="Materials" note="Material master coverage." query={query}><BarList items={[{ label: "Raw", value: data.numberOfRawMaterials }, { label: "Packing", value: data.numberOfPackingMaterials, tone: "success" }]} /></DashboardCard>
      </div>
      <div className="grid gap-3 lg:grid-cols-3">
        <DashboardCard title="Pending QA work" note="Items still waiting for QA review or decision." query={query}><Breakdown total={data.numberOfPendingBmrRequests + data.numberOfPendingApprovals}
          rows={[["Pending BMR requests", data.numberOfPendingBmrRequests], ["Pending approvals", data.numberOfPendingApprovals], ["Analytical tests", data.numberOfAnalyticalTestRequests], ["New manufacturers", data.numberOfNewManufacturers]]} /></DashboardCard>
        <DashboardCard title="Exception watch" note="Rejected or expired quality records." query={query}><Breakdown total={data.numberOfRejectBmrRequests + data.numberOfRejectedApprovals + data.numberOfExpiredAnalyticalTestRequests + data.numberOfExpiredManufacturers}
          rows={[["Rejected BMR requests", data.numberOfRejectBmrRequests], ["Rejected approvals", data.numberOfRejectedApprovals], ["Expired analytical tests", data.numberOfExpiredAnalyticalTestRequests], ["Expired manufacturers", data.numberOfExpiredManufacturers]]} /></DashboardCard>
        <DashboardCard title="Quality master scope" note="Products and materials under QA coverage." query={query}><Breakdown total={data.numberOfProducts + data.numberOfRawMaterials + data.numberOfPackingMaterials}
          rows={[["Products", data.numberOfProducts], ["Raw materials", data.numberOfRawMaterials], ["Packing materials", data.numberOfPackingMaterials], ["Approved manufacturers", data.numberOfApprovedManufacturers]]} /></DashboardCard>
      </div>
    </DashboardState>
  </article>;
}

const departmentsSchema = z.object({ data: z.array(z.object({ id: z.string().nullish(), name: z.string().nullish() })).nullish() });
/** Quality control: test procedures, raw data, batch tests, approvals and the backlogs waiting on the laboratory. */
export function QcDashboardPage() {
  const user = useCurrentUser();
  const [period, setPeriod] = useState<QualityPeriod>("month");
  const [materialKind, setMaterialKind] = useState<MaterialKind>();
  const [chosenDepartment, setChosenDepartment] = useState<string>();
  // Someone in a production department sees the inspection backlog of their own department only.
  const locked = user?.departmentType === 0;
  const departmentId = locked ? user?.departmentId ?? undefined : chosenDepartment;
  const args = useQualityArgs("Quality Control", period, materialKind);
  const dashboard = reportsApi.useGetApiV1ReportQcDashboardQuery(args);
  const qa = reportsApi.useGetApiV1ReportQaDashboardQuery(args);
  const checklist = reportsApi.useGetApiV1ReportMaterialsReadyForChecklistQuery({ ...args, ...(departmentId ? { departmentId } : {}) }, { skip: !user });
  const assignment = reportsApi.useGetApiV1ReportMaterialsReadyForAssignmentQuery(args);
  const departmentQuery = identityApi.useGetApiV1DepartmentQuery({ page: 1, pageSize: 250, type: 0, module: "Quality Control", subModule: "Dashboard" }, { skip: !user || locked });
  const departments = useMemo(() => { const parsed = departmentsSchema.safeParse(departmentQuery.data ?? {});
    return (parsed.success ? parsed.data.data ?? [] : []).flatMap((item) => item.id && item.name ? [{ id: item.id, name: item.name }] : []).sort((a, b) => a.name.localeCompare(b.name)); }, [departmentQuery.data]);
  const queries = [dashboard, qa, checklist, assignment];
  const data = useMemo(() => readReport(qcSchema, dashboard.data, {}), [dashboard.data]);
  const tests = useMemo(() => readReport(qaSchema, qa.data, {}), [qa.data]);
  const state = tile(dashboard);
  const batchTests = data.numberOfBatchTestCountRawMaterials || data.numberOfBatchTestPendingRawMaterials + data.numberOfBatchTestApprovedRawMaterials + data.numberOfBatchTestRejectedRawMaterials;

  return <article className="min-w-0 space-y-4">
    <DashboardHeading eyebrow="QUALITY CONTROL" title="QC dashboard" description="Test procedures, raw data, batch tests, approvals and laboratory backlogs." queries={queries} period={period} periods={periods} onPeriod={setPeriod}
      actions={<><MaterialKindFilter value={materialKind} onChange={setMaterialKind} />
        <Select value={departmentId ?? ALL} disabled={locked} onValueChange={(next) => setChosenDepartment(next === ALL ? undefined : next)}><SelectTrigger aria-label="Department" size="sm" className="w-full sm:w-48"><SelectValue placeholder={locked ? user?.department ?? "Your department" : "All departments"} /></SelectTrigger>
          <SelectContent position="popper"><SelectItem value={ALL}>All departments</SelectItem>{locked && departmentId ? <SelectItem value={departmentId}>{user?.department ?? "Your department"}</SelectItem> : departments.map((item) => <SelectItem key={item.id} value={item.id}>{item.name}</SelectItem>)}</SelectContent></Select></>} />
    <DashboardState queries={queries}>
      <MetricGrid>
        <MetricTile label="Material STP" value={data.numberOfStpRawMaterials} note="Raw material test procedures" icon={FileText} {...state} />
        <MetricTile label="Product STP" value={data.numberOfStpProducts} note="Product test procedures" icon={ClipboardCheck} {...state} />
        <MetricTile label="Analytical raw data" value={data.numberOfAnalyticalRawData} note="ARD records captured" icon={FlaskConical} {...state} />
        <MetricTile label="Batch tests" value={batchTests} note={`${data.numberOfBatchTestPendingRawMaterials.toLocaleString()} pending`} icon={Beaker} {...state} />
        <MetricTile label="QC approvals" value={data.numberOfPendingApprovals + data.numberOfApprovals + data.numberOfRejectedApprovals} note={`${data.numberOfPendingApprovals.toLocaleString()} pending approval`} icon={BadgeCheck} {...state} />
        <MetricTile label="Analytical test requests" value={tests.numberOfAnalyticalTestRequests} note={`${tests.numberOfExpiredAnalyticalTestRequests.toLocaleString()} expired`} icon={TestTubes} {...tile(qa)} />
        <MetricTile label="Incoming inspection backlog" value={rows(checklist.data)} note="Materials ready for the QC checklist" icon={ClipboardList} {...tile(checklist)} />
        <MetricTile label="Putaway assignment backlog" value={rows(assignment.data)} note="Approved batches awaiting assignment" icon={PackageSearch} {...tile(assignment)} />
      </MetricGrid>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <DashboardCard title="QC workload overview" note="Record volume across STP, ARD, batch tests and approvals." query={dashboard}><BarList share={false} items={[{ label: "Material STP", value: data.numberOfStpRawMaterials }, { label: "Product STP", value: data.numberOfStpProducts },
          { label: "ARD", value: data.numberOfAnalyticalRawData }, { label: "Batch tests", value: data.numberOfBatchTestCountRawMaterials }, { label: "Approvals", value: data.numberOfApprovals }]} /></DashboardCard>
        <DashboardCard title="Batch tests" note="Material batch-test decisions." query={dashboard}><BarList items={[{ label: "Pending", value: data.numberOfBatchTestPendingRawMaterials, tone: "warning" }, { label: "Approved", value: data.numberOfBatchTestApprovedRawMaterials, tone: "success" }, { label: "Rejected", value: data.numberOfBatchTestRejectedRawMaterials, tone: "danger" }]} /></DashboardCard>
        <DashboardCard title="Approvals" note="QC approval decisions." query={dashboard}><BarList items={[{ label: "Pending", value: data.numberOfPendingApprovals, tone: "warning" }, { label: "Approved", value: data.numberOfApprovals, tone: "success" }, { label: "Rejected", value: data.numberOfRejectedApprovals, tone: "danger" }]} /></DashboardCard>
        <DashboardCard title="QC documents" note="STP and ARD record coverage." query={dashboard}><BarList items={[{ label: "Material STP", value: data.numberOfStpRawMaterials }, { label: "Product STP", value: data.numberOfStpProducts, tone: "success" }, { label: "ARD", value: data.numberOfAnalyticalRawData, tone: "muted" }]} /></DashboardCard>
      </div>
      <div className="grid gap-3 lg:grid-cols-3">
        <DashboardCard title="Pending QC work" note="Laboratory and approval items waiting for action." query={dashboard}><Breakdown total={data.numberOfBatchTestPendingRawMaterials + data.numberOfPendingApprovals}
          rows={[["Pending batch tests", data.numberOfBatchTestPendingRawMaterials], ["Pending approvals", data.numberOfPendingApprovals], ["Analytical raw data", data.numberOfAnalyticalRawData], ["Batch test count", data.numberOfBatchTestCountRawMaterials]]} /></DashboardCard>
        <DashboardCard title="Exception watch" note="Rejected QC outcomes requiring review." query={dashboard}><Breakdown total={data.numberOfBatchTestRejectedRawMaterials + data.numberOfRejectedApprovals}
          rows={[["Rejected batch tests", data.numberOfBatchTestRejectedRawMaterials], ["Rejected approvals", data.numberOfRejectedApprovals], ["Approved batch tests", data.numberOfBatchTestApprovedRawMaterials], ["Approved QC records", data.numberOfApprovals]]} /></DashboardCard>
        <DashboardCard title="Documentation scope" note="STP and ARD records available for QC execution." query={dashboard}><Breakdown total={data.numberOfStpRawMaterials + data.numberOfStpProducts + data.numberOfAnalyticalRawData}
          rows={[["Material STP", data.numberOfStpRawMaterials], ["Product STP", data.numberOfStpProducts], ["Analytical raw data", data.numberOfAnalyticalRawData], ["Approved batch tests", data.numberOfBatchTestApprovedRawMaterials]]} /></DashboardCard>
      </div>
    </DashboardState>
  </article>;
}
