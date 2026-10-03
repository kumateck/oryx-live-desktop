import { useCallback, useEffect, useMemo, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft, Pencil, Plus, Trash2 } from "lucide-react";
import { useForm } from "react-hook-form";
import { Link, useParams } from "react-router";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { departmentApi, departmentAudit } from "@/modules/departments/departments";
import { SettingsFormDialog, SettingsHeader } from "@/modules/settings-support/ui";
import { unitPageSchema, useGetUnitsPageQuery } from "@/modules/units-of-measure/units";
import { ConfirmActionDialog, TableMenu, TableMenuHeader } from "@/shared/actions";
import { PermissionGuard } from "@/shared/auth/permission-guard";
import { ServerDataTable, dataTableColumns, pageMeta, useServerTable } from "@/shared/datatable";
import { DetailGroup, DetailItem } from "@/shared/detail/detail-list";
import { apiErrorMessage } from "@/shared/errors/api-error-message";
import type { WizardField } from "@/shared/forms/form-wizard";
import type { SelectLoader } from "@/shared/forms/form-wizard-types";
import { InputTypes } from "@/shared/forms/input-types";
import { formatDate } from "@/shared/format/dates";
import { usePageSearch } from "@/shared/search/page-search";
import { DetailPageSkeleton } from "@/shared/skeleton/page-skeletons";
import { capacityText, equipmentApi, equipmentAudit, equipmentBody, equipmentDefaults, equipmentFormSchema, equipmentPath, equipmentPermissions, equipmentRowsSchema, equipmentSchema, yesNo, type Equipment, type EquipmentFormValues } from "./equipment";

/** Departments for a searchable picker, a page at a time. */
export function useDepartmentLoader(): SelectLoader {
  const [load] = departmentApi.useLazyGetApiV1DepartmentQuery();
  return useCallback(async (search, page) => {
    const result = await load({ ...departmentAudit, page, pageSize: 20, searchQuery: search }).unwrap();
    return { options: (result.data ?? []).flatMap((item) => item.id && item.name ? [{ value: item.id, label: item.name }] : []), hasNext: (result.pageIndex ?? 1) < (result.pageCount ?? 1), hasPrevious: page > 1 };
  }, [load]);
}

function EquipmentDialog({ item, onClose }: { item: Equipment | null; onClose: () => void }) {
  const [create, creating] = equipmentApi.usePostApiV1ProductEquipmentMutation();
  const [update, updating] = equipmentApi.usePutApiV1ProductEquipmentByEquipmentIdMutation();
  // Capacity is given in the units raw materials are measured in.
  const units = useGetUnitsPageQuery({ page: 1, pageSize: 100, searchQuery: "", types: [0] });
  const unitOptions = useMemo(() => { const parsed = unitPageSchema.safeParse(units.data ?? {}); return parsed.success ? parsed.data.rows.map((unit) => ({ value: unit.id, label: `${unit.name} (${unit.symbol})` })) : []; }, [units.data]);
  const departments = useDepartmentLoader();
  const [message, setMessage] = useState("");
  const form = useForm<EquipmentFormValues>({ resolver: zodResolver(equipmentFormSchema), defaultValues: equipmentDefaults(item) });
  const fields: WizardField<EquipmentFormValues>[] = [
    { type: InputTypes.TEXT, name: "number", label: "Equipment number", required: true },
    { type: InputTypes.TEXT, name: "name", label: "Equipment name", required: true },
    { type: InputTypes.TEXT, name: "model", label: "Model" },
    { type: InputTypes.TEXT, name: "serialNumber", label: "Serial number" },
    { type: InputTypes.RADIO, name: "isStorage", label: "Used for storage", required: true, options: [...yesNo] },
    { type: InputTypes.RADIO, name: "relevant", label: "Counts in capacity planning", required: true, options: [...yesNo] },
    { type: InputTypes.NUMBER, name: "capacity", label: "Capacity", description: "Required for storage equipment." },
    { type: InputTypes.SELECT, mode: "single", source: "sync", name: "unit", label: "Unit of the capacity", placeholder: units.isLoading ? "Loading units…" : "Select unit", options: unitOptions },
    { type: InputTypes.SELECT, mode: "single", source: "async", name: "department", label: "Department", required: true, placeholder: "Search for a department", loadOptions: departments },
    { type: InputTypes.TEXT, name: "location", label: "Storage location" },
  ];
  return <SettingsFormDialog title={item ? `Edit ${item.name}` : "Add equipment"} description="Production equipment, used on product routes and in capacity planning." form={form} fields={fields} saving={creating.isLoading || updating.isLoading} message={message}
    submitLabel={item ? "Save equipment" : "Add equipment"} onClose={onClose} onSubmit={async (values) => {
      setMessage("");
      const body = equipmentBody(values);
      const result = item ? await update({ ...equipmentAudit, equipmentId: item.id, domainEntitiesProductsEquipmentsCreateEquipmentRequest: body }) : await create({ ...equipmentAudit, domainEntitiesProductsEquipmentsCreateEquipmentRequest: body });
      if ("error" in result) { setMessage(apiErrorMessage(result.error)); return; }
      toast.success(item ? "Equipment updated" : "Equipment added"); onClose();
    }} />;
}

