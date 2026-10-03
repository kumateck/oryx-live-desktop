import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Spinner } from "@/components/ui/spinner";
import type { PermissionRequirement } from "../auth/access";
import { permissionDeniedMessage, usePermissionAction } from "../auth/use-permission-action";

/** A deliberate confirmation for destructive record actions; caller supplies the actual mutation. */
export function ConfirmDeleteDialog({ name, onConfirm, require }: { name: string; onConfirm: () => Promise<string | null>; require: PermissionRequirement }) {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const permission = usePermissionAction(require);
  const remove = async () => {
    if (busy) return;
    const denied = permission.check();
    if (denied) { setError(denied); return; }
    setBusy(true); setError("");
    try { const failure = await onConfirm(); if (failure) setError(failure); else setOpen(false); }
    catch { setError("Could not delete this record. Try again."); }
    finally { setBusy(false); }
  };
  return <Dialog open={open} onOpenChange={(next) => { if (!busy) { setOpen(next); setError(""); } }}>
    <DialogTrigger asChild><Button type="button" size="sm" variant="outline" className="text-destructive" disabled={!permission.allowed}>Delete</Button></DialogTrigger>
    <DialogContent><DialogHeader><DialogTitle>Delete {name}?</DialogTitle>
      <DialogDescription>This record will be removed from the active directory. Check its dependencies before continuing.</DialogDescription></DialogHeader>
      {error || !permission.allowed ? <p role="alert" className="text-sm text-destructive">{error || permissionDeniedMessage}</p> : null}
      <DialogFooter><Button type="button" variant="outline" disabled={busy} onClick={() => setOpen(false)}>Cancel</Button>
        <Button type="button" variant="destructive" disabled={busy || !permission.allowed} onClick={() => void remove()}>{busy ? <><Spinner />Deleting…</> : "Delete"}</Button></DialogFooter>
    </DialogContent>
  </Dialog>;
}
