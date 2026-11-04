import { useEffect } from "react";
import { internalDestination } from "./destinations";
import type { WorkspaceTabs } from "./workspace-tabs";
import type { DesktopWorkspaceBridge } from "../../../../../shared/desktop-workspace";
declare global { interface Window { oryxWorkspace?: DesktopWorkspaceBridge } }

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
      if (event.defaultPrevented) return;
      const modifier = event.ctrlKey || event.metaKey;
      if (modifier && event.key === "Tab") {
        const { tabs, activeId } = workspace.getSnapshot();
        const index = tabs.findIndex((tab) => tab.id === activeId);
        const next = tabs[(index + (event.shiftKey ? -1 : 1) + tabs.length) % tabs.length];
        if (next) { event.preventDefault(); workspace.focus(next.id); }
      } else if (modifier && event.key.toLowerCase() === "t") { event.preventDefault(); workspace.newTab(); }
      else if (modifier && event.key.toLowerCase() === "w") { event.preventDefault(); window.dispatchEvent(new Event("oryx:close-tab")); }
      else if (event.altKey && (event.key === "ArrowLeft" || event.key === "ArrowRight")) {
        event.preventDefault(); workspace.travel(event.key === "ArrowLeft" ? -1 : 1);
      }
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
