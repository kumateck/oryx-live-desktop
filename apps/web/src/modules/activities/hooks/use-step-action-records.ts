import { useAccess } from "@/shared/auth/use-access";
import { apiErrorMessage } from "@/shared/errors/api-error-message";
import { useGetProductionStepRecordsQuery } from "../api/activity-api";
import { activityAudit, boardRefreshMs } from "../lib/activity-access";
import { stepRecordsSchema } from "../schemas/step-records-schema";

/** Read evidence for the selected step; never mounts the mutable action controller. */
export function useStepActionRecords({ activityId, stepId, batchId, completed }: {
  activityId: string; stepId: string; batchId: string | null; completed: boolean;
}) {
  const access = useAccess();
  const allowed = access.allows({ kind: "all", permissions: ["CanViewPlannedProducts"], departmentType: 0 });
  const query = useGetProductionStepRecordsQuery({ ...activityAudit, activityId, stepId }, {
    skip: !allowed || !batchId, pollingInterval: completed ? 0 : boardRefreshMs,
    skipPollingIfUnfocused: true, refetchOnFocus: true, refetchOnReconnect: true,
  });
  const retry = () => { void query.refetch(); };
  if (!allowed) return { kind: "denied" as const };
  if (!batchId) return { kind: "error" as const, message: "This production run has no batch identity.", retry };
  if (query.error) return { kind: "error" as const, message: apiErrorMessage(query.error), retry };
  if (query.isLoading || query.currentData === undefined) return { kind: "loading" as const };
  const parsed = stepRecordsSchema.safeParse(query.currentData);
  if (!parsed.success || parsed.data.stepId !== stepId || parsed.data.productionScheduleProductId !== batchId) {
    return { kind: "error" as const, message: "The server returned action records that could not be verified for this step.", retry };
  }
  return { kind: "ready" as const, data: parsed.data, refreshing: query.isFetching };
}
