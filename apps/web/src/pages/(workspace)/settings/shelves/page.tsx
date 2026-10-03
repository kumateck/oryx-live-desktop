import { useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { sameForBothKinds, shelfPermissions } from "@/modules/racks/lib/rack-access";
import type { StorageShelf } from "@/modules/racks/schemas/rack-schema";
import { RemoveShelfDialog } from "@/modules/shelves/components/remove-shelf-dialog";
import { ShelfDialog } from "@/modules/shelves/components/shelf-dialog";
import { ShelvesTable } from "@/modules/shelves/components/shelves-table";
import { useStorageShelves } from "@/modules/shelves/hooks/use-storage-shelves";
import { NoAccess } from "@/shared/auth/no-access";
import { useAccess } from "@/shared/auth/use-access";
import { KindSwitch } from "@/shared/reference-data/kind-switch";
import { materialKindLabels, useKindTabs } from "@/shared/reference-data/kind-tabs";

const viewKinds = sameForBothKinds(shelfPermissions.view);

export default function ShelvesPage() {
  const kinds = useKindTabs(viewKinds);
  const list = useStorageShelves(kinds.kind);
  const { has } = useAccess();
  const [editing, setEditing] = useState<StorageShelf | "new" | null>(null);
  const [removing, setRemoving] = useState<StorageShelf | null>(null);
  if (kinds.kind === null) return <NoAccess />;
  const kind = kinds.kind;
  return <section className="page-fill">
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div><p className="eyebrow">SETTINGS</p><h1 className="text-xl font-semibold">Shelves</h1></div>
      <div className="flex flex-wrap items-center gap-3">
        <KindSwitch tabs={kinds.tabs} kind={kind} onSelect={kinds.select} />
        {has(shelfPermissions.add) ? <Button type="button" size="sm" onClick={() => setEditing("new")}><Plus />Add {materialKindLabels[kind].toLowerCase()} shelf</Button> : null}
      </div>
    </div>
    <ShelvesTable rows={list.rows} search={list.search} paging={list.paging} loading={list.loading} refreshing={list.refreshing} error={list.error} onRetry={list.retry} onEdit={setEditing} onRemove={setRemoving} />
    {editing ? <ShelfDialog key={editing === "new" ? "new" : editing.id} kind={kind} shelf={editing === "new" ? null : editing} onClose={() => setEditing(null)} /> : null}
    {removing ? <RemoveShelfDialog key={removing.id} shelf={removing} onClose={() => setRemoving(null)} /> : null}
  </section>;
}
