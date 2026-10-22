import type { ApiDispatch } from "@/shared/api/api-provider";
import { reportsApi } from "@/shared/api/generated/reports";
import { hrApi } from "@/shared/api/generated/hr";
import { reportSheet } from "@/shared/reports/report-data";
import type { ReportFilters } from "../schemas/report-filters";
import { ReportKey, reportsAudit, type ReportOutput } from "../lib/report-model";
import { binaryChoice, ternaryChoice, departmentParam, periodParams, reportBoundary } from "../lib/filter-params";
import { employeeMasterSheet, staffGradeDepartmentsSheet, staffGradeTotalsSheet, movementDepartmentsSheet, movementTotalsSheet, staffDepartmentsSheet, staffTotalsSheet, genderDepartmentsSheet, genderTotalsSheet, leaveDepartmentsSheet, turnoverDepartmentsSheet } from "../lib/people-adapters-1";
import { dailyAttendanceSheet, departmentAttendanceSheet, attendanceExceptionsSheet, attendanceTotalsSheet } from "../lib/attendance-adapters";
import { reportContractApi } from "./contract-adapters";
import { reportRequest } from "./request";
const options = { subscribe: false, forceRefetch: true };
export async function loadPeopleReport(dispatch: ApiDispatch, key: ReportKey, f: ReportFilters, signal: AbortSignal): Promise<ReportOutput> {
  const scope = { ...reportsAudit, ...departmentParam(f) }; const period = { ...scope, ...periodParams(f) };
  const request = reportRequest;
  switch (key) {
    case ReportKey.EmployeeMaster: {
      const employeeType = binaryChoice(f.employeeType?.value); const gradeLevel = ternaryChoice(f.grade?.value); const status = ternaryChoice(f.status?.value);
      const rows = await request(dispatch(reportsApi.endpoints.getApiV1ReportHrEmployeeMasterList.initiate({ ...scope, ...(employeeType === undefined ? {} : { employeeType }), ...(gradeLevel === undefined ? {} : { gradeLevel }), ...(status === undefined ? {} : { status }) }, options)), signal);
      return { sheets: [employeeMasterSheet("Employee master list", rows)] };
    }
    case ReportKey.StaffGrade: {
      const result = await request(dispatch(reportsApi.endpoints.getApiV1ReportStaffReport.initiate(scope, options)), signal);
      return { sheets: [staffGradeDepartmentsSheet("Staff grades by department", result.departments ?? []), staffGradeTotalsSheet("Grade organisation totals", result.totals ? [result.totals] : [])] };
    }
    case ReportKey.EmployeeMovement: {
      const result = await request(dispatch(reportContractApi.endpoints.readReportEmployeeMovement.initiate(period, options)), signal);
      return { sheets: [movementDepartmentsSheet("Employee movements", result.flatMap((row) => row.departments ?? [])), movementTotalsSheet("Movement totals", result.flatMap((row) => row.totals ? [row.totals] : []))] };
    }
    case ReportKey.StaffTotal: {
      const result = await request(dispatch(reportsApi.endpoints.getApiV1ReportStaffTotalReport.initiate(period, options)), signal);
      return { sheets: [staffDepartmentsSheet("Staff by department", result.departments ?? []), staffTotalsSheet("Staff totals", result.totals ? [result.totals] : [])] };
    }
    case ReportKey.GenderRatio: {
      const result = await request(dispatch(reportsApi.endpoints.getApiV1ReportStaffGenderRatioReport.initiate(period, options)), signal);
      return { sheets: [genderDepartmentsSheet("Gender counts by department", result.departments ?? []), genderTotalsSheet("Gender totals", result.totals ? [result.totals] : [])] };
    }
    case ReportKey.LeaveOverview: {
      const result = await request(dispatch(reportsApi.endpoints.getApiV1ReportStaffLeaveReport.initiate(period, options)), signal);
      return { sheets: [leaveDepartmentsSheet("Leave overview", result.departments ?? [])] };
    }
    case ReportKey.StaffTurnover: {
      const result = await request(dispatch(reportsApi.endpoints.getApiV1ReportStaffTurnoverReport.initiate(period, options)), signal);
      return { sheets: [turnoverDepartmentsSheet("Turnover by department", result.departments ?? []), reportSheet("Organisation turnover", [result], [{ label: "Organisation turnover", read: (row) => row.organisationTurnover }, { label: "Grand total leavers", read: (row) => row.grandTotalLeavers }])] };
    }
    case ReportKey.DailyAttendance: {
      if (!f.department || !f.date) throw new Error("Choose a department and attendance date.");
      const result = await request(dispatch(hrApi.endpoints.getApiV1AttendanceRecordsDailySummary.initiate({ ...reportsAudit, departmentName: f.department.label, date: reportBoundary(f.date) }, options)), signal);
      return { sheets: [dailyAttendanceSheet("Daily attendance", result)] };
    }
    case ReportKey.DepartmentAttendance: {
      const result = await request(dispatch(hrApi.endpoints.getApiV1AttendanceRecordsGeneralSummary.initiate(reportsAudit, options)), signal);
      return { sheets: [departmentAttendanceSheet("Department attendance", (result.departmentReports ?? []).filter((row) => !f.department || row.departmentName === f.department.label)),
        attendanceExceptionsSheet("Attendance exceptions", (result.systemStatistics?.departments ?? []).filter((row) => !f.department || row.department === f.department.label)),
        ...(!f.department && result.systemStatistics?.totals ? [attendanceTotalsSheet("Organisation attendance totals", [result.systemStatistics.totals])] : [])],
        warnings: ["This endpoint returns the current server summary. It cannot produce historical attendance totals. Organisation totals are shown only when all departments are selected."] };
    }
    default: throw new Error("This report does not belong to HR reporting.");
  }
}
