import { departmentTypes, type DepartmentType } from "@/shared/auth/access";
import type { ReportFilters, ReportOption } from "../schemas/report-filters";
import type { ReportDefinition } from "./report-model";

export interface ReportAccount { departmentId: string | null; department: string | null; departmentType: DepartmentType | null }

/**
 * The department a report is fixed to, or null when the user may choose.
 * Same rule as the backend's ReportDepartmentScope: a production-type department (production, and
 * warehouses set up as production) reports only on itself. Non-production, R&D and accounts without
 * a department choose from the department list, including "all" where the report allows it.
 */
export function lockedReportDepartment(definition: ReportDefinition, account: ReportAccount | null): ReportOption | null {
  if (!definition.fields.includes("department") || !account?.departmentId || account.departmentType !== departmentTypes.production) return null;
  const name = account.department?.trim();
  return { value: account.departmentId, label: name || "Assigned department", ...(name ? { name } : {}) };
}

/** Filters with the fixed department applied to both the single and the multiple selection. */
export function withReportDepartment(filters: ReportFilters, department: ReportOption | null): ReportFilters {
  return department ? { ...filters, department, selections: { ...filters.selections, department: [department] } } : filters;
}

export const lockedDepartmentHint = "Reports are limited to your production department.";
