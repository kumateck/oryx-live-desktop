import { useEffect, useMemo, useState, type ReactNode } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { useForm, type FieldValues } from "react-hook-form";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { departmentApi, departmentAudit } from "@/modules/departments/departments";
import { dayFromServer, dayToServer } from "@/modules/holidays/holidays";
import { SettingsFormDialog, SettingsHeader } from "@/modules/settings-support/ui";
import { ConfirmActionDialog, TableMenu, TableMenuHeader } from "@/shared/actions";
import { PermissionGuard } from "@/shared/auth/permission-guard";
import { ClientDataTable, ServerDataTable, dataTableColumns, pageMeta, useServerTable, type DataTableColumn, type DataTableRow } from "@/shared/datatable";
import { apiErrorMessage } from "@/shared/errors/api-error-message";
import type { WizardField } from "@/shared/forms/form-wizard";
import { InputTypes } from "@/shared/forms/input-types";
import { formatDate } from "@/shared/format/dates";
import { usePageSearch } from "@/shared/search/page-search";
import { dayOptions, daysText, frequencyLabel, frequencyOptions, policyApi, policyDefaults, policyFormSchema, policyInForce, policyRowsSchema, rotationLabel, rotationOptions, scheduleChangeBlock, scheduleStatuses, shiftApi, shiftAudit,
  shiftCategoryFormSchema, shiftCategoryRowsSchema, shiftHours, shiftPermissions, shiftScheduleFormSchema, shiftScheduleRowsSchema, shiftTypeDefaults, shiftTypeFormSchema, shiftTypeRowsSchema, tomorrow,
  type PolicyFormValues, type ShiftCategory, type ShiftCategoryFormValues, type ShiftSchedule, type ShiftScheduleFormValues, type ShiftType, type ShiftTypeFormValues, type WorkingHoursPolicy } from "./shifts";

interface PageQuery { data?: { data?: unknown; pageIndex?: number; totalRecordCount?: number } | undefined; error?: Parameters<typeof apiErrorMessage>[0]; isLoading: boolean; isFetching: boolean; refetch: () => unknown }
/** The list page every shift setting shares: heading, Add button, a paged and searched table, and the two dialogs. */
function ShiftListPage<TRow extends DataTableRow & { id: string; name: string }>({ title, description, noun, addPermission, removePermission, columns, rows, unreadable, query, table, search, dialog, onRemove, removeNote }: {
  title: string; description: string; noun: string; addPermission: string; removePermission: string; columns: (edit: (row: TRow) => void, remove: (row: TRow) => void) => DataTableColumn<TRow>[]; rows: readonly TRow[]; unreadable: boolean; query: PageQuery;
  table: ReturnType<typeof useServerTable>; search: string; dialog: (row: TRow | null, close: () => void) => ReactNode; onRemove: (row: TRow) => Promise<string | null>; removeNote: string;
}) {
  const [editing, setEditing] = useState<TRow | "new" | null>(null);
  const [removing, setRemoving] = useState<TRow | null>(null);
  const shown = useMemo(() => columns(setEditing, setRemoving), [columns]);
  const meta = pageMeta(query.data, table, rows.length);
  return <section className="page-fill">
    <SettingsHeader title={title} description={description}><PermissionGuard require={addPermission}><Button type="button" size="sm" onClick={() => setEditing("new")}><Plus />Add {noun}</Button></PermissionGuard></SettingsHeader>
    <ServerDataTable label={title} columns={shown} rows={rows} getRowId={(row) => row.id} page={table.page} pageSize={table.pageSize} totalRows={meta.totalRows} onPageChange={table.onPageChange} onPageSizeChange={table.onPageSizeChange}
      loading={query.isLoading} refreshing={query.isFetching && !query.isLoading} error={query.error ? apiErrorMessage(query.error) : unreadable ? `The server returned ${title.toLowerCase()} the app could not read.` : null} onRetry={() => { void query.refetch(); }}
      emptyTitle={search.trim() ? `No ${title.toLowerCase()} match this search` : `No ${title.toLowerCase()}`} emptyDescription={search.trim() ? "Search by name." : `Add the first ${noun}.`} />
    {editing ? dialog(editing === "new" ? null : editing, () => setEditing(null)) : null}
    {removing ? <ConfirmActionDialog require={removePermission} title={`Delete ${removing.name}?`} description={removeNote} confirmLabel={`Delete ${noun}`} busyLabel="Deleting…" onClose={() => setRemoving(null)} onConfirm={() => onRemove(removing)} /> : null}
  </section>;
}
function useList(label: string) {
  const [busy, setBusy] = useState(false);
  const search = usePageSearch(label, busy);
  const table = useServerTable({ pageSize: 50, resetKey: search });
  return { search, table, setBusy };
}
const menu = <TRow extends { name: string }>(row: TRow, permissions: { edit: string; remove: string }, edit: (row: TRow) => void, remove: (row: TRow) => void, block: string | null = null) => <TableMenu label={`Actions for ${row.name}`} items={[
  { id: "edit", label: "Edit", icon: Pencil, require: permissions.edit, onSelect: () => edit(row), ...(block ? { disabled: true, disabledReason: block } : {}) },
  { id: "remove", label: "Delete", icon: Trash2, require: permissions.remove, destructive: true, separated: true, onSelect: () => remove(row), ...(block ? { disabled: true, disabledReason: block } : {}) }]} />;