const column = dataTableColumns<Equipment>();
const yes = (value: boolean) => value ? "Yes" : "No";
export function EquipmentPage() {
  const [busy, setBusy] = useState(false);
  const search = usePageSearch("equipment", busy);
  const table = useServerTable({ pageSize: 50, resetKey: search });
  const query = equipmentApi.useGetApiV1ProductEquipmentQuery({ ...equipmentAudit, page: table.page, pageSize: table.pageSize, searchQuery: search });
  const [remove] = equipmentApi.useDeleteApiV1ProductEquipmentByEquipmentIdMutation();
  const parsed = useMemo(() => query.data ? equipmentRowsSchema.safeParse(query.data.data ?? []) : null, [query.data]);
  const rows = useMemo(() => parsed?.success ? parsed.data : [], [parsed]);
  const meta = pageMeta(query.data, table, rows.length);
  useEffect(() => { setBusy(query.isFetching); }, [query.isFetching]);
  const [editing, setEditing] = useState<Equipment | "new" | null>(null);
  const [removing, setRemoving] = useState<Equipment | null>(null);
  const columns = useMemo(() => column.columns([
    column.accessor("number", { header: "Equipment no.", size: 150 }),
    column.accessor("name", { header: "Name", cell: ({ row }) => <Link to={`${equipmentPath}/${row.original.id}/details`} className="break-words font-medium text-primary hover:underline">{row.original.name}</Link> }),
    column.accessor((row) => yes(row.isStorage), { id: "storage", header: "Storage", size: 100 }),
    column.accessor((row) => capacityText(row) ?? "", { id: "capacity", header: "Capacity", size: 140, cell: ({ row }) => <span className="whitespace-nowrap">{capacityText(row.original) ?? "–"}</span> }),
    column.accessor((row) => yes(row.relevant), { id: "relevant", header: "Capacity planning", size: 150 }),
    column.accessor((row) => row.department?.label ?? "", { id: "department", header: "Department", size: 180 }),
    column.accessor((row) => row.location ?? "", { id: "location", header: "Location", size: 160 }),
    column.display({ id: "actions", size: 56, enableHiding: false, header: () => <TableMenuHeader />, cell: ({ row }) => <TableMenu label={`Actions for ${row.original.name}`} items={[
      { id: "edit", label: "Edit", icon: Pencil, require: equipmentPermissions.edit, onSelect: () => setEditing(row.original) },
      { id: "remove", label: "Delete", icon: Trash2, require: equipmentPermissions.remove, destructive: true, separated: true, onSelect: () => setRemoving(row.original) }]} /> }),
  ]), []);
  return <section className="page-fill">
    <SettingsHeader title="Equipment" description="Production equipment, its capacity and where it stands.">
      <PermissionGuard require={equipmentPermissions.add}><Button type="button" size="sm" onClick={() => setEditing("new")}><Plus />Add equipment</Button></PermissionGuard>
    </SettingsHeader>
    <ServerDataTable label="Equipment" columns={columns} rows={rows} getRowId={(row) => row.id} page={table.page} pageSize={table.pageSize} totalRows={meta.totalRows} onPageChange={table.onPageChange} onPageSizeChange={table.onPageSizeChange}
      loading={query.isLoading} refreshing={query.isFetching && !query.isLoading} error={query.error ? apiErrorMessage(query.error) : parsed && !parsed.success ? "The server returned equipment the app could not read." : null} onRetry={() => { void query.refetch(); }}
      emptyTitle={search.trim() ? "No equipment matches this search" : "No equipment"} emptyDescription={search.trim() ? "Search by name or equipment number." : "Add the first piece of equipment."} />
    {editing ? <EquipmentDialog key={editing === "new" ? "new" : editing.id} item={editing === "new" ? null : editing} onClose={() => setEditing(null)} /> : null}
    {removing ? <ConfirmActionDialog require={equipmentPermissions.remove} title={`Delete ${removing.name}?`} description="The equipment will no longer be offered on routes or in planning." confirmLabel="Delete equipment" busyLabel="Deleting…" onClose={() => setRemoving(null)}
      onConfirm={async () => { const result = await remove({ ...equipmentAudit, equipmentId: removing.id }); if ("error" in result) return apiErrorMessage(result.error); toast.success("Equipment deleted"); return null; }} /> : null}
  </section>;
}

