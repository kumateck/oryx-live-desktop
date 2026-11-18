import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { PermissionGuard } from "@/shared/auth/permission-guard";
import type { PermissionRequirement } from "@/shared/auth/access";
import { SearchableSelect } from "@/shared/forms/searchable-select";
import { RichTextView } from "@/shared/rich-text/rich-text-view";
import type { FormAssignees } from "./assignments";
import { useFieldReassignment } from "./use-field-reassignment";
import { useAnalystOptions } from "./use-analyst-options";

/** Show every current assignment and review exactly the selected question transfers before one atomic save. */
export function ReassignPanel(props: { assignees: FormAssignees; require: PermissionRequirement; audit: { module: string; subModule: string }; onDone: () => void }) {
  const state = useFieldReassignment(props.assignees, props.require, props.audit, props.onDone);
  const analysts = useAnalystOptions(state.analystPermissions);
  if (props.assignees.assignments.length === 0) return <p>No question assignments are available to transfer.</p>;
  return <form onSubmit={state.submit} className="min-w-0 space-y-5">
    {state.saved ? <p role="status">Selected questions reassigned. The updated assignments have been reloaded.</p> : null}
    <p className="max-w-prose text-sm text-muted-foreground">Choose a new analyst for each question you want to move. Leave the other questions with their current analysts. Questions with saved responses cannot be transferred.</p>
    <section aria-label="Current and proposed assignments" className="space-y-4">
      {props.assignees.assignments.map(row => <div key={row.id} className="grid min-w-0 gap-3 border-b pb-4 sm:grid-cols-[minmax(0,1fr)_minmax(12rem,18rem)]">
        <div className="min-w-0 space-y-1 text-sm"><div className="font-medium"><RichTextView html={row.section} /></div>
          <p className="break-words">{row.label}</p><p className="text-muted-foreground">Currently assigned to {row.assigneeName}</p></div>
        <SearchableSelect label={`New analyst for ${row.label}`} placeholder="Keep current analyst" value={state.targets[row.id] ?? null} disabled={state.busy || !state.allowed}
          loadOptions={analysts} onChange={option => { const next = { ...state.targets }; if (option && option.value !== row.assigneeId) next[row.id] = option; else delete next[row.id]; state.form.setValue("targets", next, { shouldDirty: true }); }} />
      </div>)}
    </section>
    {state.changed.length > 0 ? <section aria-label="Reassignment review" className="space-y-3">
      <h2 className="font-semibold">Review {state.changed.length} question transfers</h2>
      <ul className="space-y-2 text-sm">{state.changed.map(row => <li key={row.id} className="break-words"><span className="font-medium">{row.label}</span>: {row.assigneeName} → {state.targets[row.id]?.label}</li>)}</ul>
      <p className="text-sm text-muted-foreground">{props.assignees.assignments.length - state.changed.length} questions keep their current analysts.</p>
      <div className="max-w-xl space-y-2"><Label htmlFor="reassign-reason">Reason for reassignment</Label>
        <Textarea id="reassign-reason" {...state.form.register("reason")} maxLength={1000} disabled={state.busy} />
        {state.form.formState.errors.reason ? <p role="alert" className="text-sm text-destructive">{state.form.formState.errors.reason.message}</p> : null}
      </div>
    </section> : null}
    {state.problem ? <p role="alert" className="text-sm text-destructive">{state.problem}</p> : null}
    <PermissionGuard require={props.require}><Button type="submit" disabled={state.busy || state.changed.length === 0}>{state.busy ? "Reassigning…" : "Confirm selected reassignments"}</Button></PermissionGuard>
  </form>;
}
