import { useEffect } from "react";
import { useBlocker } from "react-router";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useDesktopTab } from "./context";

/** One blocker per desktop router, shared by all forms and workflow guards in that page. */
export function DesktopRouteBlocker() {
  const desktop = useDesktopTab();
  if (!desktop) return null;
  return <TabRouteBlocker workspace={desktop.workspace} id={desktop.id} />;
}

function TabRouteBlocker({ workspace, id }: NonNullable<ReturnType<typeof useDesktopTab>>) {
  const dirty = workspace.getSnapshot().tabs.some((tab) => tab.id === id && tab.dirty);
  const pending = workspace.hasPending();
  const blocker = useBlocker(({ currentLocation, nextLocation }) => workspace.hasPending()
    || (workspace.getSnapshot().tabs.some((tab) => tab.id === id && tab.dirty) && currentLocation.pathname !== nextLocation.pathname));
  useEffect(() => { if (blocker.state === "blocked" && !pending && !dirty) blocker.proceed(); }, [blocker, pending, dirty]);
  if (blocker.state !== "blocked") return null;
  return <Dialog open onOpenChange={(open) => { if (!open) blocker.reset(); }}><DialogContent>
    <DialogHeader><DialogTitle>{pending ? "Save in progress" : "Leave without saving?"}</DialogTitle>
      <DialogDescription>{pending ? "Wait for the save result before leaving this page." : "Your changes on this page have not been saved and will be lost."}</DialogDescription></DialogHeader>
    <DialogFooter><Button variant="outline" onClick={() => blocker.reset()}>{pending ? "Keep waiting" : "Keep editing"}</Button>
      {!pending ? <Button variant="destructive" onClick={() => { if (!workspace.hasPending()) blocker.proceed(); }}>Leave</Button> : null}
    </DialogFooter>
  </DialogContent></Dialog>;
}
