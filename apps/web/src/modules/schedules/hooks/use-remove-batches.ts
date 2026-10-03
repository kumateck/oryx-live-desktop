import { usePermissionAction } from "@/shared/auth/use-permission-action";
import { useState } from "react";
import { toast } from "sonner";
import { apiErrorMessage } from "@/shared/errors/api-error-message";
import { useDeleteApiV1ProductionScheduleProductByProductionScheduleProductIdMutation } from "../api/schedule-api";
import { audit, schedulePermissions } from "../lib/schedule-access";

export interface RemovalFailure { id: string; label: string; reason: string }

/** Takes chosen batches off a schedule one request at a time, and keeps the ones the server refused with its reason. */
export function useRemoveBatches() {
  const permission = usePermissionAction({ kind: "all", permissions: [schedulePermissions.removeProducts], departmentType: 0 });
  const [remove] = useDeleteApiV1ProductionScheduleProductByProductionScheduleProductIdMutation();
  const [removing, setRemoving] = useState(false);
  const [failures, setFailures] = useState<RemovalFailure[]>([]);

  const run = async (batches: readonly { id: string; label: string }[]): Promise<RemovalFailure[]> => {
    setRemoving(true); setFailures([]);
    const failed: RemovalFailure[] = [];
    let done = 0;
    for (const batch of batches) {
      const denied = permission.check();
      if (denied) { failed.push({ ...batch, reason: denied }); continue; }
      const result = await remove({ ...audit, productionScheduleProductId: batch.id });
      if ("error" in result) failed.push({ ...batch, reason: apiErrorMessage(result.error) }); else done += 1;
    }
    setFailures(failed); setRemoving(false);
    if (done > 0) toast.success(`${done} ${done === 1 ? "batch" : "batches"} removed`);
    return failed;
  };

  return { run, removing, failures };
}
