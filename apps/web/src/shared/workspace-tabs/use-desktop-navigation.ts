import { useEffect } from "react";
import { internalDestination } from "./destinations";
import { isEditableTarget } from "./sidebar-preference";
import type { WorkspaceTabs } from "./workspace-tabs";
import type { DesktopWorkspaceBridge } from "../../../../../shared/desktop-workspace";
declare global { interface Window { oryxWorkspace?: DesktopWorkspaceBridge } }

/** Keyboard shortcuts follow browser and editor conventions (Chrome, VS Code, Claude, Codex). */
function shortcut(workspace: WorkspaceTabs, event: KeyboardEvent): boolean {
  const modifier = event.ctrlKey || event.metaKey;
  const plain = modifier && !event.shiftKey && !event.altKey;
  const key = event.key.toLowerCase();
  if (event.ctrlKey && event.key === "Tab") { workspace.cycle(event.shiftKey ? -1 : 1); return true; }
  if (event.ctrlKey && (event.key === "PageUp" || event.key === "PageDown")) { workspace.cycle(event.key === "PageUp" ? -1 : 1); return true; }
  if (modifier && event.shiftKey && key === "t") { workspace.reopenClosed(); return true; }
  if (plain && key === "t") { workspace.newTab(); return true; }
  if (plain && key === "w") { window.dispatchEvent(new Event("oryx:close-tab")); return true; }
  if (plain && /^[1-9]$/.test(event.key)) { workspace.focusIndex(event.key === "9" ? -1 : Number(event.key) - 1); return true; }
  if (plain && key === "b" && !isEditableTarget(event.target)) { workspace.toggleSidebar(); return true; }
  if (event.altKey && !modifier && (event.key === "ArrowLeft" || event.key === "ArrowRight")) {
    workspace.travel(event.key === "ArrowLeft" ? -1 : 1); return true;
  }
  return false;
}

/** Desktop shortcuts and modified internal links never escape into a second native window. */
export function useDesktopNavigation(workspace: WorkspaceTabs, enabled = true): void {
  useEffect(() => {
    if (!enabled) return;
    const unsubscribe = window.oryxWorkspace?.onNavigate((command) => {
      if (command === "home") workspace.open({ pathname: "/home", search: "", hash: "" }, "Home");
      else if (command === "new-tab") workspace.newTab();
      else if (command === "close-tab") window.dispatchEvent(new Event("oryx:close-tab"));
      else workspace.travel(command === "back" ? -1 : 1);
    });
    const keydown = (event: KeyboardEvent) => {
      if (!event.defaultPrevented && shortcut(workspace, event)) event.preventDefault();
    };
    const openLink = (event: MouseEvent) => {
      if (!(event.target instanceof Element)) return;
      const link = event.target.closest("a[href]");
      if (!(link instanceof HTMLAnchorElement) || link.hasAttribute("download")) return;
      const location = internalDestination(link.href, window.location.origin);
      if (!location || event.defaultPrevented) return;
      if ((event.type === "auxclick" && event.button === 1) || (event.type === "click" && (event.ctrlKey || event.metaKey || link.target === "_blank"))) {
        event.preventDefault(); event.stopPropagation(); workspace.open(location);
      }
    };
    window.addEventListener("keydown", keydown);
    document.addEventListener("click", openLink, true);
    document.addEventListener("auxclick", openLink, true);
    return () => {
      unsubscribe?.();
      window.removeEventListener("keydown", keydown);
      document.removeEventListener("click", openLink, true);
      document.removeEventListener("auxclick", openLink, true);
    };
  }, [workspace, enabled]);
}
