import type { DomainEntitiesOvertimeRequestsOvertimeRequestDto as Overtime } from "@/shared/api/generated/hr";
export type { DomainEntitiesOvertimeRequestsOvertimeRequestDto as Overtime } from "@/shared/api/generated/hr";
export enum OvertimeStatus {
  Pending,
  Approved,
  Rejected,
  Expired,
}
export const overtimeRoot = "/hr/overtime-management";
export const overtimePermissions = {
  view: "CanViewOvertimeManagement",
  create: "CanCreateOvertimeManagement",
  edit: "CanEditOvertimeManagement",
  delete: "CanDeleteOvertimeManagement",
} as const;
export const overtimeAudit = { module: "HR Management", subModule: "Overtime Management" };
export const statuses = ["Pending", "Approved", "Rejected", "Expired"] as const;
export const overtimeDetail = (id: string): string => `${overtimeRoot}/${encodeURIComponent(id)}/details`;
export const overtimeDay = (date: Date): string =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
export function minutes(value: string | null | undefined): number | null {
  const match = /^(0?[1-9]|1[0-2]):([0-5]\d) (AM|PM)$/i.exec(value ?? "");
  return match ? ((Number(match[1]) % 12) + (match[3]?.toUpperCase() === "PM" ? 12 : 0)) * 60 + Number(match[2]) : null;
}
export function overtimeDuration(start: string | null | undefined, end: string | null | undefined): number | null {
  const from = minutes(start);
  const to = minutes(end);
  return from !== null && to !== null && to > from ? (to - from) / 60 : null;
}
export function overtimeEvidence(row: Overtime): string | null {
  if (
    !row.id ||
    !row.departmentId ||
    row.status === undefined ||
    !row.overtimeDate ||
    !row.code ||
    !row.employees?.length ||
    row.employees.some((employee) => !employee.id)
  )
    return null;
  return JSON.stringify([
    row.id,
    row.code,
    row.status,
    row.departmentId,
    row.overtimeDate,
    row.startTime,
    row.endTime,
    row.justification,
    [...row.employees].map((employee) => employee.id).sort(),
  ]);
}
