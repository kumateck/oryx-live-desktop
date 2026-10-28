import { useCallback } from "react";
import { departmentApi, departmentAudit } from "@/modules/departments/departments";
import type { SelectLoader, SelectPage } from "@/shared/forms/form-wizard-types";
import { designationAudit, staffSetupApi } from "../designations";

interface Page { data?: readonly { id?: string | null; name?: string | null }[] | null; pageIndex?: number; pageCount?: number }
const toPage = (data: Page | undefined, fallback: string): SelectPage => ({
  options: (data?.data ?? []).flatMap((row) => row.id ? [{ value: row.id, label: row.name?.trim() || fallback }] : []),
  hasNext: (data?.pageIndex ?? 1) < (data?.pageCount ?? 1), hasPrevious: (data?.pageIndex ?? 1) > 1,
});

/**
 * Departments and designations searched on the server a page at a time, so every one can be found
 * however many there are (the lists used to stop at the first 1,000).
 */
export function useReferenceOptions() {
  const [loadDepartments] = departmentApi.useLazyGetApiV1DepartmentQuery();
  const [loadDesignations] = staffSetupApi.useLazyGetApiV1DesignationQuery();
  const departments = useCallback<SelectLoader>(async (searchQuery, page) => {
    const result = await loadDepartments({ ...departmentAudit, searchQuery, page, pageSize: 30 }, true);
    if (result.error) throw new Error("Departments could not be loaded. Try again.");
    return toPage(result.data, "Unnamed department");
  }, [loadDepartments]);
  const designations = useCallback<SelectLoader>(async (searchQuery, page) => {
    const result = await loadDesignations({ ...designationAudit, searchQuery, page, pageSize: 30 }, true);
    if (result.error) throw new Error("Designations could not be loaded. Try again.");
    return toPage(result.data, "Unnamed designation");
  }, [loadDesignations]);
  return { departments, designations };
}
