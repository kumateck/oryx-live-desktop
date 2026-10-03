import { useEffect, useMemo, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { SettingsFormDialog, SettingsHeader } from "@/modules/settings-support/ui";
import { ConfirmActionDialog, TableMenu, TableMenuHeader } from "@/shared/actions";
import { PermissionGuard } from "@/shared/auth/permission-guard";
import { ClientDataTable, dataTableColumns } from "@/shared/datatable";
import { apiErrorMessage } from "@/shared/errors/api-error-message";
import type { WizardField } from "@/shared/forms/form-wizard";
import { InputTypes } from "@/shared/forms/input-types";
import { usePageSearch } from "@/shared/search/page-search";
import { dayFromServer, dayToServer, holidayApi, holidayAudit, holidayDay, holidayFormSchema, holidayPermissions, holidayRowsSchema, type Holiday, type HolidayFormValues } from "./holidays";

const fields: WizardField<HolidayFormValues>[] = [
  { type: InputTypes.TEXT, name: "name", label: "Holiday name", required: true, placeholder: "Eid al-Fitr" },
  { type: InputTypes.DATE, name: "date", label: "Date", required: true },
  { type: InputTypes.TEXT, name: "description", label: "Description", className: "md:col-span-2" },
];

function HolidayDialog({ holiday, onClose }: { holiday: Holiday | null; onClose: () => void }) {
  const [create, creating] = holidayApi.usePostApiV1HolidaysMutation();
  const [update, updating] = holidayApi.usePutApiV1HolidaysByIdMutation();
  const [message, setMessage] = useState("");
  const form = useForm<HolidayFormValues>({ resolver: zodResolver(holidayFormSchema), defaultValues: holiday ? { name: holiday.name, date: dayFromServer(holiday.date), description: holiday.description ?? "" } : { name: "", date: null, description: "" } });
  return <SettingsFormDialog title={holiday ? `Edit ${holiday.name}` : "Add a holiday"} description="Holidays are days the company does not work." form={form} fields={fields} saving={creating.isLoading || updating.isLoading} message={message}
    submitLabel={holiday ? "Save holiday" : "Add holiday"} onClose={onClose} onSubmit={async (values) => {
      setMessage("");
      if (!values.date) return;
      const body = { name: values.name, date: dayToServer(values.date), description: values.description || null };
      const result = holiday ? await update({ ...holidayAudit, id: holiday.id, domainEntitiesHolidaysCreateHolidayRequest: body }) : await create({ ...holidayAudit, domainEntitiesHolidaysCreateHolidayRequest: body });
      if ("error" in result) { setMessage(apiErrorMessage(result.error)); return; }
      toast.success(holiday ? "Holiday updated" : "Holiday added"); onClose();
    }} />;
}

const column = dataTableColumns<Holiday>();
export function HolidaysPage() {
  const [busy, setBusy] = useState(false);
  const search = usePageSearch("holidays", busy);
  const query = holidayApi.useGetApiV1HolidaysQuery({ ...holidayAudit, searchQuery: search });
  const [remove] = holidayApi.useDeleteApiV1HolidaysByIdMutation();
  const parsed = useMemo(() => query.data ? holidayRowsSchema.safeParse(query.data) : null, [query.data]);
  useEffect(() => { setBusy(query.isFetching); }, [query.isFetching]);
  const [editing, setEditing] = useState<Holiday | "new" | null>(null);
  const [removing, setRemoving] = useState<Holiday | null>(null);
  const columns = useMemo(() => column.columns([
    column.accessor("name", { header: "Holiday", cell: ({ row }) => <span className="font-medium">{row.original.name}</span> }),
    column.accessor("date", { header: "Date", size: 200, cell: ({ row }) => holidayDay(row.original.date) }),
    column.accessor((row) => row.description ?? "", { id: "description", header: "Description", cell: ({ row }) => row.original.description ?? <span className="text-muted-foreground">–</span> }),
    column.display({ id: "actions", size: 56, enableHiding: false, header: () => <TableMenuHeader />, cell: ({ row }) => <TableMenu label={`Actions for ${row.original.name}`} items={[
      { id: "edit", label: "Edit", icon: Pencil, require: holidayPermissions.edit, onSelect: () => setEditing(row.original) },
      { id: "remove", label: "Delete", icon: Trash2, require: holidayPermissions.remove, destructive: true, separated: true, onSelect: () => setRemoving(row.original) }]} /> }),
  ]), []);
  return <section className="page-fill">
    <SettingsHeader title="Holidays" description="The days the company does not work.">
      <PermissionGuard require={holidayPermissions.add}><Button type="button" size="sm" onClick={() => setEditing("new")}><Plus />Add holiday</Button></PermissionGuard>
    </SettingsHeader>
    <ClientDataTable label="Holidays" columns={columns} rows={parsed?.success ? parsed.data : []} getRowId={(row) => row.id} loading={query.isLoading} refreshing={query.isFetching && !query.isLoading}
      error={query.error ? apiErrorMessage(query.error) : parsed && !parsed.success ? "The server returned holidays the app could not read." : null} onRetry={() => { void query.refetch(); }}
      emptyTitle={search.trim() ? "No holidays match this search" : "No holidays"} emptyDescription={search.trim() ? "Search by holiday name." : "Add the first holiday."} />
    {editing ? <HolidayDialog key={editing === "new" ? "new" : editing.id} holiday={editing === "new" ? null : editing} onClose={() => setEditing(null)} /> : null}
    {removing ? <ConfirmActionDialog require={holidayPermissions.remove} title={`Delete ${removing.name}?`} description="The day will count as a working day again." confirmLabel="Delete holiday" busyLabel="Deleting…" onClose={() => setRemoving(null)}
      onConfirm={async () => { const result = await remove({ ...holidayAudit, id: removing.id }); if ("error" in result) return apiErrorMessage(result.error); toast.success("Holiday deleted"); return null; }} /> : null}
  </section>;
}
