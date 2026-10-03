import { MaterialPicker } from "@/modules/requisitions/components/material-picker";
import { pickMaterialPermissions } from "@/modules/requisitions/lib/requisition-access";
import { NoAccess } from "@/shared/auth/no-access";
import { KindSwitch } from "@/shared/reference-data/kind-switch";
import { useKindTabs } from "@/shared/reference-data/kind-tabs";

export default function CreateRequisitionPage() {
  const kinds = useKindTabs(pickMaterialPermissions);
  if (kinds.kind === null) return <NoAccess />;
  return <section className="page-fill">
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div><p className="eyebrow">PRODUCTION</p><h1 className="text-xl font-semibold">Create purchase requisition</h1></div>
      <KindSwitch tabs={kinds.tabs} kind={kinds.kind} onSelect={kinds.select} />
    </div>
    {/* A requisition is for one kind of material, so switching kind starts the choice afresh. */}
    <MaterialPicker key={kinds.kind} kind={kinds.kind} />
  </section>;
}
