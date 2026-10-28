import type { DomainEntitiesLeaveRequestsLeaveRequestDtoRead as Leave } from "@/shared/api/generated/hr";
export type {
  DomainEntitiesLeaveRequestsLeaveRequestDtoRead as Leave,
  DomainEntitiesLeaveRequestsRequestCategory as Category,
  DomainEntitiesLeaveRequestsLeaveStatus as Status,
} from "@/shared/api/generated/hr";
export enum LeaveStatus {
  Pending,
  Approved,
  Rejected,
  Expired,
  Recalled,
  Reapplied,
  Cancelled,
}
export enum LeaveCategory {
  Leave,
  Absence,
  ExitPass,
  OfficialDuty,
}
export const leavePermissions = {
  view: "CanViewLeaveRequests",
  create: "CanCreateLeaveRequest",
  edit: "CanEditLeaveRequest",
  recall: "CanRecallLeave",
  cancel: "CanCancelLeave",
} as const;
export const leaveAudit = { module: "HR Management", subModule: "Leave Management" };
export const leaveRoot = "/hr/leave-management";
export const categories = ["Leave", "Absence", "Exit pass", "Official duty"] as const;
export const statuses = ["Pending", "Approved", "Rejected", "Expired", "Recalled", "Reapplied", "Cancelled"] as const;
export const options = (labels: readonly string[]) => labels.map((label, value) => ({ label, value: String(value) }));
export const day = (date: Date): string => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
export const todayUtc = (): string => new Date().toISOString().slice(0, 10);
export const label = (labels: readonly string[], value: number | undefined): string =>
  value === undefined ? "Not recorded" : (labels[value] ?? "Unrecognized status");
export const employeeName = (leave: Leave): string => [leave.employee?.firstName, leave.employee?.lastName].filter(Boolean).join(" ") || "Not recorded";
export const detailPath = (id: string): string => `${leaveRoot}/${encodeURIComponent(id)}/details`;
export function weekdays(start: Date, end: Date): number {
  const from = Date.parse(`${day(start)}T00:00:00Z`);
  const to = Date.parse(`${day(end)}T00:00:00Z`);
  const days = Math.round((to - from) / 86400000) + 1;
  if (days <= 0) return 0;
  let count = Math.floor(days / 7) * 5;
  for (let index = 0; index < days % 7; index++) {
    const weekday = new Date(from + index * 86400000).getUTCDay();
    if (weekday !== 0 && weekday !== 6) count++;
  }
  return count;
}
export function leaveEvidence(leave: Leave): string | null {
  if (!leave.id || !leave.employeeId || leave.leaveStatus === undefined || leave.requestCategory === undefined || !leave.startDate || !leave.endDate)
    return null;
  return JSON.stringify([
    leave.id,
    leave.employeeId,
    leave.leaveStatus,
    leave.requestCategory,
    leave.startDate,
    leave.endDate,
    leave.leaveTypeId,
    leave.contactPerson,
    leave.contactPersonNumber,
    leave.destination,
    leave.justification,
    leave.recallDate,
    leave.paidDays,
    leave.unpaidDays,
    leave.employee?.designation?.id,
    leave.employee?.department?.id,
    leave.employee?.type,
    leave.employee?.status,
    leave.attachments?.map((file) => [file.id, file.name, file.link]),
  ]);
}
export function mayEdit(leave: Leave): boolean {
  return [LeaveStatus.Pending, LeaveStatus.Rejected, LeaveStatus.Reapplied].some((status) => status === leave.leaveStatus);
}
export function mayCancel(leave: Leave, today = todayUtc()): boolean {
  return leave.leaveStatus === LeaveStatus.Approved && Boolean(leave.startDate && leave.startDate.slice(0, 10) > today);
}
export function mayRecall(leave: Leave, today = todayUtc()): boolean {
  return (
    leave.leaveStatus === LeaveStatus.Approved &&
    (leave.requestCategory === LeaveCategory.Leave || leave.requestCategory === LeaveCategory.OfficialDuty) &&
    Boolean(leave.startDate && leave.endDate && leave.startDate.slice(0, 10) <= today && leave.endDate.slice(0, 10) >= today)
  );
}

/** Recall is employee-scoped on the server, so any second approved request makes the target ambiguous. */
export function uniqueRecallTarget(row: Leave, approved: readonly Leave[]): boolean {
  const candidates = approved.filter((request) => request.employeeId === row.employeeId);
  return Boolean(row.id && row.employeeId && candidates.length === 1 && candidates[0]?.id === row.id);
}

/** The current recall endpoint always credits annual leave, even for non-deducting requests. */
export function recallBalanceProblem(row: Leave): string | null {
  return row.requestCategory === LeaveCategory.Leave && row.leaveType?.deductFromBalance === true
    ? null
    : "The server currently credits annual leave on every recall. This request did not use a verified annual-leave deduction and cannot be recalled safely until that calculation is corrected.";
}
