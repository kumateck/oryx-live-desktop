import { useEffect, useMemo, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { SettingsFormDialog, SettingsHeader } from "@/modules/settings-support/ui";
import { ConfirmActionDialog, TableMenu, TableMenuHeader } from "@/shared/actions";
import { PermissionGuard } from "@/shared/auth/permission-guard";
import { ServerDataTable, dataTableColumns, useServerTable } from "@/shared/datatable";
import { apiErrorMessage } from "@/shared/errors/api-error-message";
import type { WizardField } from "@/shared/forms/form-wizard";
import { InputTypes } from "@/shared/forms/input-types";
import { usePageSearch } from "@/shared/search/page-search";
import { unitApi, unitAudit, unitCategories, unitCategoryLabel, unitDefaults, unitFormSchema, unitPageSchema, unitPermissions, unitTypeLabel, unitTypes, useGetUnitsPageQuery, type Unit, type UnitFormValues } from "./units";

const fields: WizardField<UnitFormValues>[] = [
  { type: InputTypes.SELECT, mode: "single", source: "sync", name: "type", label: "Type", required: true, placeholder: "Select type", options: [...unitTypes] },
  { type: InputTypes.SELECT, mode: "single", source: "sync", name: "category", label: "Category", required: true, placeholder: "Select category", options: [...unitCategories] },
  { type: InputTypes.TEXT, name: "name", label: "Name", required: true },
  { type: InputTypes.TEXT, name: "symbol", label: "Symbol", required: true },
  { type: InputTypes.TEXTAREA, name: "description", label: "Description", rows: 2, className: "md:col-span-2" },
];

function UnitDialog({ unit, onClose }: { unit: Unit | null; onClose: () => void }) {
  const [create, creating] = unitApi.usePostApiV1CollectionUomMutation();
  const [update, updating] = unitApi.usePutApiV1CollectionUomByUomIdMutation();
  const [message, setMessage] = useState("");
  const form = useForm<UnitFormValues>({ resolver: zodResolver(unitFormSchema), defaultValues: unitDefaults(unit) });
  return <SettingsFormDialog title={unit ? `Edit ${unit.name}` : "Add a unit of measure"} description="Units are offered wherever a quantity is recorded." form={form} fields={fields} saving={creating.isLoading || updating.isLoading} message={message}
    submitLabel={unit ? "Save unit" : "Add unit"} onClose={onClose} onSubmit={async (values) => {
      setMessage("");
      const type = ([0, 1, 2] as const).find((value) => String(value) === values.type?.value), category = ([0, 1, 2, 3, 4] as const).find((value) => String(value) === values.category?.value);
      if (type === undefined || category === undefined) return;
      // Whether the unit scales is not edited here, so it is sent back as it was.
      const body = { name: values.name, symbol: values.symbol, description: values.description ?? "", type, category, isScalable: unit?.isScalable ?? false };
      const result = unit ? await update({ ...unitAudit, uomId: unit.id, domainEntitiesBaseCreateUnitOfMeasure: body }) : await create({ ...unitAudit, domainEntitiesBaseCreateUnitOfMeasure: body });
      if ("error" in result) { setMessage(apiErrorMessage(result.error)); return; }
      toast.success(unit ? "Unit updated" : "Unit added"); onClose();
    }} />;
}

const column = dataTableColumns<Unit>();
export function UnitsPage() {
  const [busy, setBusy] = useState(false);
  const search = usePageSearch("units of measure", busy);
  const table = useServerTable({ pageSize: 50, resetKey: search });
  const query = useGetUnitsPageQuery({ page: table.page, pageSize: table.pageSize, searchQuery: search });
  const [remove] = unitApi.useDeleteApiV1CollectionUomByUomIdMutation();
  const parsed = useMemo(() => query.data ? unitPageSchema.safeParse(query.data) : null, [query.data]);
  const rows = useMemo(() => parsed?.success ? parsed.data.rows : [], [parsed]);
  useEffect(() => { setBusy(query.isFetching); }, [query.isFetching]);
  const [editing, setEditing] = useState<Unit | "new" | null>(null);
  const [removing, setRemoving] = useState<Unit | null>(null);
  const columns = useMemo(() => column.columns([
    column.accessor("name", { header: "Name", cell: ({ row }) => <span className="font-medium">{row.original.name}</span> }),
    column.accessor("symbol", { header: "Symbol", size: 120 }),
    column.accessor((row) => unitTypeLabel(row.type), { id: "type", header: "Type", size: 140 }),
    column.accessor((row) => unitCategoryLabel(row.category), { id: "category", header: "Category", size: 150 }),
    column.accessor((row) => row.description ?? "", { id: "description", header: "Description", cell: ({ row }) => row.original.description ?? <span className="text-muted-foreground">–</span> }),
    column.display({ id: "actions", size: 56, enableHiding: false, header: () => <TableMenuHeader />, cell: ({ row }) => <TableMenu label={`Actions for ${row.original.name}`} items={[
      { id: "edit", label: "Edit", icon: Pencil, require: unitPermissions.edit, onSelect: () => setEditing(row.original) },
      { id: "remove", label: "Delete", icon: Trash2, require: unitPermissions.remove, destructive: true, separated: true, onSelect: () => setRemoving(row.original) }]} /> }),
  ]), []);
  return <section className="page-fill">
    <SettingsHeader title="Units of measure" description="The units quantities are recorded in.">
      <PermissionGuard require={unitPermissions.add}><Button type="button" size="sm" onClick={() => setEditing("new")}><Plus />Add unit</Button></PermissionGuard>
    </SettingsHeader>
    <ServerDataTable label="Units of measure" columns={columns} rows={rows} getRowId={(row) => row.id} page={table.page} pageSize={table.pageSize} totalRows={parsed?.success ? Math.max(parsed.data.totalRecordCount, rows.length) : 0} onPageChange={table.onPageChange} onPageSizeChange={table.onPageSizeChange}
      loading={query.isLoading} refreshing={query.isFetching && !query.isLoading} error={query.error ? apiErrorMessage(query.error) : parsed && !parsed.success ? "The server returned units the app could not read." : null} onRetry={() => { void query.refetch(); }}
      emptyTitle={search.trim() ? "No units match this search" : "No units of measure"} emptyDescription={search.trim() ? "Search by name or symbol." : "Add the first unit."} />
    {editing ? <UnitDialog key={editing === "new" ? "new" : editing.id} unit={editing === "new" ? null : editing} onClose={() => setEditing(null)} /> : null}
    {removing ? <ConfirmActionDialog require={unitPermissions.remove} title={`Delete ${removing.name}?`} description="The unit will no longer be offered. Records that already use it keep it." confirmLabel="Delete unit" busyLabel="Deleting…" onClose={() => setRemoving(null)}
      onConfirm={async () => { const result = await remove({ ...unitAudit, uomId: removing.id }); if ("error" in result) return apiErrorMessage(result.error); toast.success("Unit deleted"); return null; }} /> : null}
  </section>;
}
