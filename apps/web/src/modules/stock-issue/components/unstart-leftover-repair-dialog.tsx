import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogBody, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { FormWizard, type WizardField } from "@/shared/forms/form-wizard";
import { InputTypes } from "@/shared/forms/input-types";
import { formatDateTime } from "@/shared/format/dates";
import { useUnstartLeftoverRepair } from "../hooks/use-unstart-leftover-repair";
import type { LeftoverReason } from "../schemas/unstart-leftovers";

const fields = [{ type: InputTypes.TEXTAREA, name: "reason", label: "Repair reason", required: true, rows: 2 }] as const satisfies readonly WizardField<LeftoverReason>[];

export default function UnstartLeftoverRepairDialog({ kind, onClose }: { kind: 0 | 1; onClose: () => void }) {
  const state = useUnstartLeftoverRepair(kind, onClose);
  return <Dialog open onOpenChange={open => { if (!open) state.close(); }}>
    <DialogContent className="sm:max-w-3xl" showCloseButton={!state.busy}>
      <DialogHeader><DialogTitle>Repair Unstart leftovers · {kind === 0 ? "Raw materials" : "Packaging"}</DialogTitle>
        <DialogDescription>Remove selected unissued requests left behind by a recorded Unstart. Requests and their lines remain in audit history. Physical stock does not change.</DialogDescription></DialogHeader>
      <form noValidate onSubmit={event => { event.stopPropagation(); void state.submit(event); }} className="flex min-h-0 min-w-0 flex-1 flex-col gap-4">
        <DialogBody className="space-y-4">
          <p className="text-sm text-muted-foreground">Review up to 200 requests in your department. Restarted batches, issued stock and active reservations block removal. Newer requests are excluded.</p>
          {state.loading ? <p role="status">Loading leftovers…</p> : state.preview?.requisitions.length === 0 ? <p role="status">No Unstart leftovers found.</p> : null}
          <div className="space-y-2">{state.preview?.requisitions.map(row => <div key={row.requisitionId} className="flex items-start gap-3 rounded-md border p-3 text-sm">
            <Checkbox aria-label={`Remove ${row.code}`} checked={state.selected.includes(row.requisitionId)} disabled={state.busy || state.fetching || state.needsReview || row.blockers.length > 0}
              onCheckedChange={checked => state.toggle(row.requisitionId, checked === true)} />
            <div className="min-w-0 space-y-1"><p className="break-words font-medium">{row.code} · Batch {row.batchNumber || "Not recorded"}</p>
              <p className="text-muted-foreground">{row.materialCount} material(s) · Unstarted {formatDateTime(row.unstartedAt) ?? row.unstartedAt}</p>
              {row.blockers.length ? <ul className="list-disc space-y-1 pl-5 text-destructive">{row.blockers.map(blocker => <li key={blocker}>{blocker}</li>)}</ul> : <p>Eligible for removal from the issue queue</p>}
            </div>
          </div>)}</div>
          <FormWizard form={state.form} fields={fields} />
          {state.error || state.message || !state.permission.allowed ? <p role="alert" className="text-sm text-destructive">{state.message || state.error || "Your current permissions do not allow this repair."}</p> : null}
          {state.needsReview ? <p role="status" className="text-sm">Reload and review the requests before trying again.</p> : null}
        </DialogBody>
        <DialogFooter><Button type="button" variant="outline" disabled={state.busy} onClick={state.close}>Cancel</Button>
          <Button type="button" variant="outline" disabled={state.busy || state.fetching || !state.permission.allowed} onClick={() => void state.reload()}>Reload preview</Button>
          <Button type="submit" variant="destructive" disabled={state.blocked}>{state.busy ? "Repairing…" : `Remove selected (${state.selected.length})`}</Button>
        </DialogFooter>
      </form>
    </DialogContent>
  </Dialog>;
}
