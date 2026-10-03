import { useMemo, useState } from "react";
import { ArrowRightLeft, CalendarCheck, CalendarClock, CalendarRange, ChartNoAxesColumnIncreasing, Clock3, ShieldAlert, UserPlus, UserRoundSearch, Users, VenusAndMars } from "lucide-react";
import { z } from "zod";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { identityApi } from "@/shared/api/generated/identity";
import { reportsApi } from "@/shared/api/generated/reports";
import { BarList, DashboardCard, DashboardHeading, DashboardState, MetricGrid, MetricTile, type ReportQuery } from "@/shared/dashboard/dashboard-kit";
import { periodRange } from "@/shared/dashboard/periods";
import { percentText, plural, readReport, sumOf } from "@/shared/dashboard/report-values";
import { attendanceRate, attendanceSchema, averageLeaveUtilisation, averageTurnover, disciplinarySchema, genderSchema, genderTotals, gradeSchema, headcountSchema, hrDepartments, leavePipelineSchema, leaveUtilisationSchema, newHiresSchema,
  overtimeSchema, staffRequisitionSchema, turnoverSchema } from "./lib/hr-kpis";

const api = reportsApi;
const context = { module: "Human Resources", subModule: "Executive Summary" };
const ALL = "all";
const periods = [{ value: "all", label: "All" }, { value: "week", label: "This week" }, { value: "month", label: "This month" }] as const;
type HrPeriod = (typeof periods)[number]["value"];
const departmentsSchema = z.object({ data: z.array(z.object({ id: z.string().nullish(), name: z.string().nullish() })).nullish() });
const tile = (query: ReportQuery) => ({ loading: query.isLoading, failed: Boolean(query.error) });
const th = "py-1 text-right font-medium";

function Choice({ label, value, all, options, onChange }: { label: string; value: string | undefined; all?: string; options: readonly { value: string; label: string }[]; onChange: (value: string | undefined) => void }) {
  return <Select value={value ?? ALL} onValueChange={(next) => onChange(next === ALL ? undefined : next)}><SelectTrigger aria-label={label} size="sm" className="w-full sm:w-40"><SelectValue /></SelectTrigger>
    <SelectContent position="popper">{all ? <SelectItem value={ALL}>{all}</SelectItem> : null}{options.map((option) => <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>)}</SelectContent></Select>;
}

