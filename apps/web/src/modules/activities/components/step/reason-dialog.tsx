import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Spinner } from "@/components/ui/spinner";
import { Textarea } from "@/components/ui/textarea";

/** Asks for the reason behind an action that cannot be undone. `onConfirm` returns why it failed, or null. */
export function ReasonDialog({ title, description, confirmLabel, busyLabel, onConfirm, onClose }: {
  title: string; description: string; confirmLabel: string; busyLabel: string;
  onConfirm: (reason: string) => Promise<string | null>; onClose: () => void;
}) {
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const submit = async () => {
    if (!reason.trim()) { setError("Give the reason."); return; }
    setBusy(true); setError("");
    const failure = await onConfirm(reason.trim());
    setBusy(false);
    if (failure) setError(failure); else onClose();
  };
  return <Dialog open onOpenChange={(open) => { if (!open && !busy) onClose(); }}><DialogContent>
    <DialogHeader><DialogTitle>{title}</DialogTitle><DialogDescription>{description}</DialogDescription></DialogHeader>
    <div className="space-y-2"><Label htmlFor="action-reason">Reason</Label>
      <Textarea id="action-reason" rows={3} value={reason} disabled={busy} onChange={(event) => setReason(event.target.value)} aria-invalid={Boolean(error)} /></div>
    {error ? <p role="alert" className="text-sm text-destructive">{error}</p> : null}
    <DialogFooter>
      <Button type="button" variant="outline" disabled={busy} onClick={onClose}>Cancel</Button>
      <Button type="button" variant="destructive" disabled={busy} onClick={() => void submit()}>{busy ? <><Spinner />{busyLabel}</> : confirmLabel}</Button>
    </DialogFooter>
  </DialogContent></Dialog>;
}
