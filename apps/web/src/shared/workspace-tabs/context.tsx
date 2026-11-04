import { Activity, createContext, useContext, useEffect, useId, useSyncExternalStore, type ReactNode } from "react";
import type { WorkspaceTabs } from "./workspace-tabs";

export interface DesktopTabContextValue { workspace: WorkspaceTabs; id: string }
export const DesktopTabContext = createContext<DesktopTabContextValue | null>(null);
export const useDesktopTab = () => useContext(DesktopTabContext);
const noSubscription = () => () => {};
const visible = () => true;
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
