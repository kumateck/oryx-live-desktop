import { useCallback } from "react";
import { identityApi } from "@/shared/api/generated/identity";
import { hrApi } from "@/shared/api/generated/hr";
import { warehouseApi } from "@/shared/api/generated/warehouse";
import { useApiDispatch } from "@/shared/api/use-api-dispatch";
import type { SelectPage } from "@/shared/forms/form-wizard-types";
import { employeeAudit } from "../lib/access";
interface Page { data?: { id?: string; name?: string | null; firstName?: string | null; lastName?: string | null }[] | null; pageIndex?: number; pageCount?: number }
export function employeeOptions(result: Page, page: number): SelectPage {
  return { options: (result.data ?? []).flatMap((row) => { const label = row.name ?? `${row.firstName ?? ""} ${row.lastName ?? ""}`.trim(); return row.id && label ? [{ value: row.id, label }] : []; }), hasNext: (result.pageIndex ?? page) < (result.pageCount ?? page), hasPrevious: page > 1 };
}
export function useEmployeeLookups(departmentId?: string) {
  const dispatch = useApiDispatch();
  return useCallback(async (entity: "department" | "designation" | "manager" | "warehouse" | "employee", searchQuery: string, page: number, signal: AbortSignal): Promise<SelectPage> => {
    const options = { subscribe: false, forceRefetch: true }; const args = { ...employeeAudit, page, pageSize: 30, searchQuery };
    const request = entity === "department" ? dispatch(identityApi.endpoints.getApiV1Department.initiate(args, options))
      : entity === "manager" ? dispatch(identityApi.endpoints.getApiV1User.initiate(args, options))
      : entity === "employee" ? dispatch(hrApi.endpoints.getApiV1Employee.initiate(args, options)) : null;
    if (request) {
      if (signal.aborted) { request.abort(); throw new Error("Cancelled"); } const abort = () => request.abort(); signal.addEventListener("abort", abort, { once: true });
      try { return employeeOptions(await request.unwrap(), page); } finally { signal.removeEventListener("abort", abort); }
    }
    if (!departmentId) return { options: [], hasNext: false, hasPrevious: false };
    const dependent = entity === "designation" ? dispatch(hrApi.endpoints.getApiV1DesignationDepartmentById.initiate({ ...employeeAudit, id: departmentId }, options)) : dispatch(warehouseApi.endpoints.getApiV1WarehouseDepartmentByDepartmentId.initiate({ ...employeeAudit, departmentId }, options));
    if (signal.aborted) { dependent.abort(); throw new Error("Cancelled"); } const abort = () => dependent.abort(); signal.addEventListener("abort", abort, { once: true });
    try { const rows = (await dependent.unwrap()).filter((row) => row.name?.toLocaleLowerCase().includes(searchQuery.toLocaleLowerCase())); return { ...employeeOptions({ data: rows.slice((page - 1) * 30, page * 30) }, page), hasNext: rows.length > page * 30 }; }
    finally { signal.removeEventListener("abort", abort); }
  }, [dispatch, departmentId]);
}
