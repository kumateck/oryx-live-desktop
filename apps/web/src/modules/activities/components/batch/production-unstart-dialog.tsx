import { Button } from "@/components/ui/button";
import { Dialog, DialogBody, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Spinner } from "@/components/ui/spinner";
import { ListDataTable, dataTableColumns } from "@/shared/datatable";
import { FormWizard, type WizardField } from "@/shared/forms/form-wizard";
import { InputTypes } from "@/shared/forms/input-types";
import { toLargestUnit } from "@/shared/units/quantity";
import { useProductionUnstart } from "../../hooks/use-production-unstart";
import type { UnstartPreview, UnstartReason } from "../../schemas/production-unstart";

const fields = [{ type: InputTypes.TEXTAREA, name: "reason", label: "Repair reason", required: true, rows: 2 }] as const satisfies readonly WizardField<UnstartReason>[];
type Reservation = UnstartPreview["reservations"][number];
const column = dataTableColumns<Reservation>();
const columns = column.columns([
  column.accessor("materialCode", { header: "Material", cell: ({ row }) => <div className="min-w-0 break-words"><p className="font-medium">{row.original.materialCode}</p><p className="text-xs text-muted-foreground">{row.original.materialName}</p></div> }),
  column.accessor("lotNumber", { header: "Reserved lot", cell: ({ getValue }) => <span className="break-all">{getValue()}</span> }),
  column.accessor("quantity", { header: "Reservation to release", size: 180, cell: ({ row }) => toLargestUnit(row.original.quantity, row.original.unit, "calculated")?.text ?? "Unavailable" }),
]);
const empty: readonly Reservation[] = [];

export default function ProductionUnstartDialog({ activityId, onClose }: { activityId: string; onClose: () => void }) {
  const state = useProductionUnstart(activityId, onClose);
  return <Dialog open onOpenChange={(open) => { if (!open) state.close(); }}>
    <DialogContent className="sm:max-w-2xl" showCloseButton={!state.busy}>
      <DialogHeader><DialogTitle>Unstart production{state.preview?.batchNumber ? ` · ${state.preview.batchNumber}` : ""}</DialogTitle>
        <DialogDescription>Return this batch to awaiting start while its BMR is still unissued. The original run and draft documents stay in the repair history.</DialogDescription></DialogHeader>
      <form noValidate onSubmit={(event) => { event.stopPropagation(); void state.submit(event); }} className="flex min-h-0 min-w-0 flex-1 flex-col gap-4">
        <DialogBody className="space-y-4">
          {state.preview ? <div className="space-y-1 text-sm"><p className="font-medium break-words">{state.preview.productName}</p>
            <p>{state.preview.stepsToArchive} steps and {state.preview.draftDocumentsToArchive} draft documents will be archived.</p>
            <p>Unissued reservations are released. Physical shelf stock does not change.</p></div> : null}
          <ListDataTable label="Reservations to release" columns={columns} rows={state.preview?.reservations ?? empty} getRowId={(row) => row.id}
            loading={state.loading} emptyTitle="No material reservations to release" />
          {state.preview?.blockers.length ? <div role="alert" className="space-y-1 text-sm text-destructive"><p className="font-medium">This run cannot be unstarted:</p>
            <ul className="list-disc space-y-1 pl-5">{state.preview.blockers.map((blocker) => <li key={blocker} className="break-words">{blocker}</li>)}</ul></div> : null}
          <FormWizard form={state.form} fields={fields} />
          {state.message || state.error || !state.permission.allowed ? <p role="alert" className="break-words text-sm text-destructive">{state.message || state.error || "Your current permissions do not allow this repair."}</p> : null}
          {state.needsReview ? <p role="status" className="text-sm">Reload and review the saved run before trying again.</p> : null}
        </DialogBody>
        <DialogFooter>
          <Button type="button" variant="outline" disabled={state.busy} onClick={state.close}>Cancel</Button>
          <Button type="button" variant="outline" disabled={state.busy || state.fetching || !state.permission.allowed} onClick={() => void state.reload()}>Reload preview</Button>
          <Button type="submit" variant="destructive" disabled={state.blocked}>{state.busy ? <><Spinner />Unstarting…</> : "Unstart production"}</Button>
        </DialogFooter>
      </form>
    </DialogContent>
  </Dialog>;
}
