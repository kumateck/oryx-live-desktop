import { lazy, Suspense, useState } from "react";
import { Wrench } from "lucide-react";
import { DropdownButton } from "@/shared/actions";
import { issuedRepairPermissions, issuedRepairTitles, type RepairKind } from "../../schemas/issued-material-repair";

const RepairDialog = lazy(() => import("./issued-material-repair-dialog"));

export function IssuedMaterialRepairMenu({ batchId }: { batchId: string }) {
  const [kind, setKind] = useState<RepairKind | null>(null);
  return <>
    <DropdownButton label="Repair issued stock" icon={Wrench} items={[
      { id: "bom", label: issuedRepairTitles[0], require: issuedRepairPermissions[0], onSelect: () => setKind(0) },
      { id: "packaging", label: issuedRepairTitles[1], require: issuedRepairPermissions[1], onSelect: () => setKind(1) },
    ]} />
    {kind !== null ? <Suspense fallback={null}><RepairDialog batchId={batchId} kind={kind} onClose={() => setKind(null)} /></Suspense> : null}
  </>;
}
