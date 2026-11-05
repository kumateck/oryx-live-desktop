import { Activity, createContext, useCallback, useContext, useEffect, useId, useState, useSyncExternalStore, type ReactNode } from "react";
import type { WorkspaceTab, WorkspaceTabs } from "./workspace-tabs";
import { isEditableTarget, readSidebarPreference, writeSidebarPreference } from "./sidebar-preference";

export interface DesktopTabContextValue { workspace: WorkspaceTabs; id: string }
export const DesktopTabContext = createContext<DesktopTabContextValue | null>(null);
export const useDesktopTab = () => useContext(DesktopTabContext);
const noSubscription = () => () => {};
const visible = () => true;
/** This tab's own record (title, picker, dirty…), re-rendering only when the store publishes. */
export function useDesktopTabState(): WorkspaceTab | undefined {
  const tab = useDesktopTab();
  return useSyncExternalStore(tab?.workspace.subscribe ?? noSubscription,
    () => tab?.workspace.getSnapshot().tabs.find((entry) => entry.id === tab.id));
}

/** Sidebar state shared by every desktop tab (or local in a browser), remembered across launches. */
export function useWorkspaceSidebar(): readonly [boolean, (open: boolean) => void] {
  const tab = useDesktopTab();
  const [browserOpen, setBrowserOpen] = useState(readSidebarPreference);
  const desktopOpen = useSyncExternalStore(tab?.workspace.subscribe ?? noSubscription,
    () => tab ? tab.workspace.getSnapshot().sidebarOpen : null);
  const setOpen = useCallback((open: boolean) => {
    if (tab) tab.workspace.setSidebar(open);
    else { setBrowserOpen(open); writeSidebarPreference(open); }
  }, [tab]);
  return [desktopOpen ?? browserOpen, setOpen] as const;
}

/** Ctrl/Cmd+B toggles the browser sidebar; desktop tabs register it once in useDesktopNavigation. */
export function useBrowserSidebarShortcut(toggle: () => void, enabled: boolean): void {
  useEffect(() => {
    if (!enabled) return;
    const keydown = (event: KeyboardEvent) => {
      if (event.defaultPrevented || !(event.ctrlKey || event.metaKey) || event.shiftKey || event.altKey) return;
      if (event.key.toLowerCase() !== "b" || isEditableTarget(event.target)) return;
      event.preventDefault(); toggle();
    };
    window.addEventListener("keydown", keydown);
    return () => window.removeEventListener("keydown", keydown);
  }, [toggle, enabled]);
}

export function useDesktopTabVisible(): boolean {
  const tab = useDesktopTab();
  return useSyncExternalStore(tab?.workspace.subscribe ?? noSubscription, tab ? () => tab.workspace.isActive(tab.id) : visible);
}

/** Portals live outside a tab's DOM container; hiding the container alone is insufficient. */
export function DesktopTabPortal({ children }: { children: ReactNode }) {
  const desktop = useDesktopTab();
  const visible = useDesktopTabVisible();
  // Preserve form controls and their useId across a hidden portal, rather than unmounting them.
  return desktop ? <Activity mode={visible ? "visible" : "hidden"}>{children}</Activity> : children;
}

/** Suspended portal controls retain their guard; an actual close in the active tab removes it. */
export function useDesktopTabSafety(dirty: boolean, pending = false): void {
  const tab = useDesktopTab();
  const key = useId();
  useEffect(() => {
    if (!tab) return;
    tab.workspace.setDirty(tab.id, key, dirty);
    tab.workspace.setBusy(tab.id, key, pending);
    return () => {
      if (tab.workspace.isActive(tab.id)) {
        tab.workspace.setDirty(tab.id, key, false);
        tab.workspace.setBusy(tab.id, key, false);
      }
    };
  }, [tab, key, dirty, pending]);
}

export function useDesktopTabTitle(title: string | null): void {
  const tab = useDesktopTab();
  useEffect(() => {
    if (tab && title) tab.workspace.setTitle(tab.id, title);
  }, [tab, title]);
}
