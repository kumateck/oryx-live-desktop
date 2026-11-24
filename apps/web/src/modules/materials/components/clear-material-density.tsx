import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { ConfirmActionDialog } from "@/shared/actions";
import { usePermissionAction } from "@/shared/auth/use-permission-action";
import { apiErrorMessage } from "@/shared/errors/api-error-message";
import type { MaterialKind } from "@/shared/reference-data/kind-tabs";
import { materialApi } from "../api/material-api";
import { audit, materialPermissions } from "../lib/materials";

/** Clearing is explicit: an untouched or blank measurement field never removes shared data. */
export function ClearMaterialDensity({ material, onCleared }: {
  material: { id: string; name: string; kind: MaterialKind };
  onCleared: () => void;
}) {
  const requirement = materialPermissions.density[material.kind];
  const permission = usePermissionAction(requirement);
  const [confirming, setConfirming] = useState(false);
  const [clearRaw] = materialApi.useClearRawMaterialDensityMutation();
  const [clearPackaging] = materialApi.useClearPackagingMaterialDensityMutation();
  if (!permission.allowed) return null;
  return <>
    <Button type="button" variant="outline" size="sm" onClick={() => setConfirming(true)}>Clear density</Button>
    {confirming ? <ConfirmActionDialog require={requirement} title={`Clear density for ${material.name}?`}
      description="The shared density will become not set for every department. Stock quantities and existing reservation measurements stay unchanged. New mass-to-volume conversions will need a verified density."
      confirmLabel="Clear density" busyLabel="Clearing…" onClose={() => setConfirming(false)}
      onConfirm={async () => {
        const denied = permission.check();
        if (denied) return denied;
        const result = await (material.kind === 0 ? clearRaw : clearPackaging)({ ...audit, materialId: material.id });
        if ("error" in result) return apiErrorMessage(result.error);
        toast.success("Density cleared", { description: material.name });
        onCleared();
        return null;
      }} /> : null}
  </>;
}
