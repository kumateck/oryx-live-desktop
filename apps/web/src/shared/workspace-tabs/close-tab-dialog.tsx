import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import type { WorkspaceTab, WorkspaceTabs } from "./workspace-tabs";

/** Asks before discarding a tab's unsaved work; the pending-write check is repeated at the final click. */
export function CloseTabDialog({ workspace, closing, onDone, busyMessage }: {
  workspace: WorkspaceTabs; closing: WorkspaceTab | null; onDone: () => void; busyMessage: string;
}) {
  return <Dialog open={Boolean(closing)} onOpenChange={(open) => { if (!open) onDone(); }}>
    <DialogContent><DialogHeader><DialogTitle>Close without saving?</DialogTitle>
      <DialogDescription>Your changes in {closing?.title} have not been saved and will be lost.</DialogDescription></DialogHeader>
      <DialogFooter>
        <Button variant="outline" onClick={() => { if (closing) workspace.focus(closing.id); onDone(); }}>Keep editing</Button>
        <Button variant="destructive" onClick={() => {
          if (closing && workspace.close(closing.id, true)) onDone();
          else toast.error(busyMessage);
        }}>Discard and close</Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>;
}
