import { Skeleton } from "@/shared/skeleton/skeleton";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogBody, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { FormWizard, type WizardField } from "@/shared/forms/form-wizard";
import { InputTypes } from "@/shared/forms/input-types";
import { formatDateTime } from "@/shared/format/dates";
import { toLargestUnit } from "@/shared/units/quantity";
import { useUnstartReservationRepair } from "../hooks/use-unstart-reservation-repair";
import type { ReservationRepairReason } from "../schemas/unstart-reservations";

const fields = [{ type: InputTypes.TEXTAREA, name: "reason", label: "Repair reason", required: true, rows: 2 }] as const satisfies readonly WizardField<ReservationRepairReason>[];
export default function UnstartReservationRepairDialog({ materialId, kind, onClose }: { materialId: string; kind: 0 | 1; onClose: () => void }) {
  const state = useUnstartReservationRepair(materialId, kind, onClose);
  return <Dialog open onOpenChange={open => { if (!open) state.close(); }}>
    <DialogContent className="sm:max-w-3xl" showCloseButton={!state.busy}>
      <DialogHeader><DialogTitle>Release Unstart reservations</DialogTitle>
        <DialogDescription>Release selected unused holds for this material after a recorded Unstart. QC/retest status and physical shelf quantities stay unchanged.</DialogDescription></DialogHeader>
      <form noValidate onSubmit={event => { event.stopPropagation(); void state.submit(event); }} className="flex min-h-0 min-w-0 flex-1 flex-col gap-4">
        <DialogBody className="space-y-4">
          <p className="text-sm text-muted-foreground">Review up to 200 reservations. The original Unstart must identify each hold. Issued stock and restarted batches block release.</p>
          {state.loading ? <div aria-label="Loading reservation preview" className="space-y-2"><Skeleton className="h-20 w-full" /><Skeleton className="h-20 w-full" /></div> : state.preview?.reservations.length === 0 ? <p role="status">No Unstart reservations need repair.</p> : null}
          <div className="space-y-2">{state.preview?.reservations.map(row => <div key={row.reservationId} className="flex items-start gap-3 rounded-md border p-3 text-sm">
            <Checkbox aria-label={`Release ${row.productBatch} · ${row.materialBatch}`} checked={state.selected.includes(row.reservationId)}
              disabled={state.busy || state.fetching || state.needsReview || row.blockers.length > 0} onCheckedChange={checked => state.toggle(row.reservationId, checked === true)} />
            <div className="min-w-0 flex-1 space-y-1"><p className="break-words font-medium">{row.product} · Batch {row.productBatch || "not recorded"}</p>
              <p className="break-words">Material batch {row.materialBatch || "not recorded"} · {toLargestUnit(row.quantity, row.unit, "calculated")?.text ?? row.quantity}</p>
              <p className="text-muted-foreground">Unstarted {formatDateTime(row.unstartedAt) ?? row.unstartedAt}</p>
              {row.blockers.length ? <ul className="list-disc space-y-1 pl-5 text-destructive">{row.blockers.map(blocker => <li key={blocker}>{blocker}</li>)}</ul> : <p>Eligible for release</p>}
            </div>
          </div>)}</div>
          <FormWizard form={state.form} fields={fields} />
          {state.error || state.message || !state.permission.allowed ? <p role="alert" className="text-sm text-destructive">{state.message || state.error || "Your current permissions do not allow this repair."}</p> : null}
          {state.needsReview ? <p role="status" className="text-sm">Reload and review the reservations before trying again.</p> : null}
        </DialogBody>
        <DialogFooter><Button type="button" variant="outline" disabled={state.busy} onClick={state.close}>Cancel</Button>
          <Button type="button" variant="outline" disabled={state.busy || state.fetching || !state.permission.allowed} onClick={() => void state.reload()}>Reload preview</Button>
          <Button type="submit" variant="destructive" disabled={state.blocked}>{state.busy ? "Releasing…" : `Release selected (${state.selected.length})`}</Button>
        </DialogFooter>
      </form>
    </DialogContent>
  </Dialog>;
}