/** The HR executive summary: headcount, hiring, turnover, leave, attendance, discipline and the request pipelines. */
export function HrExecutiveSummaryPage() {
  const thisYear = new Date().getFullYear();
  const [period, setPeriod] = useState<HrPeriod>("month");
  const [departmentId, setDepartmentId] = useState<string>();
  const [employeeType, setEmployeeType] = useState<0 | 1>();
  const [leaveYear, setLeaveYear] = useState(thisYear);
  const scope = useMemo(() => ({ ...context, ...(departmentId ? { departmentId } : {}) }), [departmentId]);
  const ranged = useMemo(() => ({ ...scope, ...periodRange(period) }), [scope, period]);
  const today = useMemo(() => new Date().toISOString().slice(0, 10), []);
  const departmentQuery = identityApi.useGetApiV1DepartmentQuery({ page: 1, pageSize: 100, ...context });
  const departments = useMemo(() => { const parsed = departmentsSchema.safeParse(departmentQuery.data ?? {}); return hrDepartments(parsed.success ? parsed.data.data ?? [] : []); }, [departmentQuery.data]);

  const headcountQuery = api.useGetApiV1ReportHrKpiEmployeeHeadcountQuery({ ...scope, ...(employeeType === undefined ? {} : { employeeType }) });
  const newHiresQuery = api.useGetApiV1ReportHrKpiNewHiresThisPeriodQuery(ranged);
  const turnoverQuery = api.useGetApiV1ReportHrKpiEmployeeTurnoverRateQuery(ranged);
  const leaveQuery = api.useGetApiV1ReportHrKpiLeaveUtilisationRateQuery({ ...scope, year: leaveYear });
  const disciplinaryQuery = api.useGetApiV1ReportHrKpiActiveDisciplinaryActionsQuery(scope);
  const genderQuery = api.useGetApiV1ReportHrKpiEmployeeGenderRatioQuery(scope);
  const attendanceQuery = api.useGetApiV1ReportHrKpiDailyAttendanceRateQuery({ ...scope, date: today });
  const leavePipelineQuery = api.useGetApiV1ReportHrKpiLeaveRequestPipelineQuery(ranged);
  const overtimeQuery = api.useGetApiV1ReportHrKpiOvertimeRequestActivityQuery(ranged);
  const requisitionQuery = api.useGetApiV1ReportHrKpiStaffRequisitionPipelineQuery(ranged);
  const gradeQuery = api.useGetApiV1ReportHrKpiEmployeeGradeLevelDistributionQuery(scope);
  const queries = [headcountQuery, newHiresQuery, turnoverQuery, leaveQuery, disciplinaryQuery, genderQuery, attendanceQuery, leavePipelineQuery, overtimeQuery, requisitionQuery, gradeQuery];

  const headcount = useMemo(() => readReport(headcountSchema, headcountQuery.data, []), [headcountQuery.data]);
  const newHires = useMemo(() => [...readReport(newHiresSchema, newHiresQuery.data, [])].sort((a, b) => b.totalNewHires - a.totalNewHires), [newHiresQuery.data]);
  const turnover = useMemo(() => [...readReport(turnoverSchema, turnoverQuery.data, [])].sort((a, b) => b.turnoverRatePercent - a.turnoverRatePercent), [turnoverQuery.data]);
  const leave = useMemo(() => [...readReport(leaveUtilisationSchema, leaveQuery.data, [])].sort((a, b) => b.utilisationPercent - a.utilisationPercent), [leaveQuery.data]);
  const disciplinary = useMemo(() => [...readReport(disciplinarySchema, disciplinaryQuery.data, [])].sort((a, b) => b.totalUnderDisciplinaryAction - a.totalUnderDisciplinaryAction), [disciplinaryQuery.data]);
  const gender = useMemo(() => genderTotals(readReport(genderSchema, genderQuery.data, [])), [genderQuery.data]);
  const attendance = useMemo(() => attendanceRate(readReport(attendanceSchema, attendanceQuery.data, [])), [attendanceQuery.data]);
  const pipeline = useMemo(() => readReport(leavePipelineSchema, leavePipelineQuery.data, []), [leavePipelineQuery.data]);
  const overtime = useMemo(() => readReport(overtimeSchema, overtimeQuery.data, []), [overtimeQuery.data]);
  const requisitions = useMemo(() => readReport(staffRequisitionSchema, requisitionQuery.data, []), [requisitionQuery.data]);
  const grades = useMemo(() => readReport(gradeSchema, gradeQuery.data, []), [gradeQuery.data]);
  const open = sumOf(disciplinary, (row) => row.totalUnderDisciplinaryAction);

  return <article className="min-w-0 space-y-4">
    <DashboardHeading eyebrow="HUMAN RESOURCES" title="HR executive summary" description="Headcount, hiring, turnover, leave, attendance and discipline across departments." queries={queries} period={period} periods={periods} onPeriod={setPeriod}
      actions={<><Choice label="Department" all="All departments" value={departmentId} options={departments} onChange={setDepartmentId} />
        <Choice label="Employee type" all="All employee types" value={employeeType?.toString()} options={[{ value: "0", label: "Permanent" }, { value: "1", label: "Casual" }]} onChange={(value) => setEmployeeType(value === undefined ? undefined : Number(value) as 0 | 1)} />
        <Choice label="Leave year" value={leaveYear.toString()} options={[thisYear, thisYear - 1].map((year) => ({ value: String(year), label: `Leave year ${year}` }))} onChange={(value) => setLeaveYear(Number(value ?? thisYear))} /></>} />
    <DashboardState queries={queries}>
      <MetricGrid columns="xl:grid-cols-6">
        <MetricTile label="Active employees" value={sumOf(headcount, (row) => row.totalActive)} note={`Across ${plural(headcount.length, "department")}`} icon={Users} {...tile(headcountQuery)} />
        <MetricTile label="New hires" value={sumOf(newHires, (row) => row.totalNewHires)} note="In this period" icon={UserPlus} {...tile(newHiresQuery)} />
        <MetricTile label="Turnover rate" value={percentText(averageTurnover(turnover))} note={`Across ${plural(turnover.length, "department")}`} icon={ArrowRightLeft} {...tile(turnoverQuery)} />
        <MetricTile label="Leave utilisation" value={percentText(averageLeaveUtilisation(leave))} note={`Days used against allowed, ${leaveYear}`} icon={CalendarRange} {...tile(leaveQuery)} />
        <MetricTile label="Active disciplinary actions" value={open} note="Open cases across all stages" icon={ShieldAlert} tone={open > 0 ? "warning" : "none"} {...tile(disciplinaryQuery)} />
        <MetricTile label="Gender ratio" value={percentText(gender.femaleShare)} note={`${gender.male.toLocaleString()} male / ${gender.female.toLocaleString()} female`} icon={VenusAndMars} {...tile(genderQuery)} />
        <MetricTile label="Daily attendance rate" value={percentText(attendance)} note="Present against expected, today" icon={CalendarCheck} {...tile(attendanceQuery)} />
        <MetricTile label="Staff requisition pipeline" value={sumOf(requisitions, (row) => row.count)} note={`${plural(sumOf(requisitions, (row) => row.totalPositionsRequired), "position")} required`} icon={UserRoundSearch} {...tile(requisitionQuery)} />
        <MetricTile label="Leave requests pending" value={sumOf(pipeline, (row) => row.pending)} note={`${sumOf(pipeline, (row) => row.approved).toLocaleString()} approved / ${sumOf(pipeline, (row) => row.rejected).toLocaleString()} rejected`} icon={CalendarClock} {...tile(leavePipelineQuery)} />
        <MetricTile label="Overtime activity" value={sumOf(overtime, (row) => row.count)} note={`${sumOf(overtime, (row) => row.approvedHours).toLocaleString()} of ${sumOf(overtime, (row) => row.totalHoursRequested).toLocaleString()} hours approved`} icon={Clock3} {...tile(overtimeQuery)} />
        <MetricTile label="Grade distribution" value={sumOf(grades, (row) => row.total)} note={`${sumOf(grades, (row) => row.juniorStaff).toLocaleString()} junior / ${sumOf(grades, (row) => row.seniorStaff).toLocaleString()} senior / ${sumOf(grades, (row) => row.seniorManagement).toLocaleString()} management`} icon={ChartNoAxesColumnIncreasing} {...tile(gradeQuery)} />
      </MetricGrid>
      <div className="grid gap-3 lg:grid-cols-2">
        <DashboardCard title="Active headcount by department" note="Permanent against casual staff." query={headcountQuery} empty={headcount.length === 0} emptyMessage="No headcount for this selection.">
          <ul className="space-y-3">{headcount.map((row, index) => <li key={`${row.department ?? "department"}-${index}`} className="space-y-1"><p className="text-sm font-medium">{row.department ?? "Unassigned"} <span className="font-normal text-muted-foreground">· {row.totalActive.toLocaleString()} active</span></p>
            <BarList items={[{ label: "Permanent", value: row.permanentActive }, { label: "Casual", value: row.casualActive, tone: "warning" }]} /></li>)}</ul>
        </DashboardCard>
        <DashboardCard title="Turnover rate by department" note="Highest first." query={turnoverQuery} empty={turnover.length === 0}>
          <BarList share={false} format={percentText} items={turnover.map((row, index) => ({ label: row.department ?? (index === 0 ? "Unassigned" : `Unassigned ${index + 1}`), value: row.turnoverRatePercent, tone: "danger" as const }))} />
        </DashboardCard>
      </div>
      <div className="grid gap-3 lg:grid-cols-3">
        <DashboardCard title="New hires" note="By department, in this period." query={newHiresQuery} empty={newHires.length === 0} emptyMessage="No new hires in this period.">
          <table className="w-full text-sm"><thead><tr className="text-left text-xs text-muted-foreground"><th scope="col" className="py-1 font-medium">Department</th><th scope="col" className={th}>Permanent</th><th scope="col" className={th}>Casual</th><th scope="col" className={th}>Total</th></tr></thead>
            <tbody className="divide-y">{newHires.map((row, index) => <tr key={`${row.department ?? "department"}-${index}`}><th scope="row" className="py-1.5 text-left font-medium">{row.department ?? "–"}</th><td className="py-1.5 text-right">{row.permanentNewHires.toLocaleString()}</td><td className="py-1.5 text-right">{row.casualNewHires.toLocaleString()}</td><td className="py-1.5 text-right font-semibold">{row.totalNewHires.toLocaleString()}</td></tr>)}</tbody></table>
        </DashboardCard>
        <DashboardCard title="Leave utilisation" note={`Days used against allowed in ${leaveYear}, by department.`} query={leaveQuery} empty={leave.length === 0} emptyMessage="No leave recorded for this year.">
          <table className="w-full text-sm"><thead><tr className="text-left text-xs text-muted-foreground"><th scope="col" className="py-1 font-medium">Department</th><th scope="col" className={th}>Due for leave</th><th scope="col" className={th}>Days used</th><th scope="col" className={th}>Used</th></tr></thead>
            <tbody className="divide-y">{leave.map((row, index) => <tr key={`${row.department ?? "department"}-${index}`}><th scope="row" className="py-1.5 text-left font-medium">{row.department ?? "–"}</th><td className="py-1.5 text-right">{row.staffDueForLeave.toLocaleString()}</td><td className="py-1.5 text-right">{row.totalDaysUsed.toLocaleString()} / {row.totalDaysAllowed.toLocaleString()}</td><td className="py-1.5 text-right font-semibold">{row.utilisationPercent.toFixed(0)}%</td></tr>)}</tbody></table>
        </DashboardCard>
        <DashboardCard title="Disciplinary actions" note="Open cases by stage, by department." query={disciplinaryQuery} empty={disciplinary.length === 0} emptyMessage="No active disciplinary actions.">
          <div className="overflow-x-auto"><table className="w-full text-sm"><thead><tr className="text-left text-xs text-muted-foreground"><th scope="col" className="py-1 font-medium">Department</th><th scope="col" className={th}>Questioned</th><th scope="col" className={th}>Warned</th><th scope="col" className={th}>Final</th><th scope="col" className={th}>Suspended</th></tr></thead>
            <tbody className="divide-y">{disciplinary.map((row, index) => <tr key={`${row.department ?? "department"}-${index}`}><th scope="row" className="py-1.5 text-left font-medium">{row.department ?? "–"}</th><td className="py-1.5 text-right">{row.underQuestion.toLocaleString()}</td><td className="py-1.5 text-right">{row.formalWarning.toLocaleString()}</td><td className="py-1.5 text-right">{row.finalWarning.toLocaleString()}</td><td className="py-1.5 text-right">{row.suspended.toLocaleString()}</td></tr>)}</tbody></table></div>
        </DashboardCard>
      </div>
    </DashboardState>
  </article>;
}
