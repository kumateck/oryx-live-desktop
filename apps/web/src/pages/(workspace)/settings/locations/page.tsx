import { useState } from "react";
import { Plus } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { LocationDialog } from "@/modules/locations/components/location-dialog";
import { LocationsTable } from "@/modules/locations/components/locations-table";
import { useDeleteApiV1WarehouseLocationByLocationIdMutation } from "@/modules/warehouses/api/store-api";
import { useStoreLocations } from "@/modules/warehouses/hooks/use-stores";
import { locationAudit, locationLabel, locationPermissions } from "@/modules/warehouses/lib/store-rules";
import type { StoreLocation } from "@/modules/warehouses/schemas/store-schema";
import { ConfirmActionDialog } from "@/shared/actions";
import { useAccess } from "@/shared/auth/use-access";
import { apiErrorMessage } from "@/shared/errors/api-error-message";

export default function LocationsPage() {
  const list = useStoreLocations();
  const { has } = useAccess();
  const [remove] = useDeleteApiV1WarehouseLocationByLocationIdMutation();
  const [editing, setEditing] = useState<StoreLocation | "new" | null>(null);
  const [removing, setRemoving] = useState<StoreLocation | null>(null);
  return <section className="page-fill">
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div><p className="eyebrow">SETTINGS</p><h1 className="text-xl font-semibold">Locations</h1></div>
      {has(locationPermissions.add) ? <Button type="button" size="sm" onClick={() => setEditing("new")}><Plus />Add location</Button> : null}
    </div>
    <LocationsTable rows={list.rows} search={list.search} paging={list.paging} loading={list.loading} refreshing={list.refreshing} error={list.error} onRetry={list.retry} onEdit={setEditing} onRemove={setRemoving} />
    {editing ? <LocationDialog key={editing === "new" ? "new" : editing.id} location={editing === "new" ? null : editing} onClose={() => setEditing(null)} /> : null}
    {removing ? <ConfirmActionDialog require={locationPermissions.remove} title={`Remove ${locationLabel(removing.name)}?`} description={`The location in ${removing.store ?? "its store"} will no longer be offered for racks.`} confirmLabel="Remove location" busyLabel="Removing…" onClose={() => setRemoving(null)}
      onConfirm={async () => { const result = await remove({ ...locationAudit, locationId: removing.id }); if ("error" in result) return apiErrorMessage(result.error); toast.success("Location removed"); return null; }} /> : null}
  </section>;
}
