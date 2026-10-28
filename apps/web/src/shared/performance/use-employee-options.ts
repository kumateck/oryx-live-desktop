import { useCallback } from "react";
import { hrApi } from "@/shared/api/generated/hr";
import { useApiDispatch } from "@/shared/api/use-api-dispatch";
import type { SelectLoader } from "@/shared/forms/form-wizard-types";
import { performanceAudit } from "./contracts";
export function usePerformanceEmployeeOptions(): SelectLoader {
  const dispatch = useApiDispatch();
  return useCallback(
    async (searchQuery, page, signal) => {
      const request = dispatch(
        hrApi.endpoints.getApiV1Employee.initiate(
          { ...performanceAudit, status: 0, searchQuery, page, pageSize: 30 },
          { subscribe: false, forceRefetch: true },
        ),
      );
      const abort = () => request.abort();
      signal.addEventListener("abort", abort, { once: true });
      try {
        if (signal.aborted) {
          abort();
          throw new Error("Employee search cancelled.");
        }
        const result = await request.unwrap();
        if ((result.data ?? []).some((row) => !row.id || row.status !== 0)) throw new Error("The active employee search could not be verified.");
        return {
          options: (result.data ?? []).flatMap((row) =>
            row.id ? [{ value: row.id, label: `${row.firstName ?? ""} ${row.lastName ?? ""} · ${row.staffNumber ?? ""}`.trim() }] : [],
          ),
          hasNext: (result.pageIndex ?? page) < (result.pageCount ?? page),
          hasPrevious: page > 1,
        };
      } finally {
        signal.removeEventListener("abort", abort);
      }
    },
    [dispatch],
  );
}
