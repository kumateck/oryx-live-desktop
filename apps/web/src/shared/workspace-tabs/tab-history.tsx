import { useSyncExternalStore } from "react";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useDesktopTab } from "./context";
import type { WorkspaceTabs } from "./workspace-tabs";

function TabHistory({ workspace }: { workspace: WorkspaceTabs }) {
  const { tabs, activeId } = useSyncExternalStore(workspace.subscribe, workspace.getSnapshot);
  const selected = tabs.find((tab) => tab.id === activeId);
  return <div className="workspace-tab-history">
    <Button variant="ghost" size="icon-sm" aria-label="Back in this tab" disabled={!selected?.back} onClick={() => workspace.travel(-1)}><ArrowLeft /></Button>
    <Button variant="ghost" size="icon-sm" aria-label="Forward in this tab" disabled={!selected?.forward} onClick={() => workspace.travel(1)}><ArrowRight /></Button>
  </div>;
}

export function WorkspaceTabHistory() {
  const tab = useDesktopTab();
  return tab ? <TabHistory workspace={tab.workspace} /> : null;
}
