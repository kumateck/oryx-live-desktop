import { useRef, useState } from "react";
import { toast } from "sonner";
import { apiErrorMessage } from "@/shared/errors/api-error-message";
import { activityApi, usePostApiV1ProductionScheduleReturnBeforeProductionMutation, usePutApiV1ProductionScheduleActivityStepByProductionStepIdStatusMutation } from "../api/activity-api";
import { stepAudit } from "../lib/activity-access";
import { extraMaterialStatus, stepStatus } from "../lib/step-status";
import { usePermissionAction } from "@/shared/auth/use-permission-action";
import { extraMaterialsSchema } from "../schemas/activity-schema";

/** Starting and finishing a step, and returning a batch's materials. Each reports the server's reason when refused. */
export function useStepCommands(stepId: string, batchId: string | null) {
  const permission = usePermissionAction({ kind: "all", permissions: ["CanViewPlannedProducts"], departmentType: 0 });
  const [update] = usePutApiV1ProductionScheduleActivityStepByProductionStepIdStatusMutation();
  const [readExtra] = activityApi.useLazyGetApiV1ProductionScheduleExtraPackingByProductByProductionScheduleProductIdQuery();
  const [returnAll] = usePostApiV1ProductionScheduleReturnBeforeProductionMutation();
  const [busy, setBusy] = useState<"start" | "complete" | "return" | null>(null);
  const [message, setMessage] = useState("");
  // A second click while the first request is on its way must not send it again: starting a step issues materials.
  const lock = useRef(false);

  const change = async (kind: "start" | "complete"): Promise<boolean> => {
    const denied = permission.check();
    if (denied) { setMessage(denied); return false; }
    if (lock.current) return false;
    lock.current = true; setBusy(kind); setMessage("");
    try {
      if (!batchId) { setMessage("The batch could not be identified."); return false; }
      // Approval and warehouse issue are separate transitions. Refresh before writing, even
      // when the confirmation was opened with no outstanding requests.
      const evidence = await readExtra({ ...stepAudit, productionScheduleProductId: batchId }, false);
      const notFound = evidence.error && "status" in evidence.error && evidence.error.status === 404;
      if (evidence.error && !notFound) { setMessage(apiErrorMessage(evidence.error)); return false; }
      const extras = extraMaterialsSchema.safeParse(notFound ? null : evidence.data);
      if (!extras.success) { setMessage("Extra material issue status could not be verified. Refresh and try again."); return false; }
      const outstanding = extras.data.some((status) => kind === "complete" ? status !== extraMaterialStatus.issued : status === extraMaterialStatus.pending);
      if (outstanding) {
        setMessage(kind === "complete" ? "All extra material must be approved and issued before completing this step." : "Extra material is waiting for approval. This step cannot be started yet.");
        return false;
      }
      const deniedAfterCheck = permission.check();
      if (deniedAfterCheck) { setMessage(deniedAfterCheck); return false; }
      const result = await update({ ...stepAudit, productionStepId: stepId, status: kind === "start" ? stepStatus.inProgress : stepStatus.completed });
      if ("error" in result) { setMessage(apiErrorMessage(result.error)); return false; }
      toast.success(kind === "start" ? "Step started" : "Step completed");
      return true;
    } finally { lock.current = false; setBusy(null); }
  };

  const fullReturn = async (reason: string): Promise<string | null> => {
    const denied = permission.check();
    if (denied) return denied;
    if (!batchId) return "The batch could not be identified.";
    setBusy("return");
    try {
      const result = await returnAll({ module: "Production", subModule: "Returns", productionScheduleProductId: batchId, reason });
      if ("error" in result) return apiErrorMessage(result.error);
      toast.success("Materials returned and production cancelled");
      return null;
    } finally { setBusy(null); }
  };

  return { start: () => change("start"), complete: () => change("complete"), fullReturn, busy, message };
}
export type StepCommands = ReturnType<typeof useStepCommands>;
