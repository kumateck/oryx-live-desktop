import { useCallback, useState } from "react";
import { Link, useNavigate } from "react-router";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PermissionGuard } from "@/shared/auth/permission-guard";
import { ConfirmActionDialog } from "@/shared/actions/confirm-action-dialog";
import { apiErrorMessage } from "@/shared/errors/api-error-message";
import { SettingsHeader } from "@/modules/settings-support/ui";
import { useApprovalConfigurations } from "../hooks/use-approval-configurations";
import { approvalSettingsApi, approvalSettingsAudit } from "../api/approval-settings-api";
import { approvalDocumentLabel } from "../lib/documents";
import type { ApprovalConfiguration } from "../schemas/approval-settings-schema";
import { ApprovalConfigurationsTable } from "./approval-configurations-table";

export function ApprovalConfigurationsWorkspace() {
  const state = useApprovalConfigurations();
  const navigate = useNavigate();
  const edit = useCallback((id: string) => { void navigate(`/settings/approvals/edit/${id}`); }, [navigate]);
  const [deleting, setDeleting] = useState<ApprovalConfiguration | null>(null);
  const [remove] = approvalSettingsApi.useDeleteApiV1ApprovalByApprovalIdMutation();
  const confirm = async () => {
    if (!deleting) return "Choose a workflow.";
    const result = await remove({ ...approvalSettingsAudit, approvalId: deleting.id });
    if ("error" in result) return apiErrorMessage(result.error);
    toast.success("Approval workflow removed"); return null;
  };
  return <section className="flex min-h-0 min-w-0 flex-1 flex-col gap-4">
    <SettingsHeader title="Approval workflows" description="Maintain document routing, approver order, required stages, and escalation delays.">
      <PermissionGuard require="CanCreateNewApproval"><Button asChild size="sm"><Link to="/settings/approvals/create">Create workflow</Link></Button></PermissionGuard>
    </SettingsHeader>
    <Input className="w-full sm:w-72" aria-label="Search approval workflows" placeholder="Search workflows…" value={state.search} onChange={(event) => state.setSearch(event.target.value)} />
    <p className="text-xs text-muted-foreground">Timed delegation is unavailable: the current server does not persist delegation requests.</p>
    {state.unreadable.length ? <p role="status" className="rounded-md border border-amber-500/50 bg-amber-500/10 p-3 text-sm">{state.unreadable.join(", ")} {state.unreadable.length === 1 ? "has a workflow" : "have workflows"} with a stage that names no approver or repeats an order, so {state.unreadable.length === 1 ? "it is" : "they are"} not listed. Recreate {state.unreadable.length === 1 ? "it" : "them"} to route those documents.</p> : null}
    <ApprovalConfigurationsTable label="Approval workflows" rows={state.rows} {...state.paging} loading={state.loading} refreshing={state.refreshing} error={state.error} onRetry={state.retry} onEdit={edit} onRemove={setDeleting} />
    {deleting ? <ConfirmActionDialog require={"CanDeleteApprovals"} title="Remove approval workflow" description={`Remove the ${approvalDocumentLabel(deleting.itemType)} workflow? This changes routing for documents that use this policy.`} confirmLabel="Remove workflow" busyLabel="Removing…" onConfirm={confirm} onClose={() => setDeleting(null)} /> : null}
  </section>;
}