const actions = <TRow extends DataTableRow & { name: string }>(column: ReturnType<typeof dataTableColumns<TRow>>, cell: (row: TRow) => ReactNode) => column.display({ id: "actions", size: 56, enableHiding: false, header: () => <TableMenuHeader />, cell: ({ row }) => cell(row.original) });
function useSave<TValues extends FieldValues>(run: (values: TValues) => Promise<{ error?: Parameters<typeof apiErrorMessage>[0] } | object>, done: string, close: () => void) {
  const [message, setMessage] = useState("");
  return { message, submit: async (values: TValues) => { setMessage(""); const result = await run(values); if ("error" in result && result.error) { setMessage(apiErrorMessage(result.error)); return; } toast.success(done); close(); } };
}

// ----- shift types
const typeColumn = dataTableColumns<ShiftType>();
const typeFields: WizardField<ShiftTypeFormValues>[] = [
  { type: InputTypes.TEXT, name: "name", label: "Shift name", required: true, placeholder: "Afternoon shift" },
  { type: InputTypes.SELECT, mode: "single", source: "sync", name: "rotation", label: "Shift category", required: true, placeholder: "Select category", options: [...rotationOptions] },
  { type: InputTypes.CLOCK, name: "startTime", label: "Start time", required: true },
  { type: InputTypes.CLOCK, name: "endTime", label: "End time", required: true, description: "A shift that ends earlier than it starts runs into the next day." },
  { type: InputTypes.SELECT, mode: "multiple", source: "sync", name: "days", label: "Applicable days", required: true, placeholder: "Select applicable days", options: dayOptions, className: "md:col-span-2" },
];
function ShiftTypeDialog({ item, onClose }: { item: ShiftType | null; onClose: () => void }) {
  const [create, creating] = shiftApi.usePostApiV1ShiftTypeMutation();
  const [update, updating] = shiftApi.usePutApiV1ShiftTypeByIdMutation();
  const form = useForm<ShiftTypeFormValues>({ resolver: zodResolver(shiftTypeFormSchema), defaultValues: shiftTypeDefaults(item) });
  const save = useSave<ShiftTypeFormValues>(async (values) => {
    const rotationType = ([0, 1] as const).find((value) => String(value) === values.rotation?.value);
    if (rotationType === undefined || !values.startTime || !values.endTime) return {};
    const body = { shiftName: values.name, rotationType, startTime: values.startTime, endTime: values.endTime, applicableDays: values.days.map((day) => Number(day.value) as 0 | 1 | 2 | 3 | 4 | 5 | 6) };
    return item ? update({ ...shiftAudit.types, id: item.id, domainEntitiesShiftTypesCreateShiftTypeRequest: body }) : create({ ...shiftAudit.types, domainEntitiesShiftTypesCreateShiftTypeRequest: body });
  }, item ? "Shift type updated" : "Shift type added", onClose);
  return <SettingsFormDialog title={item ? `Edit ${item.name}` : "Add a shift type"} description="A shift: when it starts and ends, and on which days it is worked." form={form} fields={typeFields} saving={creating.isLoading || updating.isLoading} message={save.message}
    submitLabel={item ? "Save shift type" : "Add shift type"} onClose={onClose} onSubmit={save.submit} />;
}
export function ShiftTypesPage() {
  const { search, table, setBusy } = useList("shift types");
  const query = shiftApi.useGetApiV1ShiftTypeQuery({ ...shiftAudit.types, page: table.page, pageSize: table.pageSize, searchQuery: search });
  const [remove] = shiftApi.useDeleteApiV1ShiftTypeByIdMutation();
  const parsed = useMemo(() => query.data ? shiftTypeRowsSchema.safeParse(query.data.data ?? []) : null, [query.data]);
  useEffect(() => { setBusy(query.isFetching); }, [query.isFetching, setBusy]);
  const columns = useMemo(() => (edit: (row: ShiftType) => void, del: (row: ShiftType) => void) => typeColumn.columns([
    typeColumn.accessor("name", { header: "Shift name", cell: ({ row }) => <span className="font-medium">{row.original.name}</span> }),
    typeColumn.accessor((row) => rotationLabel(row.rotation), { id: "rotation", header: "Category", size: 140 }),
    typeColumn.accessor((row) => `${row.startTime} – ${row.endTime}`, { id: "time", header: "Start and end", size: 240, cell: ({ row }) => { const hours = shiftHours(row.original.startTime, row.original.endTime);
      return <span className="whitespace-nowrap">{row.original.startTime} – {row.original.endTime}{hours === null ? null : <span className="text-muted-foreground"> · {Number(hours.toFixed(2))} h</span>}</span>; } }),
    typeColumn.accessor((row) => daysText(row.days), { id: "days", header: "Shift days" }),
    actions(typeColumn, (row) => menu(row, shiftPermissions.types, edit, del)),
  ]), []);
  return <ShiftListPage title="Shift types" description="The shifts staff can be scheduled on." noun="shift type" addPermission={shiftPermissions.types.add} removePermission={shiftPermissions.types.remove} columns={columns} rows={parsed?.success ? parsed.data : []} unreadable={Boolean(parsed && !parsed.success)} query={query} table={table} search={search}
    dialog={(row, close) => <ShiftTypeDialog key={row?.id ?? "new"} item={row} onClose={close} />} removeNote="The shift will no longer be offered on schedules. Schedules that already use it keep it."
    onRemove={async (row) => { const result = await remove({ ...shiftAudit.types, id: row.id }); if ("error" in result) return apiErrorMessage(result.error); toast.success("Shift type deleted"); return null; }} />;
}

