import { Button } from "@/components/ui/button";
import { Dialog, DialogBody, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Spinner } from "@/components/ui/spinner";
import { formatDateTime } from "@/shared/format/dates";
import { FormWizard, type WizardField } from "@/shared/forms/form-wizard";
import { InputTypes } from "@/shared/forms/input-types";
import { useIssuedMaterialRepair } from "../../hooks/use-issued-material-repair";
import { issuedRepairTitles, type RepairKind, type RepairReason, type RepairRow } from "../../schemas/issued-material-repair";
import { IssuedMaterialRepairRows } from "./issued-material-repair-rows";

const fields = [{ type: InputTypes.TEXTAREA, name: "reason", label: "Repair reason", required: true, rows: 2 }] as const satisfies readonly WizardField<RepairReason>[];
const emptyRows: readonly RepairRow[] = [];
type RepairState = ReturnType<typeof useIssuedMaterialRepair>;

function RepairEvidence({ state }: { state: RepairState }) {
  const { preview, form, loading, error, message, needsReview, permission } = state;
  return <>
    {preview ? <p className="text-sm">Requisition <strong>{preview.requisitionCode}</strong></p> : null}
    <IssuedMaterialRepairRows rows={preview?.rows ?? emptyRows} loading={loading} />
    {preview?.blockers.length ? <div role="alert" className="space-y-1 text-sm text-destructive"><p className="font-medium">This stock cannot be repaired automatically:</p>
      <ul className="list-disc space-y-1 pl-5">{[...new Set(preview.blockers)].map((blocker) => <li className="break-words" key={blocker}>{blocker}</li>)}</ul></div> : null}
    {preview && !preview.hasChanges && preview.blockers.length === 0 ? <p role="status">The issued quantities already match the current master. No stock adjustment is needed.</p> : null}
    <FormWizard form={form} fields={fields} />
    {preview?.history.length ? <section className="space-y-2"><h2 className="font-semibold">Previous repairs</h2>{preview.history.map((repair) => <div key={repair.id} className="space-y-1 border-t pt-2 text-sm">
      <p>{formatDateTime(repair.appliedAt)} · {repair.reason}</p><p className="break-all text-xs text-muted-foreground">Reference: {repair.id} · Operator: {repair.actorId}</p>
    </div>)}</section> : null}
    {error || message || !permission.allowed ? <p role="alert" className="break-words text-sm text-destructive">{message || error || "Your current permissions do not allow this repair."}</p> : null}
    {needsReview ? <p role="status" className="text-sm">Reload and review the saved stock before trying again. Keep the same reason when retrying an uncertain response.</p> : null}
  </>;
}

export default function IssuedMaterialRepairDialog({ batchId, kind, onClose }: { batchId: string; kind: RepairKind; onClose: () => void }) {
  const state = useIssuedMaterialRepair(batchId, kind, onClose);
  return <Dialog open onOpenChange={(open) => { if (!open) state.close(); }}>
    <DialogContent className="sm:max-w-4xl" showCloseButton={!state.busy}>
      <DialogHeader><DialogTitle>{issuedRepairTitles[kind]}{state.preview ? ` · ${state.preview.batchNumber}` : ""}</DialogTitle>
        <DialogDescription>Save the corrected product {kind === 0 ? "BOM" : "packaging"} first. Review the additional issue or return below; the original approved requisition stays recorded.</DialogDescription></DialogHeader>
      <form noValidate onSubmit={(event) => { event.stopPropagation(); void state.submit(event); }} className="flex min-h-0 min-w-0 flex-1 flex-col gap-4">
        <DialogBody className="space-y-4"><RepairEvidence state={state} /></DialogBody>
        <DialogFooter>
          <Button type="button" variant="outline" disabled={state.busy} onClick={state.close}>Close</Button>
          <Button type="button" variant="outline" disabled={state.busy || state.fetching || !state.permission.allowed} onClick={() => void state.reload()}>Reload preview</Button>
          <Button type="submit" disabled={state.blocked}>{state.busy ? <><Spinner />Repairing…</> : "Apply stock repair"}</Button>
        </DialogFooter>
      </form>
    </DialogContent>
  </Dialog>;
}
