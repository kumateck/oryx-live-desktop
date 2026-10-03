import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Spinner } from "@/components/ui/spinner";
import type { PermissionRequirement } from "../auth/access";
import { permissionDeniedMessage, usePermissionAction } from "../auth/use-permission-action";

/**
 * Asks before an action that removes or changes a record, opened from a menu item. Render it only
 * while it should show. `onConfirm` returns the reason it failed, or null when it worked; a failure
 * keeps the dialog open with the reason.
 */
export function ConfirmActionDialog({ title, description, confirmLabel, busyLabel, destructive = true, require, onConfirm, onClose }: {
  title: string;
  description: string;
  confirmLabel: string;
  busyLabel: string;
  destructive?: boolean;
  require: PermissionRequirement;
  onConfirm: () => Promise<string | null>;
  onClose: () => void;
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const permission = usePermissionAction(require);
  const run = async () => {
    if (busy) return;
    const denied = permission.check();
    if (denied) { setError(denied); return; }
    setBusy(true); setError("");
    try { const failure = await onConfirm(); if (failure) setError(failure); else onClose(); }
    catch { setError("The request could not be completed. Try again."); }
    finally { setBusy(false); }
  };
  return <Dialog open onOpenChange={(open) => { if (!open && !busy) onClose(); }}><DialogContent>
    <DialogHeader><DialogTitle>{title}</DialogTitle><DialogDescription>{description}</DialogDescription></DialogHeader>
    {error || !permission.allowed ? <p role="alert" className="text-sm text-destructive">{error || permissionDeniedMessage}</p> : null}
    <DialogFooter>
      <Button type="button" variant="outline" disabled={busy} onClick={onClose}>Cancel</Button>
      <Button type="button" variant={destructive ? "destructive" : "default"} disabled={busy || !permission.allowed} onClick={() => void run()}>{busy ? <><Spinner />{busyLabel}</> : confirmLabel}</Button>
    </DialogFooter>
  </DialogContent></Dialog>;
}
