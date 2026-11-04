import { useEffect } from "react";
import type { WorkspaceTabs } from "./workspace-tabs";

/** Owned outside Activity so inactive dirty tabs and pending API writes still veto release refreshes. */
export function useWorkspaceLeaveSafety(workspace: WorkspaceTabs): void {
  useEffect(() => {
    const warn = (event: BeforeUnloadEvent) => { if (workspace.hasWork()) event.preventDefault(); };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [workspace]);
}
