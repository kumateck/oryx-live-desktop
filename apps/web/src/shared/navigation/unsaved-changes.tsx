import { useEffect } from "react";
import { useBlocker } from "react-router";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";

/**
 * Asks before the user leaves a form with unsaved edits, whether by a link, the sidebar, back, or
 * closing the window. Render it inside the form's page and pass whether the form is dirty.
 */
export function UnsavedChangesGuard({ when }: { when: boolean }) {
  const blocker = useBlocker(({ currentLocation, nextLocation }) => when && currentLocation.pathname !== nextLocation.pathname);
  useEffect(() => {
    if (!when) return;
    const warn = (event: BeforeUnloadEvent) => { event.preventDefault(); };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [when]);
  // A save that clears the form while the question is open lets the navigation through.
  useEffect(() => { if (blocker.state === "blocked" && !when) blocker.proceed(); }, [blocker, when]);
  if (blocker.state !== "blocked") return null;
  return <Dialog open onOpenChange={(open) => { if (!open) blocker.reset(); }}>
    <DialogContent>
      <DialogHeader><DialogTitle>Leave without saving?</DialogTitle>
        <DialogDescription>Your changes on this page have not been saved and will be lost.</DialogDescription></DialogHeader>
      <DialogFooter>
        <Button type="button" variant="outline" onClick={() => blocker.reset()}>Keep editing</Button>
        <Button type="button" variant="destructive" onClick={() => blocker.proceed()}>Leave</Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>;
}
