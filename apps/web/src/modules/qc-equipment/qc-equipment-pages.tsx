import { useEffect, useMemo, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft, Pencil, Plus, Trash2 } from "lucide-react";
import { useForm } from "react-hook-form";
import { Link, useParams } from "react-router";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { SettingsFormDialog, SettingsHeader } from "@/modules/settings-support/ui";
import { settingsApi } from "@/shared/api/generated/settings";
import { ConfirmActionDialog, TableMenu, TableMenuHeader } from "@/shared/actions";
import { PermissionGuard } from "@/shared/auth/permission-guard";
import { ServerDataTable, dataTableColumns, pageMeta, useServerTable } from "@/shared/datatable";
import { DetailGroup, DetailItem } from "@/shared/detail/detail-list";
import { apiErrorMessage } from "@/shared/errors/api-error-message";
import type { WizardField } from "@/shared/forms/form-wizard";
import { InputTypes } from "@/shared/forms/input-types";
import { formatDate } from "@/shared/format/dates";
import { usePageSearch } from "@/shared/search/page-search";
import { DetailPageSkeleton } from "@/shared/skeleton/page-skeletons";
import { qcEquipmentApi, qcEquipmentAudit, qcEquipmentBody, qcEquipmentFormSchema, qcEquipmentPath, qcEquipmentPermissions, qcEquipmentRowsSchema, qcEquipmentSchema, qualificationLabel, type QcEquipment, type QcEquipmentFormValues } from "./qc-equipment";

const categoryCollection = ["QcEquipmentCategory"];
/** The QC equipment categories, from Configuration Collections. */
function useCategories() {
  const [load, state] = settingsApi.usePostApiV1CollectionMutation();
  useEffect(() => { void load({ module: "General", subModule: "Collection", body: categoryCollection }); }, [load]);
  const options = useMemo(() => (state.data?.QcEquipmentCategory ?? []).flatMap((item) => item.id && item.name ? [{ value: item.id, label: item.name }] : []), [state.data]);
  return { options, loading: state.isLoading, error: state.error ? apiErrorMessage(state.error) : null };
}

function QcEquipmentDialog({ item, onClose }: { item: QcEquipment | null; onClose: () => void }) {
  const [create, creating] = qcEquipmentApi.usePostApiV1QcEquipmentMutation();
  const [update, updating] = qcEquipmentApi.usePutApiV1QcEquipmentByIdMutation();
  const categories = useCategories();
  const [message, setMessage] = useState("");
  const form = useForm<QcEquipmentFormValues>({ resolver: zodResolver(qcEquipmentFormSchema), defaultValues: item ? { equipmentId: item.equipmentId, serialNumber: item.serialNumber, name: item.name, make: item.make, model: item.model, category: item.category }
    : { equipmentId: "", serialNumber: "", name: "", make: "", model: "", category: null } });
  const fields: WizardField<QcEquipmentFormValues>[] = [
    { type: InputTypes.TEXT, name: "equipmentId", label: "Equipment ID", required: true },
    { type: InputTypes.TEXT, name: "serialNumber", label: "Serial number", required: true },
    { type: InputTypes.TEXT, name: "name", label: "Equipment name", required: true },
    { type: InputTypes.TEXT, name: "make", label: "Make", required: true },
    { type: InputTypes.TEXT, name: "model", label: "Model", required: true },
    { type: InputTypes.SELECT, mode: "single", source: "sync", name: "category", label: "Category", required: true, placeholder: categories.loading ? "Loading categories…" : "Select category", options: categories.options,
      ...(categories.error ? { description: `The categories could not be loaded: ${categories.error}` } : {}) },
  ];
  return <SettingsFormDialog title={item ? `Edit ${item.name}` : "Add QC equipment"} description="Laboratory instruments, identified by make, model and serial number." form={form} fields={fields} saving={creating.isLoading || updating.isLoading} message={message}
    submitLabel={item ? "Save equipment" : "Add equipment"} onClose={onClose} onSubmit={async (values) => {
      setMessage("");
      const body = qcEquipmentBody(values, item);
      const result = item ? await update({ ...qcEquipmentAudit, id: item.id, domainEntitiesProductsEquipmentsCreateQcEquipment: body }) : await create({ ...qcEquipmentAudit, domainEntitiesProductsEquipmentsCreateQcEquipment: body });
      if ("error" in result) { setMessage(apiErrorMessage(result.error)); return; }
      toast.success(item ? "Equipment updated" : "Equipment added"); onClose();
    }} />;
}

