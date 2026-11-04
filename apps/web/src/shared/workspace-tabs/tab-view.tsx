import { useMemo } from "react";
import { RouterProvider } from "react-router";
import { DesktopTabContext } from "./context";
import type { WorkspaceTab, WorkspaceTabs } from "./workspace-tabs";

export function WorkspaceTabView({ tab, workspace, active }: { tab: WorkspaceTab; workspace: WorkspaceTabs; active: boolean; pending: boolean }) {
  const value = useMemo(() => ({ workspace, id: tab.id }), [workspace, tab.id]);
  // Domain controllers can own drafts outside RHF. Do not restart their initialisation effects.
  // Header/portal effects and domain polling are paused separately with tab visibility.
  return <div className="desktop-tab-view" hidden={!active} inert={!active}>
      <DesktopTabContext.Provider value={value}><RouterProvider router={tab.router} /></DesktopTabContext.Provider>
    </div>;
}
