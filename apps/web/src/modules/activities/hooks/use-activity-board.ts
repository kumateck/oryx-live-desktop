import { useMemo } from "react";
import { useCurrentUser } from "@/shared/auth/session-provider";
import { apiErrorMessage } from "@/shared/errors/api-error-message";
import { useGetApiV1ProductionScheduleActivityOperationGroupedQuery } from "../api/activity-api";
import { activityAudit, boardRefreshMs } from "../lib/activity-access";
import { activityBoardSchema } from "../schemas/activity-schema";

/** Every running batch in the user's department, grouped by the operation it is at, and kept current. */
export function useActivityBoard() {
  const user = useCurrentUser();
  const departmentId = user?.departmentId ?? null;
  const query = useGetApiV1ProductionScheduleActivityOperationGroupedQuery({ ...activityAudit, departmentId: departmentId ?? "" },
    { skip: !departmentId, pollingInterval: boardRefreshMs, skipPollingIfUnfocused: true, refetchOnFocus: true });
  const parsed = useMemo(() => query.data ? activityBoardSchema.safeParse(query.data) : null, [query.data]);
  return {
    department: user?.department ?? null,
    columns: parsed?.success ? parsed.data : [],
    loading: Boolean(departmentId) && query.isLoading,
    error: !departmentId ? "Your account has no department, so there is no production board to show."
      : query.error ? apiErrorMessage(query.error) : parsed && !parsed.success ? "The server returned a production board the app could not read." : null,
    retry: () => { void query.refetch(); },
  };
}
