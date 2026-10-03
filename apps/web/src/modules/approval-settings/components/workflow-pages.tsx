import { useEffect, useMemo, useState } from "react";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { Link, useParams } from "react-router";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ConfirmActionDialog, TableMenu, TableMenuHeader } from "@/shared/actions";
import { useAccess } from "@/shared/auth/use-access";
import { ServerDataTable, dataTableColumns, pageMeta, useServerTable } from "@/shared/datatable";
import { apiErrorMessage } from "@/shared/errors/api-error-message";
import { usePageSearch } from "@/shared/search/page-search";
import { DetailPageSkeleton } from "@/shared/skeleton/page-skeletons";
import { useDeleteApiV1ApprovalByApprovalIdMutation, useGetApiV1ApprovalByApprovalIdQuery, useGetApiV1ApprovalQuery } from "../api/workflow-api";
import { audit, createWorkflowPath, describeWait, editWorkflowPath, workflowLabel, workflowPermissions, workflowsPath } from "../lib/workflows";
import { workflowRowsSchema, workflowSchema, type Workflow } from "../schemas/workflow-schema";
import { WorkflowForm } from "./workflow-form";

const column = dataTableColumns<Workflow>();

/** The approval workflows: which documents need approval, by whom, in what order. */
export function WorkflowListPage() {
  const { has } = useAccess();
  const [busy, setBusy] = useState(false);
  const search = usePageSearch("approval workflows", busy);
  const table = useServerTable({ pageSize: 50, resetKey: search });
  const query = useGetApiV1ApprovalQuery({ ...audit, page: table.page, pageSize: table.pageSize, searchQuery: search });
  const parsed = useMemo(() => query.data ? workflowRowsSchema.safeParse(query.data.data ?? []) : null, [query.data]);
  const rows = useMemo(() => parsed?.success ? parsed.data : [], [parsed]);
  const meta = pageMeta(query.data, table, rows.length);
  useEffect(() => { setBusy(query.isFetching); }, [query.isFetching]);
  const [removing, setRemoving] = useState<Workflow | null>(null);
  const [remove] = useDeleteApiV1ApprovalByApprovalIdMutation();
  const columns = useMemo(() => column.columns([
    column.accessor((row) => workflowLabel(row.type), { id: "document", header: "Document", cell: ({ row }) => <span className="break-words font-medium">{workflowLabel(row.original.type)}</span> }),
    column.display({ id: "stages", header: "Approvers, in order", cell: ({ row }) => row.original.stages.length === 0 ? <span className="text-destructive">No approvers</span>
      : <ol className="flex flex-wrap items-center gap-1.5">{row.original.stages.map((stage, index) => <li key={`${stage.kind}-${stage.id}-${index}`} className="flex items-center gap-1.5">{index > 0 ? <span aria-hidden="true" className="text-muted-foreground">→</span> : null}
        <Badge variant={stage.kind === "role" ? "secondary" : "outline"}>{stage.name}</Badge></li>)}</ol> }),
    column.accessor((row) => describeWait(row.wait), { id: "wait", header: "Escalates after", size: 190 }),
    column.display({ id: "actions", size: 56, enableHiding: false, header: () => <TableMenuHeader />, cell: ({ row }) => <TableMenu label={`Actions for ${workflowLabel(row.original.type)}`} items={[
      { id: "edit", label: "Edit", icon: Pencil, require: workflowPermissions.edit, to: editWorkflowPath(row.original.id) },
      { id: "delete", label: "Delete", icon: Trash2, require: workflowPermissions.remove, destructive: true, onSelect: () => setRemoving(row.original) },
    ]} /> }),
  ]), []);
  return <section className="page-fill">
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div><p className="eyebrow">SETTINGS</p><h1 className="text-xl font-semibold">Approvals</h1><p className="text-sm text-muted-foreground">Which documents need approval, by whom, and in what order. A document with no workflow is approved automatically.</p></div>
      {has(workflowPermissions.create) ? <Button asChild size="sm"><Link to={createWorkflowPath}><Plus />New workflow</Link></Button> : null}
    </div>
    <ServerDataTable label="Approval workflows" columns={columns} rows={rows} getRowId={(row) => row.id} page={table.page} pageSize={table.pageSize} totalRows={meta.totalRows} onPageChange={table.onPageChange} onPageSizeChange={table.onPageSizeChange}
      loading={query.isLoading} refreshing={query.isFetching && !query.isLoading} onRetry={() => void query.refetch()} error={query.error ? apiErrorMessage(query.error) : parsed && !parsed.success ? "The server returned workflows the app could not read." : null}
      emptyTitle={search.trim() ? "No workflows match this search" : "No approval workflows"} emptyDescription={search.trim() ? "Search by the document's name." : "A document with no workflow is approved automatically, with nobody asked."} />
    {removing ? <ConfirmActionDialog require={"CanDeleteApprovals"} title={`Delete the workflow for ${workflowLabel(removing.type).toLowerCase()}?`}
      description="New requests of this kind will be approved automatically, with nobody asked. Requests already waiting keep the approvers they were given." confirmLabel="Delete workflow" busyLabel="Deleting…" onClose={() => setRemoving(null)}
      onConfirm={async () => { const result = await remove({ ...audit, approvalId: removing.id });
        if ("error" in result) return apiErrorMessage(result.error);
        toast.success("Workflow deleted", { description: workflowLabel(removing.type) });
        return null; }} /> : null}
  </section>;
}

function Edit({ id }: { id: string }) {
  const query = useGetApiV1ApprovalByApprovalIdQuery({ ...audit, approvalId: id });
  const workflow = useMemo(() => { const parsed = workflowSchema.safeParse(query.data ?? null); return parsed.success ? parsed.data : null; }, [query.data]);
  if (query.isLoading) return <DetailPageSkeleton label="Loading workflow" groups={2} />;
  if (!workflow) return <div role="alert" className="mx-auto max-w-md space-y-3 py-12 text-center">
    <h1 className="text-lg font-semibold">Workflow unavailable</h1><p className="text-sm text-muted-foreground">{query.error ? apiErrorMessage(query.error) : "The server returned a workflow the app could not read."}</p>
    <div className="flex justify-center gap-2"><Button size="sm" variant="outline" onClick={() => void query.refetch()}>Retry</Button><Button asChild size="sm"><Link to={workflowsPath}>Approvals</Link></Button></div></div>;
  // Keyed by the record so a refetch behind the form never resets what is being typed.
  return <WorkflowForm key={workflow.id} workflow={workflow} />;
}
export function WorkflowCreatePage() { return <WorkflowForm />; }
export function WorkflowEditPage() {
  const { id } = useParams();
  return id ? <Edit id={id} /> : null;
}
