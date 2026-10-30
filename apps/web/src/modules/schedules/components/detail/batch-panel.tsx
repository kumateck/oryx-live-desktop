import { useState } from "react";
import { Play, SquareKanban } from "lucide-react";
import { Link } from "react-router";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Spinner } from "@/components/ui/spinner";
import { Skeleton } from "@/shared/skeleton/skeleton";
import { useBatch } from "../../hooks/use-batch";
import { batchSizeText, batchStateLabels, type BatchState } from "../../lib/schedule-batches";
import type { ScheduleBatch } from "../../schemas/schedule-schema";
import { BatchMaterialsTable } from "./batch-materials-table";
import { RaiseShortageRequisition } from "./raise-shortage-requisition";

const stateVariants: Record<BatchState, "default" | "secondary" | "outline" | "destructive"> = { started: "default", waiting: "outline", missed: "secondary", cancelled: "destructive" };

/** One batch: where it stands, what it needs, and starting it once the materials are there. */
export function BatchPanel({ batch, batchId, label, state }: { batch: ScheduleBatch; batchId: string; label: string; state: BatchState }) {
  const data = useBatch(batchId);
  const [confirming, setConfirming] = useState(false);
  const facts = [["Product", batch.code ? `${batch.code} - ${batch.name}` : batch.name], ["Batch size", batchSizeText(batch)], ["Packing style", batch.packing?.name ?? "–"], ["Market type", batch.market?.name ?? "–"]];
  const running = state === "started";

  return <section className="min-w-0 space-y-4 rounded-lg border bg-card p-4" aria-label={`${batch.name}, ${label}`}>
    <div className="flex flex-wrap items-start justify-between gap-3">
      <div className="min-w-0 space-y-1">
        <h2 className="break-words text-base font-semibold">{batch.name} <span className="font-normal text-muted-foreground">· {label}</span></h2>
        <div className="flex flex-wrap items-center gap-2 text-sm">
          <Badge variant={stateVariants[state]}>{batchStateLabels[state]}</Badge>
          {running ? data.activityLoading ? <Skeleton className="h-4 w-40" /> : <span>{data.activity?.step ? `Current step: ${data.activity.step}` : "Production is under way"}</span> : null}
        </div>
      </div>
      {running && (data.activity?.id ?? batch.activityId) ? <Button asChild size="sm"><Link to={`/production/activities/${data.activity?.id ?? batch.activityId}/board`}><SquareKanban />Open production board</Link></Button> : null}
      {state === "waiting" ? <Button type="button" size="sm" disabled={data.short !== 0 || data.starting} onClick={() => setConfirming(true)}>
        {data.starting ? <><Spinner />Starting…</> : <><Play />Start production</>}</Button> : null}
    </div>

    {state === "cancelled" ? <p role="alert" className="rounded-md border border-destructive/40 bg-destructive/5 p-3 text-sm">
      This batch was cancelled. {batch.cancellationReason ? `Reason: ${batch.cancellationReason}` : "No reason was recorded."}</p> : null}
    {state === "missed" ? <p className="rounded-md border bg-muted/50 p-3 text-sm">This batch was not started before the schedule ended. It can no longer be started.</p> : null}
    {state === "waiting" && data.short ? <p className="rounded-md border border-destructive/40 bg-destructive/5 p-3 text-sm">
      {data.short} raw {data.short === 1 ? "material is" : "materials are"} short, so production cannot start. They are listed first below.
      A purchase requisition can be raised for those not already being bought.</p> : null}
    {state === "waiting" && data.packagingShort ? <p className="rounded-md border bg-muted/50 p-3 text-sm">
      {data.packagingShort} packaging {data.packagingShort === 1 ? "material is" : "materials are"} short. Production can start without {data.packagingShort === 1 ? "it" : "them"};
      packaging is requested on the production board before final packing.</p> : null}

    {data.message ? <p role="alert" className="text-sm text-destructive">{data.message}</p> : null}

    <dl className="grid gap-x-8 gap-y-2 rounded-md bg-muted/50 p-3 sm:grid-cols-2 xl:grid-cols-4">{facts.map(([name, value]) =>
      <div key={name} className="min-w-0"><dt className="text-xs text-muted-foreground">{name}</dt><dd className="break-words text-sm font-medium">{value}</dd></div>)}</dl>

    <div className={state === "cancelled" ? "space-y-4 opacity-60" : "space-y-4"}>
      <BatchMaterialsTable title="Raw materials" rows={data.raw.rows} loading={data.raw.loading} error={data.raw.error} onRetry={data.raw.retry}
        action={state === "waiting" ? <RaiseShortageRequisition kind={0} batchId={batchId} batchName={`${batch.name}, ${label}`} materials={data.raw.rows} onRaised={data.raw.retry} /> : null} />
      <BatchMaterialsTable title="Packaging materials" rows={data.packaging.rows} loading={data.packaging.loading} error={data.packaging.error} onRetry={data.packaging.retry}
        action={state === "waiting" ? <RaiseShortageRequisition kind={1} batchId={batchId} batchName={`${batch.name}, ${label}`} materials={data.packaging.rows} onRaised={data.packaging.retry} /> : null} />
    </div>

    {confirming ? <Dialog open onOpenChange={(open) => { if (!open) setConfirming(false); }}><DialogContent>
      <DialogHeader><DialogTitle>Start production of {batch.name}?</DialogTitle>
        <DialogDescription>{label}, {batchSizeText(batch).toLowerCase()}. Once started, the batch can no longer be removed from the schedule.</DialogDescription></DialogHeader>
      <DialogFooter>
        <Button type="button" variant="outline" onClick={() => setConfirming(false)}>Cancel</Button>
        <Button type="button" onClick={() => { setConfirming(false); void data.start(); }}>Start production</Button>
      </DialogFooter>
    </DialogContent></Dialog> : null}
  </section>;
}
