import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Spinner } from "@/components/ui/spinner";
import type { SwapOutcome } from "../hooks/use-raise-swaps";
import type { SwapSuggestion } from "../lib/alternative-batches";
import { batchNumber } from "../lib/stock-issue";
import { amount } from "./batch-breakdown";

/** The chosen swaps, read back before anything is sent. A swap that could not be asked for stays listed with the reason. */
export function SwapReviewDialog({ swaps, outcomes, onSend, onClose }: { swaps: readonly SwapSuggestion[]; outcomes: readonly SwapOutcome[]; onSend: () => Promise<void>; onClose: () => void }) {
  const [busy, setBusy] = useState(false);
  const reasons = new Map(outcomes.map((outcome) => [outcome.key, outcome.reason]));
  const send = async () => { setBusy(true); try { await onSend(); } finally { setBusy(false); } };
  const label = swaps.length === 1 ? "Ask for 1 swap" : `Ask for ${swaps.length} swaps`;
  return <Dialog open onOpenChange={(open) => { if (!open && !busy) onClose(); }}><DialogContent className="sm:max-w-2xl">
    <DialogHeader><DialogTitle>{swaps.length === 1 ? "Ask for this swap?" : `Ask for these ${swaps.length} swaps?`}</DialogTitle>
      <DialogDescription>Each swap goes to the store that holds the earlier batch. Nothing moves until that store approves it.</DialogDescription></DialogHeader>
    <ul className="max-h-[50vh] space-y-2 overflow-y-auto">{swaps.map((swap) => { const reason = reasons.get(swap.key);
      return <li key={swap.key} className="rounded-md border p-3 text-sm">
        <div className="font-medium">{swap.materialName} · {amount(swap.quantity, swap.unit)}{swap.partial ? " (part of the batch set aside)" : ""}</div>
        <div className="text-muted-foreground">Give up batch {batchNumber(swap.current.number)}, take batch {batchNumber(swap.alternative.number)} from {swap.alternative.store}</div>
        {reason ? <p role="alert" className="mt-1 text-destructive">Not asked for: {reason}</p> : null}</li>; })}</ul>
    <DialogFooter>
      <Button type="button" variant="outline" disabled={busy} onClick={onClose}>{outcomes.length ? "Close" : "Cancel"}</Button>
      <Button type="button" disabled={busy || swaps.length === 0} onClick={() => void send()}>{busy ? <><Spinner />Asking…</> : outcomes.length ? "Try again" : label}</Button>
    </DialogFooter>
  </DialogContent></Dialog>;
}
