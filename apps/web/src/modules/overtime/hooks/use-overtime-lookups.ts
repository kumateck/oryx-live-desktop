import { useCallback } from "react";
import { hrApi } from "@/shared/api/generated/hr";
import { identityApi } from "@/shared/api/generated/identity";
import { useApiDispatch } from "@/shared/api/use-api-dispatch";
import type { SelectPage } from "@/shared/forms/form-wizard-types";
import { overtimeAudit } from "../lib/overtime";
export function useOvertimeLookups(departmentId?: string) {
  const dispatch = useApiDispatch();
  return useCallback(
    async (kind: "department" | "employee", searchQuery: string, page: number, signal: AbortSignal): Promise<SelectPage> => {
      const settings = { subscribe: false, forceRefetch: true };
      if (kind === "employee" && !departmentId) return { options: [], hasNext: false, hasPrevious: false };
      const request =
        kind === "department"
          ? dispatch(identityApi.endpoints.getApiV1Department.initiate({ ...overtimeAudit, page, pageSize: 30, searchQuery }, settings))
          : dispatch(hrApi.endpoints.getApiV1EmployeeDepartmentsById.initiate({ ...overtimeAudit, id: departmentId ?? "" }, settings));
      const abort = () => request.abort();
      if (signal.aborted) {
        abort();
        throw new Error("Cancelled");
      }
      signal.addEventListener("abort", abort, { once: true });
      try {
        const result = await request.unwrap();
        if (Array.isArray(result)) {
          const rows = result
            .filter((row) => row.status === 0)
            .map((row) => ({ id: row.id, name: [row.firstName, row.lastName].filter(Boolean).join(" ") || row.staffNumber }))
            .filter((row) => row.name?.toLocaleLowerCase().includes(searchQuery.toLocaleLowerCase()));
          return {
            options: rows.slice((page - 1) * 30, page * 30).flatMap((row) => (row.id && row.name ? [{ value: row.id, label: row.name }] : [])),
            hasNext: rows.length > page * 30,
            hasPrevious: page > 1,
          };
        }
        return {
          options: (result.data ?? []).flatMap((row) => (row.id && row.name ? [{ value: row.id, label: row.name }] : [])),
          hasNext: (result.pageIndex ?? page) < (result.pageCount ?? page),
          hasPrevious: page > 1,
        };
      } finally {
        signal.removeEventListener("abort", abort);
      }
    },
    [dispatch, departmentId],
  );
}
