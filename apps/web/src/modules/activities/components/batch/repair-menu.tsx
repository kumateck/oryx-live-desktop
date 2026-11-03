import { useState } from "react";
import { Wrench } from "lucide-react";
import { DropdownButton } from "@/shared/actions";
import { materialRepairs, type MaterialRepairKind } from "../../lib/material-repair";
import { ProcedureRepairDialog, repairProcedurePermission } from "./repair-procedure";
import { MaterialRepairDialog } from "./material-repair-dialog";

export function RepairMenu({ activityId, batchLabel }: { activityId: string; batchLabel: string }) {
  const [open, setOpen] = useState<"procedure" | MaterialRepairKind | null>(null);
  return <>
    <DropdownButton label="Repair" icon={Wrench} items={[
      { id: "procedure", label: "Procedure", description: "Apply the product’s saved procedure to active and upcoming steps. Completed steps stay unchanged.", require: repairProcedurePermission, onSelect: () => setOpen("procedure") },
      ...(["bom", "packaging"] as const).map((kind) => ({ id: kind, label: materialRepairs[kind].label,
        description: materialRepairs[kind].description, require: materialRepairs[kind].permission, onSelect: () => setOpen(kind) })),
    ]} />
    {open === "procedure" ? <ProcedureRepairDialog activityId={activityId} batchLabel={batchLabel} onClose={() => setOpen(null)} /> : null}
    {open === "bom" || open === "packaging" ? <MaterialRepairDialog key={open} kind={open} activityId={activityId} batchLabel={batchLabel} onClose={() => setOpen(null)} /> : null}
  </>;
}