// ----- shift categories
const categoryColumn = dataTableColumns<ShiftCategory>();
const categoryFields: WizardField<ShiftCategoryFormValues>[] = [{ type: InputTypes.TEXT, name: "name", label: "Category name", required: true, className: "md:col-span-2" }];
function ShiftCategoryDialog({ item, onClose }: { item: ShiftCategory | null; onClose: () => void }) {
  const [create, creating] = shiftApi.usePostApiV1ShiftCategoryMutation();
  const [update, updating] = shiftApi.usePutApiV1ShiftCategoryByIdMutation();
  const form = useForm<ShiftCategoryFormValues>({ resolver: zodResolver(shiftCategoryFormSchema), defaultValues: { name: item?.name ?? "" } });
  const save = useSave<ShiftCategoryFormValues>((values) => item ? update({ ...shiftAudit.categories, id: item.id, domainEntitiesShiftAssignmentsCreateShiftCategoryRequest: { name: values.name } }) : create({ ...shiftAudit.categories, domainEntitiesShiftAssignmentsCreateShiftCategoryRequest: { name: values.name } }),
    item ? "Shift category updated" : "Shift category added", onClose);
  return <SettingsFormDialog title={item ? `Edit ${item.name}` : "Add a shift category"} description="Categories group staff when shifts are assigned." form={form} fields={categoryFields} saving={creating.isLoading || updating.isLoading} message={save.message}
    submitLabel={item ? "Save category" : "Add category"} onClose={onClose} onSubmit={save.submit} />;
}
export function ShiftCategoriesPage() {
  const { search, table, setBusy } = useList("shift categories");
  const query = shiftApi.useGetApiV1ShiftCategoryQuery({ ...shiftAudit.categories, page: table.page, pageSize: table.pageSize, searchQuery: search });
  const [remove] = shiftApi.useDeleteApiV1ShiftCategoryByIdMutation();
  const parsed = useMemo(() => query.data ? shiftCategoryRowsSchema.safeParse(query.data.data ?? []) : null, [query.data]);
  useEffect(() => { setBusy(query.isFetching); }, [query.isFetching, setBusy]);
  const columns = useMemo(() => (edit: (row: ShiftCategory) => void, del: (row: ShiftCategory) => void) => categoryColumn.columns([
    categoryColumn.accessor("name", { header: "Category name", cell: ({ row }) => <span className="font-medium">{row.original.name}</span> }),
    actions(categoryColumn, (row) => menu(row, shiftPermissions.categories, edit, del)),
  ]), []);
  return <ShiftListPage title="Shift categories" description="The groups staff are placed in when shifts are assigned." noun="category" addPermission={shiftPermissions.categories.add} removePermission={shiftPermissions.categories.remove} columns={columns} rows={parsed?.success ? parsed.data : []} unreadable={Boolean(parsed && !parsed.success)} query={query} table={table} search={search}
    dialog={(row, close) => <ShiftCategoryDialog key={row?.id ?? "new"} item={row} onClose={close} />} removeNote="The category will no longer be offered when shifts are assigned."
    onRemove={async (row) => { const result = await remove({ ...shiftAudit.categories, id: row.id }); if ("error" in result) return apiErrorMessage(result.error); toast.success("Shift category deleted"); return null; }} />;
}

