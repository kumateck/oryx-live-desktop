import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";
import { ChevronDown, Copy, FileText, Plus, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ContextMenu, ContextMenuContent, ContextMenuItem, ContextMenuTrigger } from "@/components/ui/context-menu";
import { useDesktopTab } from "./context";
import type { WorkspaceTabs } from "./workspace-tabs";

function DesktopTabStrip({ workspace, id }: { workspace: WorkspaceTabs; id: string }) {
  const { tabs, activeId } = useSyncExternalStore(workspace.subscribe, workspace.getSnapshot);
  const [closing, setClosing] = useState<string | null>(null);
  const closingTab = tabs.find((tab) => tab.id === closing);
  const activeButton = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    activeButton.current?.scrollIntoView?.({ block: "nearest", inline: "nearest" });
    activeButton.current?.focus({ preventScroll: true });
  }, [activeId]);
  const requestClose = useCallback((target: string) => {
    if (workspace.hasPending()) { toast.error("A save is still in progress. Wait for its result before closing a tab."); return; }
    if (!workspace.close(target)) setClosing(target);
  }, [workspace]);
  useEffect(() => {
    if (id !== activeId) return;
    const close = () => requestClose(id);
    window.addEventListener("oryx:close-tab", close);
    return () => window.removeEventListener("oryx:close-tab", close);
  }, [workspace, id, activeId, requestClose]);
  return <div className="workspace-tab-bar">
    <Tabs value={activeId} onValueChange={workspace.focus} className="workspace-page-tabs">
      <TabsList aria-label="Open workspace pages" className="workspace-page-tab-list" variant="line">
        {tabs.map((tab) => <ContextMenu key={tab.id}><ContextMenuTrigger asChild>
          <div data-workspace-tab={tab.id} className={`workspace-page-tab ${tab.id === activeId ? "selected" : ""}`}>
          <TabsTrigger value={tab.id} id={`workspace-tab-${id}-${tab.id}`} aria-controls={`workspace-panel-${tab.id}`}
            ref={tab.id === activeId ? activeButton : undefined} title={tab.title} className="workspace-page-tab-trigger">
            <FileText aria-hidden="true" />
            {tab.dirty ? <span className="workspace-tab-dirty" role="img" aria-label="Unsaved changes" /> : null}
            <span className="workspace-tab-label">{tab.title}</span>
          </TabsTrigger>
          <Button variant="ghost" size="icon-sm" aria-label={`Close ${tab.title}`} className="workspace-tab-close" onClick={() => requestClose(tab.id)}><X /></Button>
        </div></ContextMenuTrigger><ContextMenuContent onCloseAutoFocus={(event) => {
          if (!workspace.isActive(id)) event.preventDefault();
        }}>
          <ContextMenuItem onSelect={() => workspace.duplicate(tab.id)}><Copy />Duplicate tab</ContextMenuItem>
        </ContextMenuContent></ContextMenu>)}
      </TabsList>
    </Tabs>
    <Button variant="ghost" size="icon-sm" aria-label="New tab" title="New tab (Ctrl/Cmd+T)" onClick={workspace.newTab}><Plus /></Button>
    <DropdownMenu><DropdownMenuTrigger asChild><Button variant="ghost" size="icon-sm" aria-label="All open tabs"><ChevronDown /></Button></DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="max-w-80">
        {tabs.map((tab) => <DropdownMenuItem key={tab.id} onSelect={() => workspace.focus(tab.id)}>
          <span className="min-w-0 break-words">{tab.title}{tab.dirty ? " (unsaved changes)" : ""}</span>
          {tab.id === activeId ? <span className="sr-only">Current tab</span> : null}
        </DropdownMenuItem>)}
      </DropdownMenuContent>
    </DropdownMenu>
    <Dialog open={Boolean(closingTab)} onOpenChange={(open) => { if (!open) setClosing(null); }}>
      <DialogContent><DialogHeader><DialogTitle>Close without saving?</DialogTitle>
        <DialogDescription>Your changes in {closingTab?.title} have not been saved and will be lost.</DialogDescription></DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={() => { if (closing) workspace.focus(closing); setClosing(null); }}>Keep editing</Button>
          <Button variant="destructive" onClick={() => {
            if (closing && workspace.close(closing, true)) setClosing(null);
            else toast.error("A save is still in progress. Wait for its result before closing this tab.");
          }}>Discard and close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  </div>;
}

export function WorkspaceTabStrip() {
  const tab = useDesktopTab();
  return tab ? <DesktopTabStrip workspace={tab.workspace} id={tab.id} /> : null;
}
