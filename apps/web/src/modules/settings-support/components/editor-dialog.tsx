import { useState, type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogBody, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Spinner } from "@/components/ui/spinner";

/** Shared form dialog for settings that must retain a draft after a failed save. */
export function SettingsEditorDialog({ title, description, busy, dirty, error, allowed, onClose, onSave, children }: {
  allowed: boolean; title: string; description: string; busy: boolean; dirty: boolean; error: string;
  onClose: () => void; onSave: () => Promise<void>; children: ReactNode;
}) {
  const [discarding, setDiscarding] = useState(false);
  const close = () => { if (!busy) { if (dirty) setDiscarding(true); else onClose(); } };
  return <Dialog open onOpenChange={(open) => { if (!open) close(); }}><DialogContent className="sm:max-w-2xl">
    <DialogHeader><DialogTitle>{title}</DialogTitle><DialogDescription>{description}</DialogDescription></DialogHeader>
    <form noValidate className="flex min-h-0 flex-1 flex-col gap-4" onSubmit={(event) => { event.preventDefault(); void onSave(); }}>
      <DialogBody className="space-y-4"><fieldset disabled={busy} className="space-y-4">{children}</fieldset>
        {error ? <p role="alert" className="text-sm text-destructive">{error}</p> : null}
        {discarding ? <div role="alert" className="space-y-2 rounded-lg border p-3"><p>Discard your unsaved changes?</p>
          <div className="flex gap-2"><Button type="button" variant="outline" onClick={() => setDiscarding(false)}>Keep editing</Button>
            <Button type="button" variant="destructive" onClick={onClose}>Discard changes</Button></div></div> : null}
      </DialogBody>
      <DialogFooter><Button type="button" variant="outline" disabled={busy} onClick={close}>Cancel</Button>
        <Button type="submit" disabled={busy || !allowed}>{busy ? <><Spinner />Saving…</> : "Save changes"}</Button></DialogFooter>
    </form>
  </DialogContent></Dialog>;
}
