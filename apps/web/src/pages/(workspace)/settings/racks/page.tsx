import { useState } from "react";
import { Plus } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { useDeleteApiV1WarehouseRackByRackIdMutation } from "@/modules/racks/api/rack-api";
import { RackDialog } from "@/modules/racks/components/rack-dialog";
import { RacksTable } from "@/modules/racks/components/racks-table";
import { useStorageRacks } from "@/modules/racks/hooks/use-storage-racks";
import { rackAudit, rackPermissions, sameForBothKinds } from "@/modules/racks/lib/rack-access";
import type { StorageRack } from "@/modules/racks/schemas/rack-schema";
import { ConfirmActionDialog } from "@/shared/actions";
import { NoAccess } from "@/shared/auth/no-access";
import { useAccess } from "@/shared/auth/use-access";
import { apiErrorMessage } from "@/shared/errors/api-error-message";
import { KindSwitch } from "@/shared/reference-data/kind-switch";
import { materialKindLabels, useKindTabs } from "@/shared/reference-data/kind-tabs";

const viewKinds = sameForBothKinds(rackPermissions.view);

export default function RacksPage() {
  const kinds = useKindTabs(viewKinds);
  const list = useStorageRacks(kinds.kind);
  const { has } = useAccess();
  const [remove] = useDeleteApiV1WarehouseRackByRackIdMutation();
  const [editing, setEditing] = useState<StorageRack | "new" | null>(null);
  const [removing, setRemoving] = useState<StorageRack | null>(null);
  if (kinds.kind === null) return <NoAccess />;
  const kind = kinds.kind;
  return <section className="page-fill">
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div><p className="eyebrow">SETTINGS</p><h1 className="text-xl font-semibold">Racks</h1></div>
      <div className="flex flex-wrap items-center gap-3">
        <KindSwitch tabs={kinds.tabs} kind={kind} onSelect={kinds.select} />
        {has(rackPermissions.add) ? <Button type="button" size="sm" onClick={() => setEditing("new")}><Plus />Add {materialKindLabels[kind].toLowerCase()} rack</Button> : null}
      </div>
    </div>
    <RacksTable rows={list.rows} search={list.search} paging={list.paging} loading={list.loading} refreshing={list.refreshing} error={list.error} onRetry={list.retry} onEdit={setEditing} onRemove={setRemoving} />
    {editing ? <RackDialog key={editing === "new" ? "new" : editing.id} kind={kind} rack={editing === "new" ? null : editing} onClose={() => setEditing(null)} /> : null}
    {removing ? <ConfirmActionDialog require={rackPermissions.remove} title={`Remove rack ${removing.name}?`} description={`The rack and its ${removing.shelves.length} ${removing.shelves.length === 1 ? "shelf" : "shelves"} will no longer be offered for storing stock.`}
      confirmLabel="Remove rack" busyLabel="Removing…" onClose={() => setRemoving(null)} onConfirm={async () => {
        const result = await remove({ ...rackAudit, rackId: removing.id });
        if ("error" in result) return apiErrorMessage(result.error);
        toast.success("Rack removed");
        return null;
      }} /> : null}
  </section>;
}
