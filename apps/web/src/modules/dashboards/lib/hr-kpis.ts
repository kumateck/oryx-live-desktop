import { z } from "zod";
import { averageOf, count, list, sumOf, text } from "@/shared/dashboard/report-values";

export const hrSchema = z.object({ totalEmployees: count, numberOfPermanentEmployees: count, numberOfCasualEmployees: count, numberOfActiveEmployees: count, numberOfInactiveEmployees: count, numberOfNewEmployees: count,
  attendanceStats: z.object({ numberOfPresentEmployees: count, numberOfAbsentEmployees: count }).nullish(),
  numberOfLeaveRequests: count, numberOfPendingLeaveRequests: count, numberOfRejectedLeaveRequests: count, numberOfExpiredLeaveRequests: count,
  numberOfOvertimeRequests: count, numberOfPendingOvertimeRequests: count, numberOfApprovedOvertimeRequests: count, numberOfExpiredOvertimeRequests: count,
  numberOfAbsenceRequests: count, numberOfPendingAbsenceRequests: count, numberOfApprovedAbsenceRequests: count, numberOfRejectedAbsenceRequests: count,
  numberOfExitPasses: count, numberOfPendingExitPasses: count, numberOfApprovedExitPasses: count, numberOfRejectedExitPasses: count,
  numberOfOfficialDutyLeaves: count, numberOfPendingOfficialDutyLeaves: count, numberOfApprovedOfficialDutyLeaves: count, numberOfRejectedOfficialDutyLeaves: count });

export const headcountSchema = list(z.object({ department: text, totalActive: count, permanentActive: count, casualActive: count }));
export const newHiresSchema = list(z.object({ department: text, permanentNewHires: count, casualNewHires: count, totalNewHires: count }));
export const turnoverSchema = list(z.object({ department: text, turnoverRatePercent: count }));
export const leaveUtilisationSchema = list(z.object({ department: text, staffDueForLeave: count, totalDaysUsed: count, totalDaysAllowed: count, utilisationPercent: count }));
export const disciplinarySchema = list(z.object({ department: text, underQuestion: count, formalWarning: count, finalWarning: count, suspended: count, totalUnderDisciplinaryAction: count }));
export const genderSchema = list(z.object({ totalMale: count, totalFemale: count }));
export const attendanceSchema = list(z.object({ present: count, expectedTotal: count }));
export const leavePipelineSchema = list(z.object({ pending: count, approved: count, rejected: count }));
export const overtimeSchema = list(z.object({ count, totalHoursRequested: count, approvedHours: count }));
export const staffRequisitionSchema = list(z.object({ count, totalPositionsRequired: count }));
export const gradeSchema = list(z.object({ total: count, juniorStaff: count, seniorStaff: count, seniorManagement: count }));

/** Present staff as a share of present and absent together. Nothing recorded reads as no rate, not 0%. */
export function attendanceShare(stats: { numberOfPresentEmployees: number; numberOfAbsentEmployees: number } | null | undefined): number | null {
  const total = (stats?.numberOfPresentEmployees ?? 0) + (stats?.numberOfAbsentEmployees ?? 0);
  return total > 0 ? ((stats?.numberOfPresentEmployees ?? 0) / total) * 100 : null;
}
export function genderTotals(rows: z.infer<typeof genderSchema>) { const male = sumOf(rows, (row) => row.totalMale), female = sumOf(rows, (row) => row.totalFemale); return { male, female, femaleShare: male + female ? (female / (male + female)) * 100 : 0 }; }
/** Present against expected, over every department. */
export function attendanceRate(rows: z.infer<typeof attendanceSchema>) { const expected = sumOf(rows, (row) => row.expectedTotal); return expected ? (sumOf(rows, (row) => row.present) / expected) * 100 : 0; }
export const averageTurnover = (rows: z.infer<typeof turnoverSchema>) => averageOf(rows, (row) => row.turnoverRatePercent);
export const averageLeaveUtilisation = (rows: z.infer<typeof leaveUtilisationSchema>) => averageOf(rows, (row) => row.utilisationPercent);

/** The departments the HR filter offers, in this order, when the server has them. */
export const hrDepartmentOrder = ["Syrup", "Tablet", "Beta-Lactam", "Ointment", "Warehouse", "QC Lab", "QA", "Procurement", "HR", "Finance", "Administration", "Engineering"] as const;
export function hrDepartments(departments: readonly { id?: string | null | undefined; name?: string | null | undefined }[]): { value: string; label: string }[] {
  return hrDepartmentOrder.flatMap((label) => { const found = departments.find((item) => item.name?.trim().toLowerCase() === label.toLowerCase()); return found?.id ? [{ value: found.id, label }] : []; });
}