// ----- shift schedules
const scheduleColumn = dataTableColumns<ShiftSchedule>();
function ShiftScheduleDialog({ item, onClose }: { item: ShiftSchedule | null; onClose: () => void }) {
  const [create, creating] = shiftApi.usePostApiV1ShiftSchedulesMutation();
  const [update, updating] = shiftApi.usePutApiV1ShiftSchedulesByIdMutation();
  const departments = departmentApi.useGetApiV1DepartmentQuery({ ...departmentAudit, page: 1, pageSize: 500 });
  const types = shiftApi.useGetApiV1ShiftTypeQuery({ ...shiftAudit.schedules, page: 1, pageSize: 500 });
  const departmentOptions = useMemo(() => (departments.data?.data ?? []).flatMap((row) => row.id && row.name ? [{ value: row.id, label: row.name }] : []), [departments.data]);
  const typeOptions = useMemo(() => { const parsed = shiftTypeRowsSchema.safeParse(types.data?.data ?? []); return parsed.success ? parsed.data.map((row) => ({ value: row.id, label: row.name })) : []; }, [types.data]);
  const schema = useMemo(() => shiftScheduleFormSchema(), []);
  const form = useForm<ShiftScheduleFormValues>({ resolver: zodResolver(schema), defaultValues: item
    ? { name: item.name, frequency: { value: String(item.frequency), label: frequencyLabel(item.frequency) }, startDate: item.startDate ? dayFromServer(item.startDate) : null, shiftTypes: item.shiftTypes, department: item.department }
    : { name: "", frequency: null, startDate: null, shiftTypes: [], department: null } });
  const fields: WizardField<ShiftScheduleFormValues>[] = [
    { type: InputTypes.TEXT, name: "name", label: "Schedule name", required: true },
    { type: InputTypes.SELECT, mode: "single", source: "sync", name: "frequency", label: "Frequency", required: true, placeholder: "Select frequency", options: [...frequencyOptions], description: "How long the schedule runs from its start date." },
    { type: InputTypes.DATE, name: "startDate", label: "Start date", required: true, minDate: tomorrow() },
    { type: InputTypes.SELECT, mode: "single", source: "sync", name: "department", label: "Department", required: true, placeholder: departments.isLoading ? "Loading departments…" : "Select department", options: departmentOptions },
    { type: InputTypes.SELECT, mode: "multiple", source: "sync", name: "shiftTypes", label: "Shift types", required: true, placeholder: types.isLoading ? "Loading shift types…" : "Select shift types", options: typeOptions, className: "md:col-span-2" },
  ];
  const save = useSave<ShiftScheduleFormValues>(async (values) => {
    const frequency = ([0, 1, 2, 3, 4, 5] as const).find((value) => String(value) === values.frequency?.value);
    if (frequency === undefined || !values.startDate || !values.department) return {};
    const body = { scheduleName: values.name, frequency, startDate: dayToServer(values.startDate), shiftTypeIds: values.shiftTypes.map((type) => type.value), departmentId: values.department.value };
    return item ? update({ ...shiftAudit.schedules, id: item.id, domainEntitiesShiftSchedulesCreateShiftScheduleRequest: body }) : create({ ...shiftAudit.schedules, domainEntitiesShiftSchedulesCreateShiftScheduleRequest: body });
  }, item ? "Shift schedule updated" : "Shift schedule added", onClose);
  return <SettingsFormDialog title={item ? `Edit ${item.name}` : "Add a shift schedule"} description="A period in which a department works a set of shifts." form={form} fields={fields} saving={creating.isLoading || updating.isLoading} message={save.message}
    submitLabel={item ? "Save schedule" : "Add schedule"} onClose={onClose} onSubmit={save.submit} />;
}
export function ShiftSchedulesPage() {
  const { search, table, setBusy } = useList("shift schedules");
  const query = shiftApi.useGetApiV1ShiftSchedulesQuery({ ...shiftAudit.schedules, page: table.page, pageSize: table.pageSize, searchQuery: search });
  const [remove] = shiftApi.useDeleteApiV1ShiftSchedulesByIdMutation();
  const parsed = useMemo(() => query.data ? shiftScheduleRowsSchema.safeParse(query.data.data ?? []) : null, [query.data]);
  useEffect(() => { setBusy(query.isFetching); }, [query.isFetching, setBusy]);
  const columns = useMemo(() => (edit: (row: ShiftSchedule) => void, del: (row: ShiftSchedule) => void) => scheduleColumn.columns([
    scheduleColumn.accessor("name", { header: "Schedule name", cell: ({ row }) => <span className="font-medium">{row.original.name}</span> }),
    scheduleColumn.accessor((row) => frequencyLabel(row.frequency), { id: "frequency", header: "Frequency", size: 130 }),
    scheduleColumn.accessor((row) => row.department?.label ?? "", { id: "department", header: "Department", size: 180 }),
    scheduleColumn.accessor((row) => row.shiftTypes.map((type) => type.label).join(", "), { id: "shiftTypes", header: "Shift types" }),
    scheduleColumn.accessor((row) => row.startDate ?? "", { id: "startDate", header: "Start date", size: 140, cell: ({ row }) => formatDate(row.original.startDate) ?? "–" }),
    scheduleColumn.accessor((row) => row.endDate ?? "", { id: "endDate", header: "End date", size: 140, cell: ({ row }) => formatDate(row.original.endDate) ?? "–" }),
    scheduleColumn.accessor((row) => scheduleStatuses[row.status] ?? "Unknown", { id: "status", header: "Status", size: 130, cell: ({ row }) => <Badge variant={row.original.status === 3 || row.original.status === 4 ? "secondary" : "outline"}>{scheduleStatuses[row.original.status] ?? "Unknown"}</Badge> }),
    actions(scheduleColumn, (row) => menu(row, shiftPermissions.schedules, edit, del, scheduleChangeBlock(row))),
  ]), []);
  return <ShiftListPage title="Shift schedule" description="The periods in which departments work their shifts." noun="shift schedule" addPermission={shiftPermissions.schedules.add} removePermission={shiftPermissions.schedules.remove} columns={columns} rows={parsed?.success ? parsed.data : []} unreadable={Boolean(parsed && !parsed.success)} query={query} table={table} search={search}
    dialog={(row, close) => <ShiftScheduleDialog key={row?.id ?? "new"} item={row} onClose={close} />} removeNote="The schedule and the shifts assigned on it are removed."
    onRemove={async (row) => { const result = await remove({ ...shiftAudit.schedules, id: row.id }); if ("error" in result) return apiErrorMessage(result.error); toast.success("Shift schedule deleted"); return null; }} />;
}

