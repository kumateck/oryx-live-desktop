import { useEffect, useMemo, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { Eye, Pencil, Plus, Trash2 } from "lucide-react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogBody, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { departmentApi, departmentAudit } from "@/modules/departments/departments";
import { SettingsFormDialog } from "@/modules/settings-support/ui";
import { ConfirmActionDialog, TableMenu, TableMenuHeader } from "@/shared/actions";
import { PermissionGuard } from "@/shared/auth/permission-guard";
import { ServerDataTable, dataTableColumns, pageMeta, useServerTable } from "@/shared/datatable";
import { DetailGroup, DetailItem } from "@/shared/detail/detail-list";
import { apiErrorMessage } from "@/shared/errors/api-error-message";
import type { WizardField } from "@/shared/forms/form-wizard";
import { InputTypes } from "@/shared/forms/input-types";
import { RichTextView } from "@/shared/rich-text/rich-text-view";
import { usePageSearch } from "@/shared/search/page-search";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { designationAudit, designationFormSchema, designationPermissions, designationRowsSchema, leaveTypeAudit, leaveTypeBody, leaveTypeFormSchema, leaveTypePermissions, leaveTypeRowsSchema, staffSetupApi,
  type Designation, type DesignationFormValues, type LeaveType, type LeaveTypeFormValues } from "./designations";

const ALL = "all";
const yes = (value: boolean) => value ? "Yes" : "No";
function Header({ title, description, children }: { title: string; description: string; children?: React.ReactNode }) {
  return <header className="flex flex-wrap items-start justify-between gap-3"><div className="min-w-0"><p className="eyebrow">HUMAN RESOURCES</p><h1 className="text-xl font-semibold">{title}</h1><p className="text-sm text-muted-foreground">{description}</p></div>
    <div className="flex flex-wrap items-center gap-2">{children}</div></header>;
}
function useDepartmentOptions() {
  const query = departmentApi.useGetApiV1DepartmentQuery({ ...departmentAudit, page: 1, pageSize: 1000 });
  return { options: useMemo(() => (query.data?.data ?? []).flatMap((row) => row.id && row.name ? [{ value: row.id, label: row.name }] : []), [query.data]), loading: query.isLoading };
}
function Chips({ items, empty }: { items: readonly { value: string; label: string }[]; empty: string }) {
  return items.length === 0 ? <span className="text-muted-foreground">{empty}</span> : <span className="flex flex-wrap gap-1">{items.map((item) => <Badge key={item.value} variant="secondary">{item.label}</Badge>)}</span>;
}
function ViewDialog({ title, description, onClose, children }: { title: string; description: string; onClose: () => void; children: React.ReactNode }) {
  return <Dialog open onOpenChange={(open) => { if (!open) onClose(); }}><DialogContent className="sm:max-w-2xl"><DialogHeader><DialogTitle>{title}</DialogTitle><DialogDescription>{description}</DialogDescription></DialogHeader>
    <DialogBody>{children}</DialogBody><DialogFooter><Button type="button" variant="outline" onClick={onClose}>Close</Button></DialogFooter></DialogContent></Dialog>;
}

// ----- designations
function DesignationDialog({ item, onClose }: { item: Designation | null; onClose: () => void }) {
  const [create, creating] = staffSetupApi.usePostApiV1DesignationMutation();
  const [update, updating] = staffSetupApi.usePutApiV1DesignationByIdMutation();
  const departments = useDepartmentOptions();
  const [message, setMessage] = useState("");
  const form = useForm<DesignationFormValues>({ resolver: zodResolver(designationFormSchema), defaultValues: item ? { name: item.name, departments: item.departments, leaveDays: item.leaveDays, description: item.description ?? "" } : { name: "", departments: [], description: "" } });
  const fields: WizardField<DesignationFormValues>[] = [
    { type: InputTypes.TEXT, name: "name", label: "Designation name", required: true },
    { type: InputTypes.NUMBER, name: "leaveDays", label: "Paid leave days entitled", required: true, min: 0, description: "Days a year." },
    { type: InputTypes.SELECT, mode: "multiple", source: "sync", name: "departments", label: "Associated departments", required: true, placeholder: departments.loading ? "Loading departments…" : "Select departments", options: departments.options, className: "md:col-span-2" },
    { type: InputTypes.RICHTEXT, name: "description", label: "Description", className: "md:col-span-2" },
  ];
  return <SettingsFormDialog title={item ? `Edit ${item.name}` : "Add a designation"} description="A job title, the departments it exists in, and its paid leave." form={form} fields={fields} saving={creating.isLoading || updating.isLoading} message={message}
    submitLabel={item ? "Save designation" : "Add designation"} onClose={onClose} onSubmit={async (values) => {
      setMessage("");
      const body = { name: values.name, description: values.description ?? "", departmentIds: values.departments.map((department) => department.value), maximumLeaveDays: values.leaveDays };
      const result = item ? await update({ ...designationAudit, id: item.id, domainEntitiesDesignationsCreateDesignationRequest: body }) : await create({ ...designationAudit, domainEntitiesDesignationsCreateDesignationRequest: body });
      if ("error" in result) { setMessage(apiErrorMessage(result.error)); return; }
      toast.success(item ? "Designation updated" : "Designation added"); onClose();
    }} />;
}
const designationColumn = dataTableColumns<Designation>();
export function DesignationsPage() {
  const [busy, setBusy] = useState(false);
  const search = usePageSearch("designations", busy);
  const [departmentId, setDepartmentId] = useState<string>();
  const table = useServerTable({ pageSize: 50, resetKey: `${search}|${departmentId ?? ""}` });
  const departments = useDepartmentOptions();
  const query = staffSetupApi.useGetApiV1DesignationQuery({ ...designationAudit, page: table.page, pageSize: table.pageSize, searchQuery: search, ...(departmentId ? { departmentId } : {}) });
  const [remove] = staffSetupApi.useDeleteApiV1DesignationByIdMutation();
  const parsed = useMemo(() => query.data ? designationRowsSchema.safeParse(query.data.data ?? []) : null, [query.data]);
  const rows = useMemo(() => parsed?.success ? parsed.data : [], [parsed]);
  const meta = pageMeta(query.data, table, rows.length);
  useEffect(() => { setBusy(query.isFetching); }, [query.isFetching]);
  const [editing, setEditing] = useState<Designation | "new" | null>(null);
  const [viewing, setViewing] = useState<Designation | null>(null);
  const [removing, setRemoving] = useState<Designation | null>(null);
  const columns = useMemo(() => designationColumn.columns([
    designationColumn.accessor("name", { header: "Designation", cell: ({ row }) => <span className="font-medium">{row.original.name}</span> }),
    designationColumn.accessor((row) => row.departments.map((item) => item.label).join(", "), { id: "departments", header: "Associated departments", cell: ({ row }) => <Chips items={row.original.departments} empty="–" /> }),
    designationColumn.accessor("leaveDays", { header: "Paid leave days", size: 150 }),
    designationColumn.accessor((row) => row.description ?? "", { id: "description", header: "Description", cell: ({ row }) => row.original.description ? <RichTextView html={row.original.description} className="text-sm" /> : <span className="text-muted-foreground">–</span> }),
    designationColumn.display({ id: "actions", size: 56, enableHiding: false, header: () => <TableMenuHeader />, cell: ({ row }) => <TableMenu label={`Actions for ${row.original.name}`} items={[
      { id: "view", label: "View details", icon: Eye, require: designationPermissions.view, onSelect: () => setViewing(row.original) },
      { id: "edit", label: "Edit", icon: Pencil, require: designationPermissions.edit, onSelect: () => setEditing(row.original) },
      { id: "remove", label: "Delete", icon: Trash2, require: designationPermissions.remove, destructive: true, separated: true, onSelect: () => setRemoving(row.original) }]} /> }),
  ]), []);
  return <section className="page-fill">
    <Header title="Designation management" description="Job titles, the departments they exist in, and their paid leave.">
      <Select value={departmentId ?? ALL} onValueChange={(value) => setDepartmentId(value === ALL ? undefined : value)}><SelectTrigger aria-label="Filter by department" size="sm" className="w-full sm:w-56"><SelectValue /></SelectTrigger>
        <SelectContent position="popper"><SelectItem value={ALL}>All departments</SelectItem>{departments.options.map((item) => <SelectItem key={item.value} value={item.value}>{item.label}</SelectItem>)}</SelectContent></Select>
      <PermissionGuard require={designationPermissions.add}><Button type="button" size="sm" onClick={() => setEditing("new")}><Plus />Add designation</Button></PermissionGuard>
    </Header>
    <ServerDataTable label="Designations" columns={columns} rows={rows} getRowId={(row) => row.id} page={table.page} pageSize={table.pageSize} totalRows={meta.totalRows} onPageChange={table.onPageChange} onPageSizeChange={table.onPageSizeChange}
      loading={query.isLoading} refreshing={query.isFetching && !query.isLoading} error={query.error ? apiErrorMessage(query.error) : parsed && !parsed.success ? "The server returned designations the app could not read." : null} onRetry={() => { void query.refetch(); }}
      emptyTitle={search.trim() || departmentId ? "No designations match" : "No designations"} emptyDescription={search.trim() || departmentId ? "Change the search or the department." : "Add the first designation."} />
    {editing ? <DesignationDialog key={editing === "new" ? "new" : editing.id} item={editing === "new" ? null : editing} onClose={() => setEditing(null)} /> : null}
    {viewing ? <ViewDialog title={viewing.name} description="Designation details." onClose={() => setViewing(null)}><DetailGroup title="Designation"><DetailItem label="Designation name" value={viewing.name} />
      <DetailItem label="Associated departments" value={<Chips items={viewing.departments} empty="None" />} /><DetailItem label="Paid leave days entitled" value={`${viewing.leaveDays} days`} />
      <DetailItem label="Description" value={viewing.description ? <RichTextView html={viewing.description} className="text-sm" /> : null} /></DetailGroup></ViewDialog> : null}
    {removing ? <ConfirmActionDialog require={designationPermissions.remove} title={`Delete ${removing.name}?`} description="The designation will no longer be offered for staff or leave types." confirmLabel="Delete designation" busyLabel="Deleting…" onClose={() => setRemoving(null)}
      onConfirm={async () => { const result = await remove({ ...designationAudit, id: removing.id }); if ("error" in result) return apiErrorMessage(result.error); toast.success("Designation deleted"); return null; }} /> : null}
  </section>;
}

// ----- leave types
function LeaveTypeDialog({ item, onClose }: { item: LeaveType | null; onClose: () => void }) {
  const [create, creating] = staffSetupApi.usePostApiV1LeaveTypeMutation();
  const [update, updating] = staffSetupApi.usePutApiV1LeaveTypeByIdMutation();
  const designations = staffSetupApi.useGetApiV1DesignationQuery({ ...leaveTypeAudit, page: 1, pageSize: 1000 });
  const designationOptions = useMemo(() => { const parsed = designationRowsSchema.safeParse(designations.data?.data ?? []); return parsed.success ? parsed.data.map((row) => ({ value: row.id, label: row.name })) : []; }, [designations.data]);
  const [message, setMessage] = useState("");
  const form = useForm<LeaveTypeFormValues>({ resolver: zodResolver(leaveTypeFormSchema), defaultValues: item ? { name: item.name, isPaid: item.isPaid, deductFromBalance: item.deductFromBalance, days: item.days, designations: item.designations }
    : { name: "", isPaid: false, deductFromBalance: false, designations: [] } });
  const fields: WizardField<LeaveTypeFormValues>[] = [
    { type: InputTypes.TEXT, name: "name", label: "Leave type", required: true },
    { type: InputTypes.NUMBER, name: "days", label: "Maximum duration (days)", required: true, min: 1, step: 1 },
    { type: InputTypes.SWITCH, name: "isPaid", label: "Paid leave" },
    { type: InputTypes.SWITCH, name: "deductFromBalance", label: "Deduct from leave balance" },
    { type: InputTypes.SELECT, mode: "multiple", source: "sync", name: "designations", label: "Designations", required: true, placeholder: designations.isLoading ? "Loading designations…" : "Select designations", options: designationOptions, className: "md:col-span-2" },
  ];
  return <SettingsFormDialog title={item ? `Edit ${item.name}` : "Add a leave type"} description="A kind of leave, how long it can be, and who may take it." form={form} fields={fields} saving={creating.isLoading || updating.isLoading} message={message}
    submitLabel={item ? "Save leave type" : "Add leave type"} onClose={onClose} onSubmit={async (values) => {
      setMessage("");
      const body = leaveTypeBody(values, item);
      const result = item ? await update({ ...leaveTypeAudit, id: item.id, domainEntitiesLeaveTypesCreateLeaveTypeRequest: body }) : await create({ ...leaveTypeAudit, domainEntitiesLeaveTypesCreateLeaveTypeRequest: body });
      if ("error" in result) { setMessage(apiErrorMessage(result.error)); return; }
      toast.success(item ? "Leave type updated" : "Leave type added"); onClose();
    }} />;
}
const leaveColumn = dataTableColumns<LeaveType>();
export function LeaveTypesPage() {
  const [busy, setBusy] = useState(false);
  const search = usePageSearch("leave types", busy);
  const table = useServerTable({ pageSize: 50, resetKey: search });
  const query = staffSetupApi.useGetApiV1LeaveTypeQuery({ ...leaveTypeAudit, page: table.page, pageSize: table.pageSize, searchQuery: search });
  const [remove] = staffSetupApi.useDeleteApiV1LeaveTypeByIdMutation();
  const parsed = useMemo(() => query.data ? leaveTypeRowsSchema.safeParse(query.data.data ?? []) : null, [query.data]);
  const rows = useMemo(() => parsed?.success ? parsed.data : [], [parsed]);
  const meta = pageMeta(query.data, table, rows.length);
  useEffect(() => { setBusy(query.isFetching); }, [query.isFetching]);
  const [editing, setEditing] = useState<LeaveType | "new" | null>(null);
  const [viewing, setViewing] = useState<LeaveType | null>(null);
  const [removing, setRemoving] = useState<LeaveType | null>(null);
  const columns = useMemo(() => leaveColumn.columns([
    leaveColumn.accessor("name", { header: "Leave type", cell: ({ row }) => <span className="font-medium">{row.original.name}{row.original.isActive ? null : <Badge variant="secondary" className="ml-2">Inactive</Badge>}</span> }),
    leaveColumn.accessor((row) => yes(row.isPaid), { id: "paid", header: "Paid", size: 100 }),
    leaveColumn.accessor((row) => yes(row.deductFromBalance), { id: "deduct", header: "Deducted from balance", size: 190 }),
    leaveColumn.accessor("days", { header: "Maximum days", size: 140 }),
    leaveColumn.accessor((row) => row.designations.length, { id: "designations", header: "Designations", size: 140 }),
    leaveColumn.display({ id: "actions", size: 56, enableHiding: false, header: () => <TableMenuHeader />, cell: ({ row }) => <TableMenu label={`Actions for ${row.original.name}`} items={[
      { id: "view", label: "View details", icon: Eye, require: leaveTypePermissions.view, onSelect: () => setViewing(row.original) },
      { id: "edit", label: "Edit", icon: Pencil, require: leaveTypePermissions.edit, onSelect: () => setEditing(row.original) },
      { id: "remove", label: "Delete", icon: Trash2, require: leaveTypePermissions.remove, destructive: true, separated: true, onSelect: () => setRemoving(row.original) }]} /> }),
  ]), []);
  return <section className="page-fill">
    <Header title="Leave type configuration" description="The kinds of leave staff can request."><PermissionGuard require={leaveTypePermissions.add}><Button type="button" size="sm" onClick={() => setEditing("new")}><Plus />Add leave type</Button></PermissionGuard></Header>
    <ServerDataTable label="Leave types" columns={columns} rows={rows} getRowId={(row) => row.id} page={table.page} pageSize={table.pageSize} totalRows={meta.totalRows} onPageChange={table.onPageChange} onPageSizeChange={table.onPageSizeChange}
      loading={query.isLoading} refreshing={query.isFetching && !query.isLoading} error={query.error ? apiErrorMessage(query.error) : parsed && !parsed.success ? "The server returned leave types the app could not read." : null} onRetry={() => { void query.refetch(); }}
      emptyTitle={search.trim() ? "No leave types match this search" : "No leave types"} emptyDescription={search.trim() ? "Search by name." : "Add the first leave type."} />
    {editing ? <LeaveTypeDialog key={editing === "new" ? "new" : editing.id} item={editing === "new" ? null : editing} onClose={() => setEditing(null)} /> : null}
    {viewing ? <ViewDialog title={viewing.name} description="Leave type details." onClose={() => setViewing(null)}><DetailGroup title="Leave type"><DetailItem label="Paid leave" value={yes(viewing.isPaid)} /><DetailItem label="Deducted from balance" value={yes(viewing.deductFromBalance)} />
      <DetailItem label="Maximum duration" value={`${viewing.days} days`} /><DetailItem label="Designations" value={<Chips items={viewing.designations} empty="None" />} /></DetailGroup></ViewDialog> : null}
    {removing ? <ConfirmActionDialog require={leaveTypePermissions.remove} title={`Delete ${removing.name}?`} description="Staff will no longer be able to request this kind of leave." confirmLabel="Delete leave type" busyLabel="Deleting…" onClose={() => setRemoving(null)}
      onConfirm={async () => { const result = await remove({ ...leaveTypeAudit, id: removing.id }); if ("error" in result) return apiErrorMessage(result.error); toast.success("Leave type deleted"); return null; }} /> : null}
  </section>;
}
