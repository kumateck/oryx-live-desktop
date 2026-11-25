import { useState } from "react";
import { RotateCcw } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { PermissionGuard } from "@/shared/auth/permission-guard";
import { usePermissionAction } from "@/shared/auth/use-permission-action";
import { apiErrorMessage } from "@/shared/errors/api-error-message";
import { usePostApiV1ProductionScheduleReturnBeforeProductionMutation } from "../../api/activity-api";
import { batchTask, batchTaskPermissions } from "../../lib/activity-access";
import type { Activity } from "../../schemas/activity-schema";
import { ReasonDialog } from "../step/reason-dialog";

const permission = batchTask(batchTaskPermissions.returns);

/** Cancelling an unconsumed batch is available even while just one stock kind has been issued. */
export function FullProductionReturn({ activity }: { activity: Activity }) {
  const [open, setOpen] = useState(false);
  const action = usePermissionAction(permission);
  const [returnAll, state] = usePostApiV1ProductionScheduleReturnBeforeProductionMutation();
  const batchId = activity.batch.id;
  const consumption = activity.steps.find(step => step.name.startsWith("Product Preparation") || step.name.startsWith("Final Packing"));
  const consumed = consumption && activity.steps.some(step => step.order >= consumption.order
    && (step.startedAt || step.completedAt || step.status === 1 || step.status === 2));
  if (!batchId || consumed || activity.batch.cancelled || activity.status === 2 || activity.status === 4) return null;
  return <PermissionGuard require={permission}>
    <Button type="button" variant="outline" size="sm" disabled={state.isLoading} onClick={() => setOpen(true)}><RotateCcw />Full return</Button>
    {open ? <ReasonDialog title="Return issued stock and cancel batch?"
      description={`${activity.batch.productName}${activity.batch.batchNumber ? ` · ${activity.batch.batchNumber}` : ""}. Only materials already issued will go to the Full return page for warehouse receipt and shelf allocation. Unissued reservations will be released. The batch number becomes available for reuse. Any recorded consumption blocks this action.`}
      confirmLabel="Return and cancel" busyLabel="Returning…" onClose={() => setOpen(false)} onConfirm={async reason => {
        const denied = action.check();
        if (denied) return denied;
        const result = await returnAll({ module: "Production", subModule: "Returns", productionScheduleProductId: batchId, reason });
        if ("error" in result) return apiErrorMessage(result.error);
        toast.success("Batch cancelled. Issued stock is awaiting warehouse receipt and shelving.");
        return null;
      }} /> : null}
  </PermissionGuard>;
}