/** One piece of production equipment. */
export function EquipmentDetailPage() {
  const { id } = useParams();
  const query = equipmentApi.useGetApiV1ProductEquipmentByEquipmentIdQuery({ ...equipmentAudit, equipmentId: id ?? "" }, { skip: !id });
  const item = useMemo(() => { const parsed = equipmentSchema.safeParse(query.data ?? {}); return parsed.success ? parsed.data : null; }, [query.data]);
  const [editing, setEditing] = useState(false);
  const back = <Button asChild variant="ghost" size="sm"><Link to={equipmentPath}><ArrowLeft />Back to equipment</Link></Button>;
  if (query.isLoading) return <DetailPageSkeleton label="Loading equipment" />;
  if (query.error || !item) return <div role="alert" className="space-y-3">{back}<p>{query.error ? apiErrorMessage(query.error) : "This equipment record could not be found."}</p>{query.error ? <Button type="button" variant="outline" onClick={() => { void query.refetch(); }}>Retry</Button> : null}</div>;
  return <article className="min-w-0 space-y-4">
    <div className="flex flex-wrap items-start justify-between gap-3"><div className="min-w-0">{back}<p className="eyebrow">PRODUCTION EQUIPMENT · {item.number}</p><h1 className="text-xl font-semibold">{item.name}</h1></div>
      <PermissionGuard require={equipmentPermissions.edit}><Button type="button" size="sm" variant="outline" onClick={() => setEditing(true)}><Pencil />Edit</Button></PermissionGuard></div>
    <div className="grid gap-3 lg:grid-cols-3">
      <DetailGroup title="Equipment information"><DetailItem label="Equipment number" value={item.number} /><DetailItem label="Name" value={item.name} /><DetailItem label="Model" value={item.model} /><DetailItem label="Serial number" value={item.serialNumber} />
        <DetailItem label="Department" value={item.department?.label} /><DetailItem label="Storage location" value={item.location} /></DetailGroup>
      <DetailGroup title="Capacity and planning"><DetailItem label="Capacity" value={capacityText(item) ?? "Not specified"} /><DetailItem label="Storage equipment" value={yes(item.isStorage)} /><DetailItem label="Counts in capacity planning" value={yes(item.relevant)} /></DetailGroup>
      <DetailGroup title="Record information"><DetailItem label="Created" value={formatDate(item.createdAt)} /><DetailItem label="Created by" value={item.createdBy} /></DetailGroup>
    </div>
    {editing ? <EquipmentDialog item={item} onClose={() => setEditing(false)} /> : null}
  </article>;
}
