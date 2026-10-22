import type { DomainEntitiesStaffRequisitionsStaffRequisitionDto as StaffRequest } from "@/shared/api/generated/hr";
export type { DomainEntitiesStaffRequisitionsStaffRequisitionDto as StaffRequest } from "@/shared/api/generated/hr";
export enum StaffRequestStatus {
  New,
  Pending,
  Approved,
  Rejected,
  Expired,
}
export const staffRoot = "/hr/staff-requisition";
export const staffPermissions = {
  view: "CanViewStaffRequisition",
  create: "CanCreateStaffRequisition",
  edit: "CanEditStaffRequisition",
  delete: "CanDeleteStaffRequisition",
} as const;
export const staffAudit = { module: "HR Management", subModule: "Staff Requisition" };
export const appointments = ["New appointment", "Replacement"] as const;
export const budgets = ["Budgeted", "Not budgeted"] as const;
export const statuses = ["New", "Pending", "Approved", "Rejected", "Expired"] as const;
export const staffDetail = (id: string): string => `${staffRoot}/${encodeURIComponent(id)}`;
export const calendarDay = (date: Date): string =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
export function mayChangeStaff(row: StaffRequest): boolean {
  return row.staffRequisitionStatus === StaffRequestStatus.New || row.staffRequisitionStatus === StaffRequestStatus.Pending;
}
export function staffEvidence(row: StaffRequest): string | null {
  if (
    !row.id ||
    !row.departmentId ||
    !row.designationId ||
    row.staffRequisitionStatus === undefined ||
    row.appointmentType === undefined ||
    row.budgetStatus === undefined ||
    !row.staffRequired
  )
    return null;
  return JSON.stringify([
    row.id,
    row.departmentId,
    row.designationId,
    row.staffRequisitionStatus,
    row.appointmentType,
    row.budgetStatus,
    row.staffRequired,
    row.qualification,
    row.educationalQualification,
    row.requestUrgency,
    row.justification,
    row.additionalRequirements,
    row.additionalRequests,
    row.departmentName,
  ]);
}
