import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogBody, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Spinner } from "@/components/ui/spinner";
import { useRemoveBatches } from "../../hooks/use-remove-batches";
import { batchLabel, groupBatches, type BatchGroup } from "../../lib/schedule-batches";
import type { ScheduleRow } from "../../schemas/schedule-schema";
import { RemoveBatchGroup } from "./remove-batch-group";

export function RemoveProductsPanel({ schedule }: { schedule: ScheduleRow }) {
  const groups = useMemo(() => groupBatches(schedule.products), [schedule.products]);
  const removal = useRemoveBatches();
  const [selected, setSelected] = useState<ReadonlySet<string>>(() => new Set());
  const [confirming, setConfirming] = useState(false);

  // Only batches still on the schedule count; one removed meanwhile drops out of the selection.
  const chosen = useMemo(() => groups.flatMap((group) => group.batches.flatMap((batch, index) =>
    batch.id && selected.has(batch.id) ? [{ id: batch.id, label: `${group.name}, ${batchLabel(batch, index)}` }] : [])), [groups, selected]);
  const toggle = (id: string, checked: boolean) => setSelected((current) => { const next = new Set(current); if (checked) next.add(id); else next.delete(id); return next; });
  const selectIn = (group: BatchGroup, ids: string[]) => setSelected((current) => {
    const next = new Set(current);
    for (const batch of group.batches) if (batch.id) next.delete(batch.id);
    for (const id of ids) next.add(id);
    return next;
  });
  const confirm = async () => {
    setConfirming(false);
    const failed = await removal.run(chosen);
    // What could not be removed stays selected, so it can be tried again.
    setSelected(new Set(failed.map((item) => item.id)));
  };

  return <div className="min-w-0 space-y-4">
    <div className="flex flex-wrap items-center justify-between gap-2">
      <p className="text-sm text-muted-foreground">Tick the batches to take off the schedule. A batch that is in production or cancelled cannot be removed.</p>
      <Button type="button" variant="destructive" size="sm" disabled={chosen.length === 0 || removal.removing} onClick={() => setConfirming(true)}>
        {removal.removing ? <><Spinner />Removing…</> : `Remove selected (${chosen.length})`}</Button>
    </div>
    {removal.failures.length ? <div role="alert" className="space-y-1 rounded-md border border-destructive/40 bg-destructive/5 p-3 text-sm">
      <p className="font-medium text-destructive">{removal.failures.length} {removal.failures.length === 1 ? "batch was" : "batches were"} not removed:</p>
      <ul className="space-y-0.5">{removal.failures.map((item) => <li key={item.id} className="break-words">{item.label}: {item.reason}</li>)}</ul>
    </div> : null}
    {groups.length === 0 ? <p className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">This schedule has no products.</p>
      : groups.map((group) => <RemoveBatchGroup key={group.key} group={group} selected={selected} disabled={removal.removing} onToggle={toggle} onSelect={selectIn} />)}

    {confirming ? <Dialog open onOpenChange={(open) => { if (!open) setConfirming(false); }}><DialogContent>
      <DialogHeader><DialogTitle>Remove {chosen.length} {chosen.length === 1 ? "batch" : "batches"}?</DialogTitle>
        <DialogDescription>They are taken off {schedule.code ?? "the schedule"} and cannot be put back; add the product again if this was a mistake.</DialogDescription></DialogHeader>
      <DialogBody><ul className="space-y-0.5 text-sm">{chosen.map((item) => <li key={item.id} className="break-words">{item.label}</li>)}</ul></DialogBody>
      <DialogFooter>
        <Button type="button" variant="outline" onClick={() => setConfirming(false)}>Cancel</Button>
        <Button type="button" variant="destructive" onClick={() => void confirm()}>Remove</Button>
      </DialogFooter>
    </DialogContent></Dialog> : null}
  </div>;
}
