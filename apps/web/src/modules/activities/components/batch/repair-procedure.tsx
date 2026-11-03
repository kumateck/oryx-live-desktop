import { toast } from "sonner";
import { ConfirmActionDialog } from "@/shared/actions";
import { apiErrorMessage } from "@/shared/errors/api-error-message";
import { usePostApiV1ProductionScheduleActivityByProductionActivityIdRepairProcedureMutation } from "../../api/activity-api";
import { stepAudit } from "../../lib/activity-access";

/** Repairing a running batch from its product's procedure is a permission of its own. */
export const repairProcedurePermission = "CanRepairProcedure";

/** What the repair changed, as people say it. */
export function repairSummary(result: { stepsUpdated?: number; stepsAdded?: number; stepsRemoved?: number; stepsKept?: readonly string[] | null }): string {
  const count = (value: number | undefined, one: string) => `${value ?? 0} ${one}${value === 1 ? "" : "s"}`;
  const parts = [`${count(result.stepsUpdated, "step")} updated`];
  if (result.stepsAdded) parts.push(`${count(result.stepsAdded, "step")} added`);
  if (result.stepsRemoved) parts.push(`${count(result.stepsRemoved, "step")} removed`);
  const kept = result.stepsKept?.length ? ` Kept as they are, because they have started: ${result.stepsKept.join(", ")}.` : "";
  return `${parts.join(", ")}. Completed steps were not changed.${kept}`;
}

/**
 * Re-applies the product's current procedure to this batch, for the active step and the steps still
 * to do. Used one batch at a time, when the procedure was corrected after the batch started.
 */
export function ProcedureRepairDialog({ activityId, batchLabel, onClose }: { activityId: string; batchLabel: string; onClose: () => void }) {
  const [repair] = usePostApiV1ProductionScheduleActivityByProductionActivityIdRepairProcedureMutation();
  return <ConfirmActionDialog require={repairProcedurePermission} destructive={false} title={`Repair the procedure of ${batchLabel}?`}
      description="The active step and the steps still to do are brought in line with the product's procedure as it is now: operation, work centres, resources, critical flag, and the people responsible with their instruction and analytical raw data. Completed steps are not changed. A step the procedure no longer has is removed if it has not started."
      confirmLabel="Repair procedure" busyLabel="Repairing…" onClose={onClose}
      onConfirm={async () => {
        const result = await repair({ ...stepAudit, productionActivityId: activityId });
        if ("error" in result) return apiErrorMessage(result.error);
        toast.success("Procedure repaired", { description: repairSummary(result.data) });
        return null;
      }} />;
}
