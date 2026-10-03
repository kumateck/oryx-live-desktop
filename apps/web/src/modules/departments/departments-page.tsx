import { useEffect, useMemo, useState } from "react";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { SettingsHeader } from "@/modules/settings-support/ui";
import { ConfirmActionDialog, TableMenu, TableMenuHeader } from "@/shared/actions";
import { PermissionGuard } from "@/shared/auth/permission-guard";
import { ServerDataTable, dataTableColumns, pageMeta, useServerTable } from "@/shared/datatable";
import { apiErrorMessage } from "@/shared/errors/api-error-message";
import { RichTextView } from "@/shared/rich-text/rich-text-view";
import { usePageSearch } from "@/shared/search/page-search";
import { DepartmentDialog } from "./department-dialog";
import { departmentApi, departmentAudit, departmentPermissions, departmentRowsSchema, departmentTypeLabel, type Department } from "./departments";

const column = dataTableColumns<Department>();

export function DepartmentsPage() {
  const [busy, setBusy] = useState(false);
  const search = usePageSearch("departments", busy);
  const table = useServerTable({ pageSize: 50, resetKey: search });
  const query = departmentApi.useGetApiV1DepartmentQuery({ ...departmentAudit, page: table.page, pageSize: table.pageSize, searchQuery: search });
  const [remove] = departmentApi.useDeleteApiV1DepartmentByDepartmentIdMutation();
  const parsed = useMemo(() => query.data ? departmentRowsSchema.safeParse(query.data.data ?? []) : null, [query.data]);
  const rows = useMemo(() => parsed?.success ? parsed.data : [], [parsed]);
  const meta = pageMeta(query.data, table, rows.length);
  useEffect(() => { setBusy(query.isFetching); }, [query.isFetching]);
  const [editing, setEditing] = useState<Department | "new" | null>(null);
  const [removing, setRemoving] = useState<Department | null>(null);
  const columns = useMemo(() => column.columns([
    column.accessor("code", { header: "Code", size: 140 }),
    column.accessor("name", { header: "Department", cell: ({ row }) => <span className="break-words font-medium">{row.original.name}</span> }),
    column.accessor((row) => departmentTypeLabel(row.type), { id: "type", header: "Type", size: 170, cell: ({ row }) => <Badge variant="outline">{departmentTypeLabel(row.original.type)}</Badge> }),
    column.accessor((row) => row.parent?.label ?? "", { id: "parent", header: "Parent", size: 200, cell: ({ row }) => row.original.parent?.label ?? <span className="text-muted-foreground">–</span> }),
    column.accessor((row) => row.description ?? "", { id: "description", header: "Description", cell: ({ row }) => row.original.description ? <RichTextView html={row.original.description} className="text-sm" /> : <span className="text-muted-foreground">–</span> }),
    column.display({ id: "actions", size: 56, enableHiding: false, header: () => <TableMenuHeader />, cell: ({ row }) => <TableMenu label={`Actions for ${row.original.name}`} items={[
      { id: "edit", label: "Edit", icon: Pencil, require: departmentPermissions.edit, onSelect: () => setEditing(row.original) },
      { id: "remove", label: "Delete", icon: Trash2, require: departmentPermissions.remove, destructive: true, separated: true, onSelect: () => setRemoving(row.original) }]} /> }),
  ]), []);
  return <section className="page-fill">
    <SettingsHeader title="Departments" description="The departments of the organisation and how they sit under one another.">
      <PermissionGuard require={departmentPermissions.add}><Button type="button" size="sm" onClick={() => setEditing("new")}><Plus />Add department</Button></PermissionGuard>
    </SettingsHeader>
    <ServerDataTable label="Departments" columns={columns} rows={rows} getRowId={(row) => row.id} page={table.page} pageSize={table.pageSize} totalRows={meta.totalRows} onPageChange={table.onPageChange} onPageSizeChange={table.onPageSizeChange}
      loading={query.isLoading} refreshing={query.isFetching && !query.isLoading} error={query.error ? apiErrorMessage(query.error) : parsed && !parsed.success ? "The server returned departments the app could not read." : null} onRetry={() => { void query.refetch(); }}
      emptyTitle={search.trim() ? "No departments match this search" : "No departments"} emptyDescription={search.trim() ? "Search by department name or code." : "Add the first department."} />
    {editing ? <DepartmentDialog key={editing === "new" ? "new" : editing.id} department={editing === "new" ? null : editing} onClose={() => setEditing(null)} /> : null}
    {removing ? <ConfirmActionDialog require={departmentPermissions.remove} title={`Delete ${removing.name}?`} description="The department will no longer be offered for staff, stock or requests." confirmLabel="Delete department" busyLabel="Deleting…" onClose={() => setRemoving(null)}
      onConfirm={async () => { const result = await remove({ ...departmentAudit, departmentId: removing.id }); if ("error" in result) return apiErrorMessage(result.error); toast.success("Department deleted"); return null; }} /> : null}
  </section>;
}
