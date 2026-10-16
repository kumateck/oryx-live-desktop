import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogBody, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Spinner } from "@/components/ui/spinner";
import { formsApi } from "@/shared/api/generated/forms";
import type { PermissionRequirement } from "@/shared/auth/access";
import { usePermissionAction } from "@/shared/auth/use-permission-action";
import { apiErrorMessage } from "@/shared/errors/api-error-message";
import { AsyncOptionPicker } from "@/shared/forms/async-option-picker";
import type { SelectOption } from "@/shared/forms/form-wizard-types";
import type { FormAssignees } from "./assignments";
import { useAnalystOptions } from "./use-analyst-options";

function AnalystList({ assignees }: { assignees: FormAssignees | null }) {
  if (!assignees || assignees.analysts.length === 0) return <p className="text-sm text-muted-foreground">No analysts are assigned.</p>;
  return <ul className="space-y-2">{assignees.analysts.map((analyst) => <li key={analyst.assigneeId} className="rounded-lg border p-3">
    <p className="font-medium">{analyst.name} <span className="text-sm font-normal text-muted-foreground">({analyst.fields.length} {analyst.fields.length === 1 ? "field" : "fields"})</span></p>
    <p className="mt-1 text-sm text-muted-foreground">{analyst.fields.join(", ")}</p></li>)}</ul>;
}

/** Who holds which fields of a batch's test. */
export function AssignmentsDialog({ assignees, loading, error, onClose }: { assignees: FormAssignees | null; loading: boolean; error: string | null; onClose: () => void }) {
  return <Dialog open onOpenChange={(open) => { if (!open) onClose(); }}><DialogContent className="sm:max-w-2xl">
    <DialogHeader><DialogTitle>Test assignments</DialogTitle><DialogDescription>Each analyst and the fields they fill in.</DialogDescription></DialogHeader>
    <DialogBody>{loading ? <p className="flex items-center gap-2 text-sm text-muted-foreground"><Spinner />Loading…</p> : error ? <p role="alert" className="text-sm text-destructive">{error}</p> : <AnalystList assignees={assignees} />}</DialogBody>
  </DialogContent></Dialog>;
}

/** Moves all of one analyst's fields to another analyst, one analyst at a time. */
export function ReassignPanel({ assignees, require, audit, onDone }: { assignees: FormAssignees; require: PermissionRequirement; audit: { module: string; subModule: string }; onDone: () => void }) {
  const loadAnalysts = useAnalystOptions();
  const permission = usePermissionAction(require);
  const [reassign] = formsApi.usePostApiV1FormAssigneesReassignMutation();
  const [chosen, setChosen] = useState<Record<string, SelectOption>>({});
  const [busy, setBusy] = useState<string | null>(null);
  const [message, setMessage] = useState<Record<string, string>>({});
  const move = async (assigneeId: string, name: string) => {
    const target = chosen[assigneeId];
    if (!target) { setMessage({ ...message, [assigneeId]: "Choose who takes these fields." }); return; }
    if (target.value === assigneeId) { setMessage({ ...message, [assigneeId]: "Choose a different analyst." }); return; }
    const denied = permission.check();
    if (denied) { setMessage({ ...message, [assigneeId]: denied }); return; }
    setBusy(assigneeId);
    const result = await reassign({ ...audit, domainEntitiesFormsRequestReassignFormAssigneeRequest: { formAssigneeId: assignees.id, oldAssigneeId: assigneeId, newAssigneeId: target.value } });
    setBusy(null);
    if ("error" in result) { setMessage({ ...message, [assigneeId]: apiErrorMessage(result.error) }); return; }
    toast.success(`${name}'s fields moved to ${target.label}`);
    setChosen((current) => { const next = { ...current }; delete next[assigneeId]; return next; });
    onDone();
  };
  if (assignees.analysts.length === 0) return <p className="text-sm text-muted-foreground">No analysts are assigned yet. Assign the test first.</p>;
  return <ul className="space-y-3">{assignees.analysts.map((analyst) => <li key={analyst.assigneeId} className="space-y-3 rounded-lg border bg-card p-4">
    <div><p className="font-semibold">{analyst.name} <span className="text-sm font-normal text-muted-foreground">({analyst.fields.length} {analyst.fields.length === 1 ? "field" : "fields"})</span></p>
      <p className="text-sm text-muted-foreground">Reassigning moves all of these fields: {analyst.fields.join(", ")}.</p></div>
    <div className="flex flex-wrap items-center gap-2"><div className="w-72 max-w-full"><AsyncOptionPicker label={`New analyst for ${analyst.name}'s fields`} placeholder="Choose the new analyst" value={chosen[analyst.assigneeId] ?? null}
      loadOptions={loadAnalysts} onChange={(option) => setChosen({ ...chosen, [analyst.assigneeId]: option })} /></div>
      <Button type="button" disabled={busy !== null} onClick={() => void move(analyst.assigneeId, analyst.name)}>{busy === analyst.assigneeId ? <><Spinner />Reassigning…</> : "Reassign"}</Button></div>
    {message[analyst.assigneeId] ? <p role="alert" className="text-sm text-destructive">{message[analyst.assigneeId]}</p> : null}
  </li>)}</ul>;
}