const column = dataTableColumns<QcEquipment>();
export function QcEquipmentPage() {
  const [busy, setBusy] = useState(false);
  const search = usePageSearch("QC equipment", busy);
  const table = useServerTable({ pageSize: 50, resetKey: search });
  const query = qcEquipmentApi.useGetApiV1QcEquipmentQuery({ ...qcEquipmentAudit, page: table.page, pageSize: table.pageSize, searchQuery: search });
  const [remove] = qcEquipmentApi.useDeleteApiV1QcEquipmentByIdMutation();
  const parsed = useMemo(() => query.data ? qcEquipmentRowsSchema.safeParse(query.data.data ?? []) : null, [query.data]);
  const rows = useMemo(() => parsed?.success ? parsed.data : [], [parsed]);
  const meta = pageMeta(query.data, table, rows.length);
  useEffect(() => { setBusy(query.isFetching); }, [query.isFetching]);
  const [editing, setEditing] = useState<QcEquipment | "new" | null>(null);
  const [removing, setRemoving] = useState<QcEquipment | null>(null);
  const columns = useMemo(() => column.columns([
    column.accessor("equipmentId", { header: "Equipment ID", size: 150 }),
    column.accessor("serialNumber", { header: "Serial number", size: 160 }),
    column.accessor("name", { header: "Name", cell: ({ row }) => <Link to={`${qcEquipmentPath}/${row.original.id}/details`} className="break-words font-medium text-primary hover:underline">{row.original.name}</Link> }),
    column.accessor("make", { header: "Make", size: 150 }),
    column.accessor("model", { header: "Model", size: 150 }),
    column.accessor((row) => row.category?.label ?? "", { id: "category", header: "Category", size: 180 }),
    column.display({ id: "actions", size: 56, enableHiding: false, header: () => <TableMenuHeader />, cell: ({ row }) => <TableMenu label={`Actions for ${row.original.name}`} items={[
      { id: "edit", label: "Edit", icon: Pencil, require: qcEquipmentPermissions.edit, onSelect: () => setEditing(row.original) },
      { id: "remove", label: "Delete", icon: Trash2, require: qcEquipmentPermissions.remove, destructive: true, separated: true, onSelect: () => setRemoving(row.original) }]} /> }),
  ]), []);
  return <section className="page-fill">
    <SettingsHeader title="QC equipment" description="The laboratory instruments tests are run on.">
      <PermissionGuard require={qcEquipmentPermissions.add}><Button type="button" size="sm" onClick={() => setEditing("new")}><Plus />Add equipment</Button></PermissionGuard>
    </SettingsHeader>
    <ServerDataTable label="QC equipment" columns={columns} rows={rows} getRowId={(row) => row.id} page={table.page} pageSize={table.pageSize} totalRows={meta.totalRows} onPageChange={table.onPageChange} onPageSizeChange={table.onPageSizeChange}
      loading={query.isLoading} refreshing={query.isFetching && !query.isLoading} error={query.error ? apiErrorMessage(query.error) : parsed && !parsed.success ? "The server returned equipment the app could not read." : null} onRetry={() => { void query.refetch(); }}
      emptyTitle={search.trim() ? "No equipment matches this search" : "No QC equipment"} emptyDescription={search.trim() ? "Search by name, equipment ID or serial number." : "Add the first instrument."} />
    {editing ? <QcEquipmentDialog key={editing === "new" ? "new" : editing.id} item={editing === "new" ? null : editing} onClose={() => setEditing(null)} /> : null}
    {removing ? <ConfirmActionDialog require={qcEquipmentPermissions.remove} title={`Delete ${removing.name}?`} description="The instrument will no longer be offered when tests are recorded." confirmLabel="Delete equipment" busyLabel="Deleting…" onClose={() => setRemoving(null)}
      onConfirm={async () => { const result = await remove({ ...qcEquipmentAudit, id: removing.id }); if ("error" in result) return apiErrorMessage(result.error); toast.success("Equipment deleted"); return null; }} /> : null}
  </section>;
}

/** One laboratory instrument. */
export function QcEquipmentDetailPage() {
  const { id } = useParams();
  const query = qcEquipmentApi.useGetApiV1QcEquipmentByIdQuery({ ...qcEquipmentAudit, id: id ?? "" }, { skip: !id });
  const item = useMemo(() => { const parsed = qcEquipmentSchema.safeParse(query.data ?? {}); return parsed.success ? parsed.data : null; }, [query.data]);
  const [editing, setEditing] = useState(false);
  const back = <Button asChild variant="ghost" size="sm"><Link to={qcEquipmentPath}><ArrowLeft />Back to QC equipment</Link></Button>;
  if (query.isLoading) return <DetailPageSkeleton label="Loading QC equipment" />;
  if (query.error || !item) return <div role="alert" className="space-y-3">{back}<p>{query.error ? apiErrorMessage(query.error) : "This QC equipment record could not be found."}</p>{query.error ? <Button type="button" variant="outline" onClick={() => { void query.refetch(); }}>Retry</Button> : null}</div>;
  const qualification = qualificationLabel(item.qualification);
  return <article className="min-w-0 space-y-4">
    <div className="flex flex-wrap items-start justify-between gap-3"><div className="min-w-0">{back}<p className="eyebrow">QC EQUIPMENT · {item.equipmentId}</p><h1 className="text-xl font-semibold">{item.name}</h1></div>
      <PermissionGuard require={qcEquipmentPermissions.edit}><Button type="button" size="sm" variant="outline" onClick={() => setEditing(true)}><Pencil />Edit</Button></PermissionGuard></div>
    <div className="grid gap-3 lg:grid-cols-3">
      <DetailGroup title="Equipment information"><DetailItem label="Equipment ID" value={item.equipmentId} /><DetailItem label="Name" value={item.name} /><DetailItem label="Category" value={item.category?.label} /><DetailItem label="Make" value={item.make} />
        <DetailItem label="Model" value={item.model} /><DetailItem label="Serial number" value={item.serialNumber} /></DetailGroup>
      <DetailGroup title="Calibration"><DetailItem label="Qualification" value={qualification ? <Badge variant={item.qualification === 0 ? "outline" : "destructive"}>{qualification}</Badge> : null} /><DetailItem label="Last calibrated" value={formatDate(item.lastCalibratedAt)} />
        <DetailItem label="Calibration due" value={formatDate(item.calibrationDueDate)} /></DetailGroup>
      <DetailGroup title="Record information"><DetailItem label="Created" value={formatDate(item.createdAt)} /><DetailItem label="Created by" value={item.createdBy} /></DetailGroup>
    </div>
    {editing ? <QcEquipmentDialog item={item} onClose={() => setEditing(false)} /> : null}
  </article>;
}
