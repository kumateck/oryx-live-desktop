import { useCallback } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { departmentApi, departmentAudit } from "@/modules/departments/departments";
import { AsyncOptionPicker } from "@/shared/forms/async-option-picker";
import type { SelectLoader, SelectOption } from "@/shared/forms/form-wizard-types";
import { userApi } from "../api/user-api";
import { audit } from "../lib/user-access";
import { roleOptionSchema } from "../schemas/user-schema";

export const allRoles: SelectOption = { value: "", label: "All roles" };
export const allDepartments: SelectOption = { value: "", label: "All departments" };
const pageSize = 30;

/** Narrows the user directory to one role and/or one department. */
export function UserFilters({ role, department, onRoleChange, onDepartmentChange }: {
  role: SelectOption; department: SelectOption; onRoleChange: (option: SelectOption) => void; onDepartmentChange: (option: SelectOption) => void;
}) {
  const [loadRoles] = userApi.useLazyGetApiV1RoleQuery();
  const [loadDepartments] = departmentApi.useLazyGetApiV1DepartmentQuery();

  // Roles come back as one list, so they are searched and paged here.
  const roles = useCallback<SelectLoader>(async (term, page) => {
    const result = await loadRoles(audit, true);
    if (result.error) throw new Error("Roles could not be loaded. Try again.");
    const parsed = roleOptionSchema.safeParse(result.data ?? []);
    const needle = term.trim().toLowerCase();
    const matches = (parsed.success ? parsed.data : []).filter((option) => !needle || option.label.toLowerCase().includes(needle))
      .map((option) => ({ value: option.id, label: option.label }));
    const options = page === 1 && !needle ? [allRoles, ...matches] : matches;
    const start = (page - 1) * pageSize;
    return { options: options.slice(start, start + pageSize), hasNext: start + pageSize < options.length, hasPrevious: page > 1 };
  }, [loadRoles]);

  const departments = useCallback<SelectLoader>(async (term, page) => {
    const result = await loadDepartments({ ...departmentAudit, searchQuery: term, page, pageSize }, true);
    if (result.error) throw new Error("Departments could not be loaded. Try again.");
    const data = result.data;
    const options = (data?.data ?? []).flatMap((row) => row.id ? [{ value: row.id, label: row.name?.trim() || "Unnamed department" }] : []);
    return { options: page === 1 && !term.trim() ? [allDepartments, ...options] : options,
      hasNext: (data?.pageIndex ?? 1) < (data?.pageCount ?? 1), hasPrevious: (data?.pageIndex ?? 1) > 1 };
  }, [loadDepartments]);

  const filtered = Boolean(role.value || department.value);
  return <div className="flex flex-wrap items-center gap-2">
    <div className="w-full sm:w-52"><AsyncOptionPicker label="Filter by role" value={role} onChange={onRoleChange} loadOptions={roles} /></div>
    <div className="w-full sm:w-60"><AsyncOptionPicker label="Filter by department" value={department} onChange={onDepartmentChange} loadOptions={departments} /></div>
    {filtered ? <Button type="button" size="sm" variant="ghost" onClick={() => { onRoleChange(allRoles); onDepartmentChange(allDepartments); }}><X />Clear filters</Button> : null}
  </div>;
}
