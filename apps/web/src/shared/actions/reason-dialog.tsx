import { useId, useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogBody, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Spinner } from "@/components/ui/spinner";
import { Textarea } from "@/components/ui/textarea";
import type { PermissionRequirement } from "../auth/access";
import { permissionDeniedMessage, usePermissionAction } from "../auth/use-permission-action";

const maxLength = 1000;

/**
 * Asks for the reason before an action that refuses a record, such as rejecting a request. The reason is required
 * (1–1000 characters) and is passed to `onConfirm`, which returns why it failed, or null when it worked; a failure
 * keeps the dialog open with the reason still typed.
 */
export function ReasonDialog({ title, description, label, placeholder, confirmLabel, busyLabel, require, onConfirm, onClose }: {
  title: string; description: string; label: string; placeholder?: string; confirmLabel: string; busyLabel: string;
  require: PermissionRequirement; onConfirm: (reason: string) => Promise<string | null>; onClose: () => void;
}) {
  const id = useId();
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const permission = usePermissionAction(require);
  const trimmed = reason.trim();
  const run = async () => {
    if (busy) return;
    if (!trimmed) { setError("Give a reason."); return; }
    const denied = permission.check();
    if (denied) { setError(denied); return; }
    setBusy(true); setError("");
    try { const failure = await onConfirm(trimmed); if (failure) setError(failure); else onClose(); }
    catch { setError("The request could not be completed. Try again."); }
    finally { setBusy(false); }
  };
  return <Dialog open onOpenChange={(open) => { if (!open && !busy) onClose(); }}><DialogContent>
    <DialogHeader><DialogTitle>{title}</DialogTitle></DialogHeader>
    <DialogBody className="space-y-3">
      <DialogDescription className="break-words">{description}</DialogDescription>
      <div className="space-y-1.5">
        <Label htmlFor={id}>{label}</Label>
        <Textarea id={id} value={reason} maxLength={maxLength} rows={4} placeholder={placeholder} disabled={busy} aria-invalid={error === "Give a reason."}
          onChange={(event) => { setReason(event.target.value); if (error === "Give a reason.") setError(""); }} />
        <p className="text-right text-xs text-muted-foreground">{reason.length}/{maxLength}</p>
      </div>
      {error || !permission.allowed ? <p role="alert" className="break-words text-sm text-destructive">{error || permissionDeniedMessage}</p> : null}
    </DialogBody>
    <DialogFooter>
      <Button type="button" variant="outline" disabled={busy} onClick={onClose}>Cancel</Button>
      <Button type="button" variant="destructive" disabled={busy || !permission.allowed || !trimmed} onClick={() => void run()}>{busy ? <><Spinner />{busyLabel}</> : confirmLabel}</Button>
    </DialogFooter>
  </DialogContent></Dialog>;
}
