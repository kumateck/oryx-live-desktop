import type { DomainEntitiesReportsHumanResourceEmployeeMasterListReportDto, DomainEntitiesReportsHumanResourceEmployeeMovementCountDtoRead, DomainEntitiesReportsHumanResourceEmployeeMovementGrandTotalDtoRead, DomainEntitiesReportsHumanResourcePermanentStaffGradeCountDtoRead, DomainEntitiesReportsHumanResourcePermanentStaffGradeTotalDtoRead, DomainEntitiesReportsHumanResourceStaffGenderRatioCountDtoRead, DomainEntitiesReportsHumanResourceStaffGenderRatioTotalDtoRead, DomainEntitiesReportsHumanResourceStaffGrandTotalRead, DomainEntitiesReportsHumanResourceStaffLeaveSummaryDtoRead, DomainEntitiesReportsHumanResourceStaffTotalSummaryRead, DomainEntitiesReportsHumanResourceStaffTurnoverCountDto } from "@/shared/api/generated/reports";
import type { MovementReport } from "../api/contract-adapters";
import { reportSheet, reportDate, reportEnum } from "@/shared/reports/report-data";

export const employeeMasterSheet = (name: string, rows: readonly DomainEntitiesReportsHumanResourceEmployeeMasterListReportDto[]) => reportSheet(name, rows, [
  { label: "No.", read: (row) => row.no },
  { label: "Staff number", read: (row) => row.staffNumber },
  { label: "First name", read: (row) => row.firstName },
  { label: "Last name", read: (row) => row.lastName },
  { label: "Email", read: (row) => row.email },
  { label: "Phone number", read: (row) => row.phoneNumber },
  { label: "Gender", read: (row) => row.gender },
  { label: "Date of birth", read: (row) => reportDate(row.dateOfBirth) },
  { label: "Date employed", read: (row) => reportDate(row.dateEmployed) },
  { label: "Employment type", read: (row) => row.employmentType },
  { label: "Grade level", read: (row) => row.gradeLevel },
  { label: "Status", read: (row) => row.status },
  { label: "Department", read: (row) => row.department },
  { label: "Designation", read: (row) => row.designation },
  { label: "Reporting manager", read: (row) => row.reportingManager },
  { label: "Nationality", read: (row) => row.nationality },
  { label: "Region", read: (row) => row.region },
  { label: "Marital status", read: (row) => row.maritalStatus },
  { label: "Religion", read: (row) => row.religion },
  { label: "Bank account number", read: (row) => row.bankAccountNumber },
  { label: "Ssnit number", read: (row) => row.ssnitNumber },
  { label: "Ghana card number", read: (row) => row.ghanaCardNumber },
  { label: "Annual leave entitlement", read: (row) => row.annualLeaveEntitlement },
]);

export const staffGradeDepartmentsSheet = (name: string, rows: readonly DomainEntitiesReportsHumanResourcePermanentStaffGradeCountDtoRead[]) => reportSheet(name, rows, [
  { label: "Senior management male", read: (row) => row.seniorMgtMale },
  { label: "Senior management female", read: (row) => row.seniorMgtFemale },
  { label: "Senior staff male", read: (row) => row.seniorStaffMale },
  { label: "Senior staff female", read: (row) => row.seniorStaffFemale },
  { label: "Junior staff male", read: (row) => row.juniorStaffMale },
  { label: "Junior staff female", read: (row) => row.juniorStaffFemale },
  { label: "Total male", read: (row) => row.totalMale },
  { label: "Total female", read: (row) => row.totalFemale },
  { label: "Department", read: (row) => row.department },
]);

export const staffGradeTotalsSheet = (name: string, rows: readonly DomainEntitiesReportsHumanResourcePermanentStaffGradeTotalDtoRead[]) => reportSheet(name, rows, [
  { label: "Senior management male", read: (row) => row.seniorMgtMale },
  { label: "Senior management female", read: (row) => row.seniorMgtFemale },
  { label: "Senior staff male", read: (row) => row.seniorStaffMale },
  { label: "Senior staff female", read: (row) => row.seniorStaffFemale },
  { label: "Junior staff male", read: (row) => row.juniorStaffMale },
  { label: "Junior staff female", read: (row) => row.juniorStaffFemale },
  { label: "Total male", read: (row) => row.totalMale },
  { label: "Total female", read: (row) => row.totalFemale },
  { label: "Total", read: (row) => row.total },
]);

