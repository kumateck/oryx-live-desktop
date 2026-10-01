import type { SharedDepartmentType } from "@/shared/api/generated/identity";

export const departmentTypes = [
  { value: "0", label: "Production" },
  { value: "1", label: "Non-production" },
  { value: "2", label: "Research & development" },
] as const;

export function departmentTypeLabel(type: SharedDepartmentType): string {
  return departmentTypes[type].label;
}

export function departmentTypeFromValue(value: "0" | "1" | "2"): SharedDepartmentType {
  return Number(value) as SharedDepartmentType;
}
