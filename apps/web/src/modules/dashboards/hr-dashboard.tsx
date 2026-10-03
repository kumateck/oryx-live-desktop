import { useMemo, useState } from "react";
import { CalendarCheck, UserRound, UsersRound } from "lucide-react";
import { reportsApi } from "@/shared/api/generated/reports";
import { BarList, Breakdown, DashboardCard, DashboardHeading, DashboardState, MetricGrid, MetricTile, Split } from "@/shared/dashboard/dashboard-kit";
import { periodOptions, periodRange, type Period } from "@/shared/dashboard/periods";
import { percentText, readReport } from "@/shared/dashboard/report-values";
import { attendanceShare, genderSchema, genderTotals, hrSchema } from "./lib/hr-kpis";

const context = { module: "Human Resources", subModule: "Dashboard" };
/** This report needs both dates, so "all time" runs from the earliest possible date until now. */
const rangeOf = (period: Period) => period === "all" ? { startDate: new Date(0).toISOString(), endDate: new Date().toISOString() } : periodRange(period);

/** Human resources: the workforce, today's attendance, and the leave, overtime, absence, exit pass and official duty requests. */
export function HrDashboardPage() {
  const [period, setPeriod] = useState<Period>("today");
  const range = useMemo(() => rangeOf(period), [period]);
  const query = reportsApi.useGetApiV1ReportHumanResourceQuery({ ...context, ...range });
  const genderQuery = reportsApi.useGetApiV1ReportHrKpiEmployeeGenderRatioQuery(context);
  const data = useMemo(() => readReport(hrSchema, query.data, {}), [query.data]);
  const gender = useMemo(() => genderTotals(readReport(genderSchema, genderQuery.data, [])), [genderQuery.data]);
  const state = { loading: query.isLoading, failed: Boolean(query.error) };
  const attendance = attendanceShare(data.attendanceStats);
  const requests = [
    { title: "Leave requests", total: data.numberOfLeaveRequests, rows: [["Pending", data.numberOfPendingLeaveRequests], ["Rejected", data.numberOfRejectedLeaveRequests], ["Expired", data.numberOfExpiredLeaveRequests]] },
    { title: "Overtime requests", total: data.numberOfOvertimeRequests, rows: [["Pending", data.numberOfPendingOvertimeRequests], ["Approved", data.numberOfApprovedOvertimeRequests], ["Expired", data.numberOfExpiredOvertimeRequests]] },
    { title: "Absence requests", total: data.numberOfAbsenceRequests, rows: [["Pending", data.numberOfPendingAbsenceRequests], ["Approved", data.numberOfApprovedAbsenceRequests], ["Rejected", data.numberOfRejectedAbsenceRequests]] },
    { title: "Exit pass requests", total: data.numberOfExitPasses, rows: [["Pending", data.numberOfPendingExitPasses], ["Approved", data.numberOfApprovedExitPasses], ["Rejected", data.numberOfRejectedExitPasses]] },
    { title: "Official duty requests", total: data.numberOfOfficialDutyLeaves, rows: [["Pending", data.numberOfPendingOfficialDutyLeaves], ["Approved", data.numberOfApprovedOfficialDutyLeaves], ["Rejected", data.numberOfRejectedOfficialDutyLeaves]] },
  ] as const;

  return <article className="min-w-0 space-y-4">
    <DashboardHeading eyebrow="HUMAN RESOURCES" title="HR dashboard" description="The workforce, attendance, and staff requests." queries={[query, genderQuery]} period={period} periods={periodOptions()} onPeriod={setPeriod} />
    <DashboardState queries={[query, genderQuery]}>
      <MetricGrid columns="xl:grid-cols-3">
        <MetricTile label="Total employees" value={data.totalEmployees} note={`${data.numberOfPermanentEmployees.toLocaleString()} permanent · ${data.numberOfCasualEmployees.toLocaleString()} casual`} icon={UsersRound} {...state} />
        <MetricTile label="Attendance rate" value={attendance === null ? "–" : percentText(attendance)} note={attendance === null ? "No attendance recorded for this period" : `${(data.attendanceStats?.numberOfPresentEmployees ?? 0).toLocaleString()} present · ${(data.attendanceStats?.numberOfAbsentEmployees ?? 0).toLocaleString()} absent`} icon={CalendarCheck} {...state} />
        <MetricTile label="New employees" value={data.numberOfNewEmployees} note="Joined in this period" icon={UserRound} {...state} />
      </MetricGrid>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">{requests.map((request) => <DashboardCard key={request.title} title={request.title} query={query}><Breakdown total={request.total} rows={request.rows} /></DashboardCard>)}</div>
      <div className="grid gap-3 lg:grid-cols-2 xl:grid-cols-4">
        <DashboardCard title="Attendance" note="Present against absent staff." query={query} empty={attendance === null} emptyMessage="No attendance recorded for this period.">
          <Split done={data.attendanceStats?.numberOfPresentEmployees ?? 0} doneLabel="present" pending={data.attendanceStats?.numberOfAbsentEmployees ?? 0} pendingLabel="absent" /></DashboardCard>
        <DashboardCard title="Leave overview" note="Requests by kind." query={query}><BarList items={[{ label: "Official duty", value: data.numberOfOfficialDutyLeaves }, { label: "Exit pass", value: data.numberOfExitPasses, tone: "success" },
          { label: "Leave request", value: data.numberOfLeaveRequests, tone: "warning" }, { label: "Absence", value: data.numberOfAbsenceRequests, tone: "muted" }]} /></DashboardCard>
        <DashboardCard title="Gender ratio" note="Across every department." query={genderQuery} empty={gender.male + gender.female === 0} emptyMessage="No employees recorded."><BarList items={[{ label: "Male", value: gender.male }, { label: "Female", value: gender.female, tone: "success" }]} /></DashboardCard>
        <DashboardCard title="Employees" note="Active, inactive and new." query={query}><BarList items={[{ label: "Active", value: data.numberOfActiveEmployees, tone: "success" }, { label: "Inactive", value: data.numberOfInactiveEmployees, tone: "muted" }, { label: "New", value: data.numberOfNewEmployees }]} /></DashboardCard>
      </div>
    </DashboardState>
  </article>;
}
