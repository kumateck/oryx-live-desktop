import { useCallback, useEffect, useRef, useState, useSyncExternalStore, type KeyboardEvent, type ReactNode } from "react";
import { DndContext, PointerSensor, closestCenter, useSensor, useSensors, type DragEndEvent } from "@dnd-kit/core";
import { SortableContext, horizontalListSortingStrategy } from "@dnd-kit/sortable";
import { restrictToHorizontalAxis, restrictToParentElement } from "@dnd-kit/modifiers";
import { ChevronDown, History, Plus } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import type { NavigationGroup } from "@/modules/navigation/navigation-model";
import { useDesktopTab } from "./context";
import { CloseTabDialog } from "./close-tab-dialog";
import { WorkspaceTabItem, shortcutLabel } from "./tab-item";
import { tabIcon } from "./tab-icon";
import { useOverflowEdges } from "./use-overflow-edges";
import type { WorkspaceTabs } from "./workspace-tabs";

const busyMessage = "A save is still in progress. Wait for its result before closing a tab.";
const sortModifiers = [restrictToHorizontalAxis, restrictToParentElement];

function IconAction({ label, disabled, onClick, children }: { label: string; disabled?: boolean; onClick: () => void; children: ReactNode }) {
  return <Tooltip><TooltipTrigger asChild>
    <Button variant="ghost" size="icon-sm" className="workspace-tab-action" aria-label={label} disabled={disabled} onClick={onClick}>{children}</Button>
  </TooltipTrigger><TooltipContent side="bottom" sideOffset={6}>{label}</TooltipContent></Tooltip>;
}

function DesktopTabStrip({ workspace, id, groups }: { workspace: WorkspaceTabs; id: string; groups: readonly NavigationGroup[] }) {
  const { tabs, activeId, canReopen } = useSyncExternalStore(workspace.subscribe, workspace.getSnapshot);
  const [closing, setClosing] = useState<string | null>(null);
  const list = useRef<HTMLDivElement>(null);
  const scroller = useRef<HTMLDivElement>(null);
  const edges = useOverflowEdges(scroller, tabs.length);
  const selected = tabs.find((tab) => tab.id === activeId);
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }));

  // Keep the current tab in view; move keyboard focus only when it is already in the tab list.
  useEffect(() => {
    const element = list.current?.querySelector<HTMLElement>(`[data-tab-id="${activeId}"]`);
    element?.scrollIntoView?.({ block: "nearest", inline: "nearest" });
    if (list.current?.contains(document.activeElement)) element?.querySelector<HTMLElement>("[role=tab]")?.focus({ preventScroll: true });
  }, [activeId, tabs.length]);

  const requestClose = useCallback((target: string) => {
    if (workspace.hasPending()) { toast.error(busyMessage); return; }
    if (!workspace.close(target)) setClosing(target);
  }, [workspace]);
  const bulkClosed = useCallback((kept: number) => {
    if (kept > 0) toast.info(`${kept} tab${kept === 1 ? "" : "s"} with unsaved changes ${kept === 1 ? "was" : "were"} kept open.`);
  }, []);
  useEffect(() => {
    if (id !== activeId) return;
    const close = () => requestClose(id);
    window.addEventListener("oryx:close-tab", close);
    return () => window.removeEventListener("oryx:close-tab", close);
  }, [id, activeId, requestClose]);

  // Tabs follow the WAI-ARIA pattern: arrows/Home/End select, Delete closes.
  const keyboard = (event: KeyboardEvent<HTMLDivElement>) => {
    const index = tabs.findIndex((tab) => tab.id === activeId);
    const targets: Record<string, number> = { ArrowLeft: index - 1, ArrowRight: index + 1, Home: 0, End: tabs.length - 1 };
    const target = targets[event.key];
    if (target !== undefined) {
      event.preventDefault();
      const next = tabs[(target + tabs.length) % tabs.length];
      if (next) workspace.focus(next.id);
    } else if (event.key === "Delete" && selected) { event.preventDefault(); requestClose(selected.id); }
  };
  const dragEnd = ({ active, over }: DragEndEvent) => {
    if (over && active.id !== over.id) workspace.move(String(active.id), tabs.findIndex((tab) => tab.id === over.id));
  };

  return <TooltipProvider delayDuration={400}><div className="workspace-tab-bar">
    {/* Back/Forward and the navigation toggle sit before the tabs in the header (WorkspaceTabHistory). */}
    <div ref={scroller} className="workspace-tab-scroller" data-fade-start={edges.start || undefined} data-fade-end={edges.end || undefined}
      onWheel={(event) => { if (scroller.current && Math.abs(event.deltaY) > Math.abs(event.deltaX)) scroller.current.scrollLeft += event.deltaY; }}>
      <DndContext sensors={sensors} collisionDetection={closestCenter} modifiers={sortModifiers} onDragEnd={dragEnd}>
        <SortableContext items={tabs.map((tab) => tab.id)} strategy={horizontalListSortingStrategy}>
          <div ref={list} role="tablist" aria-label="Open pages" aria-orientation="horizontal" className="workspace-tab-list" onKeyDown={keyboard}>
            {tabs.map((tab, index) => <WorkspaceTabItem key={tab.id} tab={tab} stripId={id} index={index} count={tabs.length}
              selected={tab.id === activeId} Icon={tabIcon(tab, groups)} workspace={workspace} canReopen={canReopen}
              onClose={requestClose} onBulkClose={bulkClosed} />)}
          </div>
        </SortableContext>
      </DndContext>
    </div>
    <IconAction label={`New tab (${shortcutLabel("T")})`} onClick={workspace.newTab}><Plus /></IconAction>
    <div className="workspace-tab-spacer" aria-hidden="true" onDoubleClick={workspace.newTab} />
    <DropdownMenu>
      <Tooltip><TooltipTrigger asChild><DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon-sm" className="workspace-tab-action" aria-label="All open tabs"><ChevronDown /></Button>
      </DropdownMenuTrigger></TooltipTrigger><TooltipContent side="bottom" sideOffset={6}>All open tabs</TooltipContent></Tooltip>
      <DropdownMenuContent align="end" className="w-80 max-w-[calc(100vw-2rem)]">
        <DropdownMenuLabel>{tabs.length} open {tabs.length === 1 ? "tab" : "tabs"}</DropdownMenuLabel>
        {tabs.map((tab) => {
          const Icon = tabIcon(tab, groups);
          return <DropdownMenuItem key={tab.id} onSelect={() => workspace.focus(tab.id)} className={tab.id === activeId ? "font-semibold" : undefined}>
            <Icon aria-hidden="true" /><span className="min-w-0 flex-1 truncate">{tab.title}</span>
            {tab.dirty ? <span className="workspace-tab-dirty" role="img" aria-label="Unsaved changes" /> : null}
            {tab.id === activeId ? <span className="sr-only">Current tab</span> : null}
          </DropdownMenuItem>;
        })}
        <DropdownMenuSeparator />
        <DropdownMenuItem disabled={!canReopen} onSelect={workspace.reopenClosed}><History aria-hidden="true" />Reopen closed tab</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
    <CloseTabDialog workspace={workspace} closing={tabs.find((tab) => tab.id === closing) ?? null} onDone={() => setClosing(null)} busyMessage={busyMessage} />
  </div></TooltipProvider>;
}

export function WorkspaceTabStrip({ groups = [] }: { groups?: readonly NavigationGroup[] }) {
  const tab = useDesktopTab();
  return tab ? <DesktopTabStrip workspace={tab.workspace} id={tab.id} groups={groups} /> : null;
}
