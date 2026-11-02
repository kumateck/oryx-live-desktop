import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogBody, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Skeleton } from "@/shared/skeleton/skeleton";
import { toLargestUnit } from "@/shared/units/quantity";
import { useMaterialRepairApply, useMaterialRepairPreview } from "../../hooks/use-material-repair";
import { materialRepairs, type MaterialRepairKind } from "../../lib/material-repair";
import { materialRepairReasonSchema, type MaterialRepairPreview, type MaterialRepairReason } from "../../schemas/material-repair-schema";

type Props = { kind: MaterialRepairKind; activityId: string; batchLabel: string; onClose: () => void };
type State = { kind: "loading" } | { kind: "error"; message: string } | { kind: "ready"; preview: MaterialRepairPreview };

export function MaterialRepairDialog({ kind, activityId, batchLabel, onClose }: Props) {
  const read = useMaterialRepairPreview(activityId, kind);
  const [attempt, setAttempt] = useState(0);
  const [state, setState] = useState<State>({ kind: "loading" });
  useEffect(() => {
    let current = true;
    setState({ kind: "loading" });
    void read().then((preview) => { if (current) setState({ kind: "ready", preview }); },
      (error: Error) => { if (current) setState({ kind: "error", message: error.message || "The preview could not be loaded." }); });
    return () => { current = false; };
  }, [read, attempt]);
  const reload = () => setAttempt((value) => value + 1);
  return <Dialog open onOpenChange={(open) => { if (!open) onClose(); }}><DialogContent className="sm:max-w-3xl">
    <DialogHeader>
      <DialogTitle>Repair {materialRepairs[kind].label} · {batchLabel}</DialogTitle>
      <DialogDescription>Save the correct information on the product first. Review its effect on this batch below. Issued or consumed material cannot be repaired.</DialogDescription>
    </DialogHeader>
    {state.kind === "ready" ? <MaterialRepairReview key={`${attempt}:${state.preview.previewHash}`} kind={kind} activityId={activityId}
      preview={state.preview} onClose={onClose} reload={reload} /> : <>
      <DialogBody>{state.kind === "loading" ? <div aria-label="Loading repair preview" className="space-y-3"><Skeleton className="h-5 w-2/3" /><Skeleton className="h-24 w-full" /><Skeleton className="h-24 w-full" /></div>
        : <p role="alert" className="text-sm text-destructive">{state.message}</p>}</DialogBody>
      <DialogFooter><Button variant="outline" onClick={onClose}>Close</Button>{state.kind === "error" ? <Button onClick={reload}>Retry preview</Button> : null}</DialogFooter>
    </>}
  </DialogContent></Dialog>;
}

function MaterialRepairReview({ kind, activityId, preview, onClose, reload }: Omit<Props, "batchLabel"> & { preview: MaterialRepairPreview; reload: () => void }) {
  const action = useMaterialRepairApply(activityId, kind, preview);
  const [message, setMessage] = useState<string | null>(null);
  const form = useForm<MaterialRepairReason>({ resolver: zodResolver(materialRepairReasonSchema), defaultValues: { reason: "" }, mode: "onChange" });
  const blocked = preview.blockers.length > 0;
  const quantity = (value: number, unit: string) => toLargestUnit(value, unit, "calculated")?.text ?? "—";
  return <form className="flex min-h-0 flex-1 flex-col gap-4" onSubmit={form.handleSubmit(async ({ reason }) => {
    const failure = await action.submit(reason);
    if (failure) setMessage(failure); else onClose();
  })}>
    <DialogBody className="space-y-4">
      <p className="text-xs text-muted-foreground">Before: {preview.baseline}. After: the product’s saved configuration.</p>
      {blocked ? <div role="alert" className="space-y-1 text-sm text-destructive"><p className="font-medium">This repair cannot be applied.</p><ul className="list-disc space-y-1 pl-4">{preview.blockers.map((blocker) => <li key={blocker}>{blocker}</li>)}</ul></div> : null}
      {!preview.hasChanges ? <p className="text-sm">The batch already matches the saved product configuration. No repair is needed.</p> : null}
      <dl className="divide-y divide-border">{preview.lines.map((line) => <div key={line.materialId} className="space-y-2 py-3">
        <dt className="break-words text-sm font-medium">{line.name}</dt>
        <dd className="grid grid-cols-2 gap-3 text-xs sm:grid-cols-4">
          <div><span className="block text-muted-foreground">Required before</span>{quantity(line.before, line.unit)}</div>
          <div><span className="block text-muted-foreground">Required after</span>{quantity(line.after, line.unit)}</div>
          <div><span className="block text-muted-foreground">Reserved before</span>{quantity(line.reservedBefore, line.unit)}</div>
          <div><span className="block text-muted-foreground">Reserved after</span>{quantity(line.reservedAfter, line.unit)}</div>
        </dd>
        {line.shortage > 0 ? <dd className="text-xs text-destructive">Short by {quantity(line.shortage, line.unit)}</dd> : null}
      </div>)}</dl>
      {preview.approvalRequired && !blocked ? <p className="text-sm">The corrected requisition will need fresh approval. Its earlier approval decisions remain in the audit history.</p> : null}
      {preview.hasChanges && !blocked ? <div className="space-y-2">
        <label htmlFor="repair-reason" className="text-sm font-medium">Reason for repair</label>
        <Textarea id="repair-reason" maxLength={2000} disabled={action.busy || action.attempted} aria-invalid={Boolean(form.formState.errors.reason)} {...form.register("reason")} />
        {form.formState.errors.reason ? <p role="alert" className="text-xs text-destructive">{form.formState.errors.reason.message}</p> : null}
      </div> : null}
      {!action.allowed ? <p role="alert" className="text-sm text-destructive">Your repair permission is no longer available.</p> : null}
      {message ? <p role="alert" className="text-sm text-destructive">{message}{action.attempted ? " Check the batch’s current state before getting another preview." : ""}</p> : null}
    </DialogBody>
    <DialogFooter>
      <Button type="button" variant="outline" disabled={action.busy} onClick={onClose}>Close</Button>
      <Button type="button" variant="outline" disabled={action.busy || !action.allowed} onClick={reload}>Refresh preview</Button>
      <Button type="submit" disabled={blocked || !preview.hasChanges || !action.allowed || !form.formState.isValid || action.busy || action.attempted}>
        {action.busy ? "Repairing…" : `Apply ${materialRepairs[kind].label} repair`}
      </Button>
    </DialogFooter>
  </form>;
}
