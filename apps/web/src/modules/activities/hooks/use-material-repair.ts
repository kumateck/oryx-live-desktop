import { useCallback, useState } from "react";
import { toast } from "sonner";
import { useAccess } from "@/shared/auth/use-access";
import { permissionDeniedMessage } from "@/shared/auth/use-permission-action";
import { useVerifiedMutation } from "@/shared/workflows/use-verified-mutation";
import { randomId } from "@/shared/ids/random-id";
import { apiErrorMessage } from "@/shared/errors/api-error-message";
import { activityApi } from "../api/activity-api";
import { stepAudit } from "../lib/activity-access";
import { materialRepairs, type MaterialRepairKind } from "../lib/material-repair";
import { materialRepairPreviewSchema, type MaterialRepairPreview } from "../schemas/material-repair-schema";

export function useMaterialRepairPreview(activityId: string, kind: MaterialRepairKind) {
  const { allowsNow } = useAccess();
  const [bom] = activityApi.useLazyPreviewProductionBomRepairQuery();
  const [packaging] = activityApi.useLazyPreviewProductionPackagingRepairQuery();
  return useCallback(async () => {
    if (!allowsNow(materialRepairs[kind].permission)) throw new Error(permissionDeniedMessage);
    const result = await (kind === "bom" ? bom : packaging)({ ...stepAudit, activityId }, false);
    if ("error" in result && result.error) throw new Error(apiErrorMessage(result.error));
    const parsed = materialRepairPreviewSchema.safeParse(result.data);
    if (!parsed.success || parsed.data.activityId !== activityId || parsed.data.kind !== (kind === "bom" ? 0 : 1))
      throw new Error("The server returned an invalid repair preview. Reload before continuing.");
    return parsed.data;
  }, [activityId, kind, allowsNow, bom, packaging]);
}

export function useMaterialRepairApply(activityId: string, kind: MaterialRepairKind, preview: MaterialRepairPreview) {
  const guard = useVerifiedMutation(materialRepairs[kind].permission, preview);
  const read = useMaterialRepairPreview(activityId, kind);
  const [bom] = activityApi.useApplyProductionBomRepairMutation();
  const [packaging] = activityApi.useApplyProductionPackagingRepairMutation();
  const [requestId] = useState(randomId);
  const submit = (reason: string) => guard.run(preview, read, async (fresh) => {
    if (fresh.blockers.length || !fresh.hasChanges) throw new Error("This repair cannot be applied. Review a fresh preview.");
    const result = await (kind === "bom" ? bom : packaging)({ ...stepAudit, activityId,
      domainEntitiesProductsProductionApplyProductionMaterialRepair: { requestId, previewHash: fresh.previewHash, reason } });
    if ("error" in result) throw new Error(apiErrorMessage(result.error));
    toast.success(result.data.changed ? `${materialRepairs[kind].label} repaired` : "No repair needed", {
      description: result.data.approvalRequired ? "The corrected requisition needs fresh approval before stock can be issued." : "The batch now uses the saved product configuration.",
    });
  });
  return { ...guard, submit };
}