// ----- working hours policy
const policyColumn = dataTableColumns<WorkingHoursPolicy>();
const policyFields: WizardField<PolicyFormValues>[] = [
  { type: InputTypes.NUMBER, name: "maxDay", label: "Maximum hours a day", required: true, min: 1, max: 24 },
  { type: InputTypes.NUMBER, name: "maxWeek", label: "Maximum hours a week", required: true, min: 1, max: 168 },
  { type: InputTypes.NUMBER, name: "restDay", label: "Minimum daily rest (hours)", required: true, min: 0, max: 24 },
  { type: InputTypes.NUMBER, name: "restWeek", label: "Minimum weekly rest (hours)", required: true, min: 0, max: 168 },
  { type: InputTypes.DATE, name: "effectiveFrom", label: "Effective from", required: true, fromYear: 2020, toYear: 2100 },
];
function PolicyDialog({ onClose }: { onClose: () => void }) {
  const [create, creating] = policyApi.usePostApiV1WorkingHoursPolicyMutation();
  const form = useForm<PolicyFormValues>({ resolver: zodResolver(policyFormSchema), defaultValues: policyDefaults });
  const save = useSave<PolicyFormValues>(async (values) => values.effectiveFrom ? create({ ...shiftAudit.policy, domainEntitiesShiftAssignmentsCreateWorkingHoursPolicyRequest: { maxHoursPerDay: values.maxDay, maxHoursPerWeek: values.maxWeek, minDailyRestHours: values.restDay,
    minWeeklyRestHours: values.restWeek, effectiveFrom: dayToServer(values.effectiveFrom) } }) : {}, "Working hours policy added", onClose);
  return <SettingsFormDialog title="Add a working hours policy" description="The limits take effect on the date given. Earlier policies stay on record." form={form} fields={policyFields} saving={creating.isLoading} message={save.message} submitLabel="Add policy" onClose={onClose} onSubmit={save.submit} />;
}
export function WorkingHoursPolicyPage() {
  const query = policyApi.useGetApiV1WorkingHoursPolicyQuery(shiftAudit.policy);
  const [remove] = policyApi.useDeleteApiV1WorkingHoursPolicyByIdMutation();
  const parsed = useMemo(() => query.data ? policyRowsSchema.safeParse(query.data) : null, [query.data]);
  const rows = useMemo(() => parsed?.success ? parsed.data : [], [parsed]);
  const current = policyInForce(rows);
  const [adding, setAdding] = useState(false);
  const [removing, setRemoving] = useState<WorkingHoursPolicy | null>(null);
  const columns = useMemo(() => policyColumn.columns([
    policyColumn.accessor("effectiveFrom", { header: "Effective from", size: 190, cell: ({ row }) => <span className="font-medium">{formatDate(row.original.effectiveFrom) ?? "–"}{row.original.id === current?.id ? <Badge variant="outline" className="ml-2">In force</Badge> : null}</span> }),
    policyColumn.accessor("maxDay", { header: "Max hours a day", cell: ({ row }) => `${row.original.maxDay} h` }),
    policyColumn.accessor("maxWeek", { header: "Max hours a week", cell: ({ row }) => `${row.original.maxWeek} h` }),
    policyColumn.accessor("restDay", { header: "Min daily rest", cell: ({ row }) => `${row.original.restDay} h` }),
    policyColumn.accessor("restWeek", { header: "Min weekly rest", cell: ({ row }) => `${row.original.restWeek} h` }),
    policyColumn.display({ id: "actions", size: 56, enableHiding: false, header: () => <TableMenuHeader />, cell: ({ row }) => <TableMenu label={`Actions for the policy of ${formatDate(row.original.effectiveFrom) ?? "an unknown date"}`} items={[
      { id: "remove", label: "Delete", icon: Trash2, require: shiftPermissions.policy.manage, destructive: true, onSelect: () => setRemoving(row.original) }]} /> }),
  ]), [current?.id]);
  return <section className="page-fill">
    <SettingsHeader title="Working hours policy" description="The limits checked when shifts are assigned.">
      <PermissionGuard require={shiftPermissions.policy.manage}><Button type="button" size="sm" onClick={() => setAdding(true)}><Plus />Add policy</Button></PermissionGuard></SettingsHeader>
    <p className="max-w-3xl rounded-md border bg-muted/40 p-3 text-sm text-muted-foreground">When the limits change, add a new policy with the date it takes effect instead of changing an existing one, so past shifts are still judged by the limits that applied at the time.
      Ghana Labour Act, 2003 (Act 651) baseline: 8 hours a day, 40 hours a week, 12 hours daily rest, 48 hours weekly rest.</p>
    <ClientDataTable label="Working hours policies" columns={columns} rows={rows} getRowId={(row) => row.id} loading={query.isLoading} refreshing={query.isFetching && !query.isLoading}
      error={query.error ? apiErrorMessage(query.error) : parsed && !parsed.success ? "The server returned policies the app could not read." : null} onRetry={() => { void query.refetch(); }} emptyTitle="No working hours policy" emptyDescription="Until one is added, shift assignments are not checked against any limit." />
    {adding ? <PolicyDialog onClose={() => setAdding(false)} /> : null}
    {removing ? <ConfirmActionDialog require={shiftPermissions.policy.manage} title={`Delete the policy of ${formatDate(removing.effectiveFrom) ?? "this date"}?`} description={removing.id === current?.id ? "This is the policy in force. Shifts will be checked against the one before it, or against none." : "The policy is removed from the record."}
      confirmLabel="Delete policy" busyLabel="Deleting…" onClose={() => setRemoving(null)} onConfirm={async () => { const result = await remove({ ...shiftAudit.policy, id: removing.id }); if ("error" in result) return apiErrorMessage(result.error); toast.success("Working hours policy deleted"); return null; }} /> : null}
  </section>;
}