export const movementDepartmentsSheet = (name: string, rows: NonNullable<MovementReport["departments"]>) => reportSheet(name, rows, [
  { label: "Permanent new", read: (row) => row.permanentNew },
  { label: "Permanent transfer", read: (row) => row.permanentTransfer },
  { label: "Permanent resignation", read: (row) => row.permanentResignation },
  { label: "Permanent termination", read: (row) => row.permanentTermination },
  { label: "Permanent sdvp", read: (row) => row.permanentSDVP },
  { label: "Casual new", read: (row) => row.casualNew },
  { label: "Casual resignation", read: (row) => row.casualResignation },
  { label: "Casual termination", read: (row) => row.casualTermination },
  { label: "Casual sdvp", read: (row) => row.casualSDVP },
  { label: "Net movement", read: (row) => row.netMovement },
  { label: "Department name", read: (row) => row.departmentName },
]);

export const movementTotalsSheet = (name: string, rows: readonly NonNullable<MovementReport["totals"]>[]) => reportSheet(name, rows, [
  { label: "Permanent new", read: (row) => row.permanentNew },
  { label: "Permanent transfer", read: (row) => row.permanentTransfer },
  { label: "Permanent resignation", read: (row) => row.permanentResignation },
  { label: "Permanent termination", read: (row) => row.permanentTermination },
  { label: "Permanent sdvp", read: (row) => row.permanentSDVP },
  { label: "Casual new", read: (row) => row.casualNew },
  { label: "Casual resignation", read: (row) => row.casualResignation },
  { label: "Casual termination", read: (row) => row.casualTermination },
  { label: "Casual sdvp", read: (row) => row.casualSDVP },
  { label: "Net movement", read: (row) => row.netMovement },
]);

export const staffDepartmentsSheet = (name: string, rows: readonly DomainEntitiesReportsHumanResourceStaffTotalSummaryRead[]) => reportSheet(name, rows, [
  { label: "Total permanent staff", read: (row) => row.totalPermanentStaff },
  { label: "Total casual staff", read: (row) => row.totalCasualStaff },
  { label: "Total staff", read: (row) => row.totalStaff },
  { label: "Department", read: (row) => row.department },
]);

export const staffTotalsSheet = (name: string, rows: readonly DomainEntitiesReportsHumanResourceStaffGrandTotalRead[]) => reportSheet(name, rows, [
  { label: "Total permanent staff", read: (row) => row.totalPermanentStaff },
  { label: "Total casual staff", read: (row) => row.totalCasualStaff },
  { label: "Total staff", read: (row) => row.totalStaff },
]);

export const genderDepartmentsSheet = (name: string, rows: readonly DomainEntitiesReportsHumanResourceStaffGenderRatioCountDtoRead[]) => reportSheet(name, rows, [
  { label: "Number of permanent male", read: (row) => row.numberOfPermanentMale },
  { label: "Number of permanent female", read: (row) => row.numberOfPermanentFemale },
  { label: "Number of casual male", read: (row) => row.numberOfCasualMale },
  { label: "Number of casual female", read: (row) => row.numberOfCasualFemale },
  { label: "Total males", read: (row) => row.totalMales },
  { label: "Total females", read: (row) => row.totalFemales },
  { label: "Total", read: (row) => row.total },
  { label: "Department", read: (row) => row.department },
]);

export const genderTotalsSheet = (name: string, rows: readonly DomainEntitiesReportsHumanResourceStaffGenderRatioTotalDtoRead[]) => reportSheet(name, rows, [
  { label: "Number of permanent male", read: (row) => row.numberOfPermanentMale },
  { label: "Number of permanent female", read: (row) => row.numberOfPermanentFemale },
  { label: "Number of casual male", read: (row) => row.numberOfCasualMale },
  { label: "Number of casual female", read: (row) => row.numberOfCasualFemale },
  { label: "Total males", read: (row) => row.totalMales },
  { label: "Total females", read: (row) => row.totalFemales },
  { label: "Total", read: (row) => row.total },
]);

export const leaveDepartmentsSheet = (name: string, rows: readonly DomainEntitiesReportsHumanResourceStaffLeaveSummaryDtoRead[]) => reportSheet(name, rows, [
  { label: "Department name", read: (row) => row.departmentName },
  { label: "Staff due for leave", read: (row) => row.staffDueForLeave },
  { label: "Total leave entitlement", read: (row) => row.totalLeaveEntitlement },
  { label: "Days used", read: (row) => row.daysUsed },
  { label: "Days left", read: (row) => row.daysLeft },
  { label: "Percent used", read: (row) => row.percentUsed },
  { label: "Percent left", read: (row) => row.percentLeft },
]);

export const turnoverDepartmentsSheet = (name: string, rows: readonly DomainEntitiesReportsHumanResourceStaffTurnoverCountDto[]) => reportSheet(name, rows, [
  { label: "No.", read: (row) => row.no },
  { label: "Department", read: (row) => row.department },
  { label: "Exit reason", read: (row) => row.exitReason },
  { label: "Leaver count", read: (row) => row.leaverCount },
  { label: "Total leavers", read: (row) => row.totalLeavers },
  { label: "Average headcount", read: (row) => row.averageHeadcount },
  { label: "Departmental turnover", read: (row) => row.departmentalTurnover },
]);

