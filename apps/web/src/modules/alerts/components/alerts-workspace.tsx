import { lazy, Suspense, useCallback, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { PermissionGuard } from "@/shared/auth/permission-guard";
import { ConfirmActionDialog } from "@/shared/actions/confirm-action-dialog";
import { apiErrorMessage } from "@/shared/errors/api-error-message";
import { SettingsHeader } from "@/modules/settings-support/ui";
import { SettingsRecordState } from "@/modules/settings-support/ui";
import { alertApi, alertAudit } from "../api/alert-api";
import { useAlerts } from "../hooks/use-alerts";
import type { AlertRecord } from "../schemas/alert-schema";
import { AlertsTable, type AlertAction } from "./alerts-table";

const Create = lazy(() => import("./alert-editor").then((module) => ({ default: module.AlertEditor })));
const Edit = lazy(() => import("./edit-alert").then((module) => ({ default: module.EditAlert })));
type Action = { kind: "create" } | { kind: AlertAction; row: AlertRecord };
export function AlertsWorkspace() {
  const state = useAlerts();
  const [action, setAction] = useState<Action | null>(null);
  const [remove] = alertApi.useDeleteApiV1AlertByIdMutation();
  const [toggle] = alertApi.usePutApiV1AlertByIdToggleDisableMutation();
  const select = useCallback((kind: AlertAction, row: AlertRecord) => setAction({ kind, row }), []);
  const close = () => setAction(null);
  const confirm = async () => {
    if (!action || action.kind === "create") return "Choose an alert.";
    const result = action.kind === "remove" ? await remove({ ...alertAudit, id: action.row.id }) : await toggle({ ...alertAudit, id: action.row.id });
    if ("error" in result) return apiErrorMessage(result.error);
    toast.success(action.kind === "remove" ? "Alert removed" : "Alert delivery updated"); return null;
  };
  return <section className="flex min-h-0 min-w-0 flex-1 flex-col gap-4">
    <SettingsHeader title="Alerts" description="Choose events, delivery channels, recipients, and delivery delays.">
      <PermissionGuard require="CanCreateNewAlerts"><Button size="sm" onClick={() => setAction({ kind: "create" })}>Create alert</Button></PermissionGuard>
    </SettingsHeader>
    <div className="flex flex-wrap items-center gap-4"><Input className="w-full sm:w-72" aria-label="Search alerts" placeholder="Search alerts…" value={state.search} onChange={(event) => state.setSearch(event.target.value)} />
      <label className="flex items-center gap-2 text-sm"><Checkbox aria-label="Include disabled alerts" checked={state.withDisabled} onCheckedChange={(checked) => state.setWithDisabled(checked === true)} />Include disabled alerts</label></div>
    <AlertsTable label="Alerts" rows={state.rows} {...state.paging} loading={state.loading} refreshing={state.refreshing} error={state.error} onRetry={state.retry} onAction={select} />
    {action && (action.kind === "create" || action.kind === "edit" || action.kind === "recipients") ? <Suspense fallback={<SettingsRecordState title="Alert configuration" close={close} />}>
      {action.kind === "create" ? <Create onClose={close} /> : <Edit id={action.row.id} recipientsOnly={action.kind === "recipients"} onClose={close} />}
    </Suspense> : null}
    {action && (action.kind === "remove" || action.kind === "toggle") ? <ConfirmActionDialog require={action.kind === "remove" ? "CanDeleteAlerts" : "CanEnableDisableAlerts"} title={action.kind === "remove" ? "Remove alert" : "Change alert delivery"}
      description={action.kind === "remove" ? `Remove “${action.row.title || "this alert"}” and its recipient configuration?` : `${action.row.isDisabled ? "Enable" : "Disable"} delivery for “${action.row.title || "this alert"}”?`}
      destructive={action.kind === "remove"} confirmLabel={action.kind === "remove" ? "Remove" : action.row.isDisabled ? "Enable" : "Disable"} busyLabel="Updating…" onConfirm={confirm} onClose={close} /> : null}
  </section>;
}
