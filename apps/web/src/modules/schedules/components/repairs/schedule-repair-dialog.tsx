import { useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogBody, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Spinner } from "@/components/ui/spinner";
import { Skeleton } from "@/shared/skeleton/skeleton";
import { FormWizard, type WizardField } from "@/shared/forms/form-wizard";
import { InputTypes } from "@/shared/forms/input-types";
import type { SelectOption } from "@/shared/forms/form-wizard-types";
import { useScheduleRepair } from "../../hooks/use-schedule-repair";
import { scheduleRepairTitles, type ScheduleRepairKind, type ScheduleRepairValues } from "../../schemas/schedule-repair";
import { ScheduleRepairRows } from "./schedule-repair-rows";

export default function ScheduleRepairDialog({ scheduleId, kind, products, initialProductId, onClose }: {
  scheduleId: string; kind: ScheduleRepairKind; products: readonly SelectOption[]; initialProductId: string | null; onClose: () => void;
}) {
  const state = useScheduleRepair(scheduleId, kind, products.find((product) => product.value === initialProductId) ?? null);
  const fields = useMemo((): WizardField<ScheduleRepairValues>[] => [
    { type: InputTypes.SELECT, name: "product", label: "Product in this schedule", mode: "single", source: "sync", options: products, required: true },
    { type: InputTypes.TEXTAREA, name: "reason", label: "Repair reason", required: true, rows: 2 },
  ], [products]);
  const count = state.preview?.batches.filter((batch) => batch.status === "ready").length ?? 0;
  const close = () => { if (state.canClose()) onClose(); };
  return <Dialog open onOpenChange={(open) => { if (!open) close(); }}>
    <DialogContent className="sm:max-w-4xl" showCloseButton={!state.busy}>
      <DialogHeader><DialogTitle>{scheduleRepairTitles[kind]} · Product batches</DialogTitle>
        <DialogDescription>Save the corrected product master first. Review every matching batch in this schedule, including different sizes and packing styles.</DialogDescription></DialogHeader>
      <form noValidate onSubmit={(event) => { event.stopPropagation(); void state.submit(event); }} className="flex min-h-0 min-w-0 flex-1 flex-col gap-4">
        <DialogBody className="space-y-4">
          <fieldset disabled={state.busy || state.uncertain || Boolean(state.receipt)}><FormWizard form={state.form} fields={fields} className="md:grid-cols-2" /></fieldset>
          {!state.receipt ? <Button type="button" variant="outline" disabled={state.busy || state.uncertain || !state.permission.allowed} onClick={() => void state.reload()}>
            {state.preview ? "Reload preview" : "Preview batches"}</Button> : null}
          {state.busy && !state.preview ? <div aria-label="Loading batch repair preview" className="space-y-2"><Skeleton className="h-8 w-full" /><Skeleton className="h-24 w-full" /></div> : null}
          {state.preview && !state.receipt ? <>
            <p className="break-words text-sm"><strong>{state.form.getValues("product")?.label}</strong> · {state.preview.batches.length} matching batches · {count} ready to repair. Unstarted, completed and cancelled batches are listed as skipped.</p>
            <ScheduleRepairRows rows={state.preview.batches} />
            {state.preview.blockers.map((blocker) => <p key={blocker} role="alert" className="break-words text-sm text-destructive">{blocker}</p>)}
            {!count && !state.preview.blockers.length ? <p role="status">No running batches need this repair.</p> : null}
            <p className="text-sm text-muted-foreground">All ready batches are repaired together. A failure changes none of them. {kind === 2
              ? "Completed steps stay unchanged."
              : "Stock is reserved from the remaining availability in batch order. No stock is issued; changed requisitions require fresh approval."}</p>
          </> : null}
          {state.receipt ? <div role="status" className="space-y-2 text-sm">
            <p className="font-medium">{state.receipt.repaired} batches repaired · {state.receipt.unchanged} already matched · {state.receipt.skipped} skipped.</p>
            {state.receipt.requiringApproval > 0 ? <p>{state.receipt.requiringApproval} requisitions require fresh approval before stock issue.</p> : null}
            <p className="break-all text-muted-foreground">Repair reference: {state.receipt.repairId}</p>
          </div> : null}
          {state.message || !state.permission.allowed ? <p role="alert" className="break-words text-sm text-destructive">{state.message || "Your current permissions do not allow this repair."}</p> : null}
          {state.needsReview && !state.uncertain ? <p className="text-sm">Reload and review the preview before trying again.</p> : null}
          {state.uncertain ? <p className="text-sm">The response is uncertain. Check the same request to retrieve its saved receipt or refusal.</p> : null}
        </DialogBody>
        <DialogFooter>
          <Button type="button" variant="outline" disabled={state.busy} onClick={close}>Close</Button>
          {state.uncertain ? <Button type="button" disabled={state.busy || !state.permission.allowed} onClick={() => void state.retry()}>Check same repair request</Button>
            : !state.receipt ? <Button type="submit" disabled={state.blocked}>{state.busy ? <><Spinner />Repairing…</> : `Apply to ${count} ${count === 1 ? "batch" : "batches"}`}</Button> : null}
        </DialogFooter>
      </form>
    </DialogContent>
  </Dialog>;
}
