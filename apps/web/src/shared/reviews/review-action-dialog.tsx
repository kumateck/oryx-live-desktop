import { useId, useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogBody, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Spinner } from "@/components/ui/spinner";
import { Textarea } from "@/components/ui/textarea";
import type { PermissionRequirement } from "../auth/access";
import { permissionDeniedMessage, usePermissionAction } from "../auth/use-permission-action";

/**
 * Confirm, return or send back a record's review, with a comment. `onAct` returns the reason it failed,
 * or null when it worked; a failure keeps the dialog open with the reason.
 */
export function ReviewActionDialog({ title, description, actLabel, busyLabel, commentRequired, require, onAct, onClose }: {
  title: string;
  description: string;
  actLabel: string;
  busyLabel: string;
  commentRequired: boolean;
  require: PermissionRequirement;
  onAct: (comments: string | null) => Promise<string | null>;
  onClose: () => void;
}) {
  const [comments, setComments] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const permission = usePermissionAction(require);
  const id = useId();
  const run = async () => {
    if (busy) return;
    const text = comments.trim();
    if (commentRequired && !text) { setError("Say what needs correcting."); return; }
    const denied = permission.check();
    if (denied) { setError(denied); return; }
    setBusy(true); setError("");
    try { const failure = await onAct(text || null); if (failure) setError(failure); else onClose(); }
    catch { setError("The request could not be completed. Try again."); }
    finally { setBusy(false); }
  };
  return <Dialog open onOpenChange={(open) => { if (!open && !busy) onClose(); }}><DialogContent>
    <DialogHeader><DialogTitle>{title}</DialogTitle></DialogHeader>
    <DialogBody className="space-y-3">
      <DialogDescription className="break-words">{description}</DialogDescription>
      <div className="space-y-1.5">
        <Label htmlFor={id}>{commentRequired ? "What needs correcting" : "Comment (optional)"}</Label>
        <Textarea id={id} value={comments} maxLength={1000} rows={4} onChange={(event) => setComments(event.target.value)} />
      </div>
      {error || !permission.allowed ? <p role="alert" className="break-words text-sm text-destructive">{error || permissionDeniedMessage}</p> : null}
    </DialogBody>
    <DialogFooter>
      <Button type="button" variant="outline" disabled={busy} onClick={onClose}>Cancel</Button>
      <Button type="button" disabled={busy || !permission.allowed} onClick={() => void run()}>{busy ? <><Spinner />{busyLabel}</> : actLabel}</Button>
    </DialogFooter>
  </DialogContent></Dialog>;
}
