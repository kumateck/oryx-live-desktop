import { useCallback } from "react";
import { identityApi } from "@/shared/api/generated/identity";
import { hrApi } from "@/shared/api/generated/hr";
import { useApiDispatch } from "@/shared/api/use-api-dispatch";
import type { SelectPage } from "@/shared/forms/form-wizard-types";
import { staffAudit } from "../lib/staff";
export function useStaffLookups(departmentId?: string) {
  const dispatch = useApiDispatch();
  return useCallback(
    async (kind: "department" | "designation", searchQuery: string, page: number, signal: AbortSignal): Promise<SelectPage> => {
      if (kind === "designation" && !departmentId) return { options: [], hasNext: false, hasPrevious: false };
      const settings = { subscribe: false, forceRefetch: true };
      const request =
        kind === "department"
          ? dispatch(identityApi.endpoints.getApiV1Department.initiate({ ...staffAudit, page, pageSize: 30, searchQuery }, settings))
          : dispatch(hrApi.endpoints.getApiV1DesignationDepartmentById.initiate({ ...staffAudit, id: departmentId ?? "" }, settings));
      const abort = () => request.abort();
      if (signal.aborted) {
        abort();
        throw new Error("Cancelled");
      }
      signal.addEventListener("abort", abort, { once: true });
      try {
        const result = await request.unwrap();
        const filtered = Array.isArray(result) ? result.filter((row) => row.name?.toLocaleLowerCase().includes(searchQuery.toLocaleLowerCase())) : null;
        const rows = filtered ? filtered.slice((page - 1) * 30, page * 30) : Array.isArray(result) ? [] : (result.data ?? []);
        return {
          options: rows.flatMap((row) => (row.id && row.name ? [{ value: row.id, label: row.name }] : [])),
          hasNext: filtered ? filtered.length > page * 30 : Array.isArray(result) ? false : (result.pageIndex ?? page) < (result.pageCount ?? page),
          hasPrevious: page > 1,
        };
      } finally {
        signal.removeEventListener("abort", abort);
      }
    },
    [dispatch, departmentId],
  );
}
