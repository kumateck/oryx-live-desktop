import { useCallback } from "react";
import { hrApi } from "@/shared/api/generated/hr";
import { identityApi } from "@/shared/api/generated/identity";
import { useApiDispatch } from "@/shared/api/use-api-dispatch";
import type { SelectPage } from "@/shared/forms/form-wizard-types";
import { leaveAudit } from "../lib/leave";
export function useLeaveLookups(designationId?: string) {
  const dispatch = useApiDispatch();
  return useCallback(
    async (kind: "employee" | "type" | "department", searchQuery: string, page: number, signal: AbortSignal): Promise<SelectPage> => {
      if (kind === "type" && !designationId) return { options: [], hasNext: false, hasPrevious: false };
      const args = { ...leaveAudit, searchQuery, page, pageSize: 30 };
      const settings = { subscribe: false, forceRefetch: true };
      const request =
        kind === "employee"
          ? dispatch(hrApi.endpoints.getApiV1Employee.initiate({ ...args, status: 0 }, settings))
          : kind === "department"
            ? dispatch(identityApi.endpoints.getApiV1Department.initiate(args, settings))
            : dispatch(hrApi.endpoints.getApiV1LeaveType.initiate({ ...args, ...(designationId ? { designationId } : {}) }, settings));
      const abort = () => request.abort();
      if (signal.aborted) {
        abort();
        throw new Error("Cancelled");
      }
      signal.addEventListener("abort", abort, { once: true });
      try {
        const result = await request.unwrap();
        return {
          options: (result.data ?? []).flatMap((row) => {
            const label = "firstName" in row ? [row.firstName, row.lastName].filter(Boolean).join(" ") : "name" in row ? row.name : null;
            if ("isActive" in row && row.isActive !== true) return [];
            return row.id && label ? [{ value: row.id, label }] : [];
          }),
          hasNext: (result.pageIndex ?? page) < (result.pageCount ?? page),
          hasPrevious: page > 1,
        };
      } finally {
        signal.removeEventListener("abort", abort);
      }
    },
    [dispatch, designationId],
  );
}
