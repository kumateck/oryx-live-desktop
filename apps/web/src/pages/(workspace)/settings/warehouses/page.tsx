import { useState } from "react";
import { Plus } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { useDeleteApiV1WarehouseByWarehouseIdMutation } from "@/modules/warehouses/api/store-api";
import { StoreDialog } from "@/modules/warehouses/components/store-dialog";
import { StoresTable } from "@/modules/warehouses/components/stores-table";
import { useStores } from "@/modules/warehouses/hooks/use-stores";
import { storeAudit } from "@/modules/warehouses/lib/store-rules";
import type { Store } from "@/modules/warehouses/schemas/store-schema";
import { ConfirmActionDialog } from "@/shared/actions";
import { storePermission } from "@/modules/warehouses/lib/store-rules";
import { apiErrorMessage } from "@/shared/errors/api-error-message";

export default function StoresPage() {
  const list = useStores();
  const [remove] = useDeleteApiV1WarehouseByWarehouseIdMutation();
  const [editing, setEditing] = useState<Store | "new" | null>(null);
  const [removing, setRemoving] = useState<Store | null>(null);
  return <section className="page-fill">
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div><p className="eyebrow">SETTINGS</p><h1 className="text-xl font-semibold">Stores</h1></div>
      <Button type="button" size="sm" onClick={() => setEditing("new")}><Plus />Add store</Button>
    </div>
    <StoresTable rows={list.rows} search={list.search} paging={list.paging} loading={list.loading} refreshing={list.refreshing} error={list.error} onRetry={list.retry} onEdit={setEditing} onRemove={setRemoving} />
    {editing ? <StoreDialog key={editing === "new" ? "new" : editing.id} store={editing === "new" ? null : editing} onClose={() => setEditing(null)} /> : null}
    {removing ? <ConfirmActionDialog require={storePermission} title={`Remove ${removing.name}?`} description="The store will no longer be offered for locations or stock." confirmLabel="Remove store" busyLabel="Removing…" onClose={() => setRemoving(null)}
      onConfirm={async () => { const result = await remove({ ...storeAudit, warehouseId: removing.id }); if ("error" in result) return apiErrorMessage(result.error); toast.success("Store removed"); return null; }} /> : null}
  </section>;
}
