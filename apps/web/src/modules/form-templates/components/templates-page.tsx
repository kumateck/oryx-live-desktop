import { useEffect, useMemo, useState } from "react";
import { Copy, Pencil, Plus, Trash2 } from "lucide-react";
import { Link, useNavigate } from "react-router";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { SettingsHeader } from "@/modules/settings-support/ui";
import { ConfirmActionDialog, TableMenu, TableMenuHeader } from "@/shared/actions";
import { PermissionGuard } from "@/shared/auth/permission-guard";
import { ServerDataTable, dataTableColumns, pageMeta, useServerTable } from "@/shared/datatable";
import { apiErrorMessage } from "@/shared/errors/api-error-message";
import { formatDate } from "@/shared/format/dates";
import { usePageSearch } from "@/shared/search/page-search";
import { templatesApi } from "../api/templates-api";
import { templateRowsSchema, type TemplateRow } from "../lib/template-schema";
import { createTemplatePath, editTemplatePath, templatePermissions, templatesAudit, templateTypeLabel, templateTypes } from "../lib/templates";

const column = dataTableColumns<TemplateRow>();

/** Every form template, with the number of tests in each. */
export function TemplatesPage() {
  const navigate = useNavigate();
  const [busy, setBusy] = useState(false);
  const [type, setType] = useState("all");
  const search = usePageSearch("templates", busy);
  const table = useServerTable({ pageSize: 50, resetKey: `${search}|${type}` });
  const query = templatesApi.useGetApiV1FormQuery({ ...templatesAudit, page: table.page, pageSize: table.pageSize, searchQuery: search, ...(type === "all" ? {} : { type: type === "1" ? 1 : 0 }) });
  const parsed = useMemo(() => query.data ? templateRowsSchema.safeParse(query.data.data ?? []) : null, [query.data]);
  const rows = useMemo(() => parsed?.success ? parsed.data : [], [parsed]);
  const meta = pageMeta(query.data, table, rows.length);
  const [removing, setRemoving] = useState<TemplateRow | null>(null);
  const [remove] = templatesApi.useDeleteApiV1FormByFormIdMutation();
  useEffect(() => { setBusy(query.isFetching); }, [query.isFetching]);
  const columns = useMemo(() => column.columns([
    column.accessor("name", { header: "Template", cell: ({ row }) => <span className="break-words font-medium">{row.original.name}</span> }),
    column.accessor((row) => templateTypeLabel(row.type), { id: "type", header: "Used for", size: 170, cell: ({ getValue }) => <Badge variant="outline">{getValue()}</Badge> }),
    column.accessor("tests", { header: "Tests", size: 100 }),
    column.accessor((row) => row.createdAt ?? "", { id: "created", header: "Created", size: 130, cell: ({ row }) => formatDate(row.original.createdAt) ?? "–" }),
    column.display({ id: "actions", size: 56, enableHiding: false, header: () => <TableMenuHeader />, cell: ({ row }) => <TableMenu label={`Actions for ${row.original.name}`} items={[
      { id: "edit", label: "Edit", icon: Pencil, require: templatePermissions.edit, to: editTemplatePath(row.original.id) },
      { id: "copy", label: "Copy", icon: Copy, require: templatePermissions.create, to: createTemplatePath(row.original.id) },
      { id: "remove", label: "Delete", icon: Trash2, destructive: true, separated: true, require: templatePermissions.remove, onSelect: () => setRemoving(row.original) },
    ]} /> }),
  ]), []);
  return <section className="page-fill">
    <SettingsHeader title="Templates" description="Reusable test templates for analytical raw data and specifications.">
      <div className="flex flex-wrap items-center gap-2">
        <Select value={type} onValueChange={setType}><SelectTrigger aria-label="Template type" className="w-48"><SelectValue /></SelectTrigger>
          <SelectContent><SelectItem value="all">All templates</SelectItem>{templateTypes.map((option) => <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>)}</SelectContent></Select>
        <PermissionGuard require={templatePermissions.create}><Button asChild size="sm"><Link to={createTemplatePath()}><Plus />New template</Link></Button></PermissionGuard>
      </div>
    </SettingsHeader>
    <ServerDataTable label="Templates" columns={columns} rows={rows} getRowId={(row) => row.id} page={table.page} pageSize={table.pageSize} totalRows={meta.totalRows}
      onPageChange={table.onPageChange} onPageSizeChange={table.onPageSizeChange} loading={query.isLoading} refreshing={query.isFetching && !query.isLoading} onRetry={() => void query.refetch()}
      onRowOpen={(row) => void navigate(editTemplatePath(row.id))}
      error={query.error ? apiErrorMessage(query.error) : parsed && !parsed.success ? "The server returned templates the app could not read." : null}
      emptyTitle={search.trim() || type !== "all" ? "No templates match" : "No templates yet"} emptyDescription={search.trim() ? "Search by template name." : "Create the first template."} />
    {removing ? <ConfirmActionDialog require={templatePermissions.remove} title={`Delete ${removing.name}?`} description="Specifications and analytical raw data that use this template may stop working. This cannot be undone."
      confirmLabel="Delete template" busyLabel="Deleting…" onClose={() => setRemoving(null)}
      onConfirm={async () => { const result = await remove({ ...templatesAudit, formId: removing.id }); if ("error" in result) return apiErrorMessage(result.error); setRemoving(null); return null; }} /> : null}
  </section>;
}
