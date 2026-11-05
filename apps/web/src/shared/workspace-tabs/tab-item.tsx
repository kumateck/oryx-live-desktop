import type { MouseEvent } from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { X, type LucideIcon } from "lucide-react";
import { cn } from "cn";
import { Spinner } from "@/components/ui/spinner";
import { ContextMenu, ContextMenuContent, ContextMenuItem, ContextMenuSeparator, ContextMenuShortcut, ContextMenuTrigger } from "@/components/ui/context-menu";
import type { WorkspaceTab, WorkspaceTabs } from "./workspace-tabs";

export interface TabItemProps {
  tab: WorkspaceTab;
  stripId: string;
  index: number;
  count: number;
  selected: boolean;
  Icon: LucideIcon;
  workspace: WorkspaceTabs;
  canReopen: boolean;
  onClose: (id: string) => void;
  onBulkClose: (kept: number) => void;
}

const mac = typeof navigator !== "undefined" && /mac/i.test(navigator.platform);
export const shortcutLabel = (key: string, shift = false): string => mac ? `⌘${shift ? "⇧" : ""}${key}` : `Ctrl+${shift ? "Shift+" : ""}${key}`;

/** One tab: a sortable pill holding the tab itself and its close button, with a browser-style context menu. */
export function WorkspaceTabItem({ tab, stripId, index, count, selected, Icon, workspace, canReopen, onClose, onBulkClose }: TabItemProps) {
  const { setNodeRef, listeners, transform, transition, isDragging } = useSortable({ id: tab.id });
  const auxClose = (event: MouseEvent) => { if (event.button === 1) { event.preventDefault(); onClose(tab.id); } };
  return <ContextMenu>
    <ContextMenuTrigger asChild>
      <div ref={setNodeRef} role="presentation" data-tab-id={tab.id} data-workspace-tab={tab.id} {...listeners}
        style={{ transform: CSS.Translate.toString(transform), transition }}
        className={cn("workspace-tab", selected && "selected", tab.dirty && "dirty", isDragging && "dragging")}
        onClick={() => workspace.focus(tab.id)} onAuxClick={auxClose}
        onMouseDown={(event) => { if (event.button === 1) event.preventDefault(); }}>
        <div role="tab" id={`workspace-tab-${stripId}-${tab.id}`} aria-selected={selected} aria-controls={`workspace-panel-${tab.id}`}
          tabIndex={selected ? 0 : -1} title={tab.title} className="workspace-tab-trigger">
          {tab.busy ? <Spinner aria-label="Saving" className="workspace-tab-icon" /> : <Icon aria-hidden="true" className="workspace-tab-icon" />}
          <span className="workspace-tab-label">{tab.title}</span>
          {tab.dirty ? <span className="sr-only">, unsaved changes</span> : null}
        </div>
        <span className="workspace-tab-end">
          {tab.dirty ? <span className="workspace-tab-dirty" aria-hidden="true" /> : null}
          <button type="button" tabIndex={-1} aria-label={`Close ${tab.title}`} title={`Close (${shortcutLabel("W")})`} className="workspace-tab-close"
            onPointerDown={(event) => event.stopPropagation()} onClick={(event) => { event.stopPropagation(); onClose(tab.id); }}>
            <X aria-hidden="true" />
          </button>
        </span>
      </div>
    </ContextMenuTrigger>
    <ContextMenuContent className="min-w-52">
      <ContextMenuItem onSelect={() => onClose(tab.id)}>Close tab<ContextMenuShortcut>{shortcutLabel("W")}</ContextMenuShortcut></ContextMenuItem>
      <ContextMenuItem disabled={count < 2} onSelect={() => onBulkClose(workspace.closeOthers(tab.id))}>Close other tabs</ContextMenuItem>
      <ContextMenuItem disabled={index >= count - 1} onSelect={() => onBulkClose(workspace.closeToRight(tab.id))}>Close tabs to the right</ContextMenuItem>
      <ContextMenuSeparator />
      <ContextMenuItem disabled={tab.picker} onSelect={() => workspace.duplicate(tab.id)}>Duplicate tab</ContextMenuItem>
      <ContextMenuItem disabled={index === 0} onSelect={() => workspace.move(tab.id, index - 1)}>Move left</ContextMenuItem>
      <ContextMenuItem disabled={index >= count - 1} onSelect={() => workspace.move(tab.id, index + 1)}>Move right</ContextMenuItem>
      <ContextMenuSeparator />
      <ContextMenuItem onSelect={workspace.newTab}>New tab<ContextMenuShortcut>{shortcutLabel("T")}</ContextMenuShortcut></ContextMenuItem>
      <ContextMenuItem disabled={!canReopen} onSelect={workspace.reopenClosed}>
        Reopen closed tab<ContextMenuShortcut>{shortcutLabel("T", true)}</ContextMenuShortcut>
      </ContextMenuItem>
    </ContextMenuContent>
  </ContextMenu>;
}
