import { Activity, useCallback } from "react";
import { Outlet, useNavigation as useRouteProgress } from "react-router";
import { useNavigation } from "../../modules/navigation/use-navigation";
import { PageSearchProvider } from "../../shared/search/page-search";
import { WorkspaceHeader } from "./workspace-header";
import { RouteAccess } from "./route-access";
import { WorkspaceNavigation } from "./workspace-navigation";
import { useBrowserSidebarShortcut, useDesktopTab, useDesktopTabState, useDesktopTabVisible, useWorkspaceSidebar } from "../../shared/workspace-tabs/context";
import { WorkspacePagePicker } from "../../shared/workspace-tabs/page-picker";
import { WorkspaceLinkMenu } from "../../shared/workspace-tabs/internal-link-menu";
import { DesktopRouteBlocker } from "../../shared/workspace-tabs/route-blocker";

export function WorkspaceShell() {
  const desktop = useDesktopTab();
  const visible = useDesktopTabVisible();
  // Subscribed state: reading the tab store without subscribing left the sidebar toggle without effect on desktop.
  const [sidebarOpen, setSidebarOpen] = useWorkspaceSidebar();
  const tab = useDesktopTabState();
  const toggleSidebar = useCallback(() => setSidebarOpen(!sidebarOpen), [setSidebarOpen, sidebarOpen]);
  useBrowserSidebarShortcut(toggleSidebar, !desktop);
  const progress = useRouteProgress();
  const { groups, active, pathname } = useNavigation();
  const title = groups.find((group) => group.id === active?.groupId)?.label ?? "Workspace";
  const navigationId = desktop ? `module-navigation-${desktop.id}` : "module-navigation";

  return (
    <PageSearchProvider>
    {desktop ? <DesktopRouteBlocker /> : null}
    <WorkspaceLinkMenu><div className={`workspace ${sidebarOpen ? "sidebar-open" : ""}`}>
      <Activity mode={visible ? "visible" : "hidden"}>
        <WorkspaceHeader title={title} sidebarOpen={sidebarOpen} groups={groups} navigationId={navigationId}
          onToggleSidebar={toggleSidebar} />
      </Activity>

      <div className="workspace-body">
        <WorkspaceNavigation groups={groups} active={active} pathname={pathname} navigationId={navigationId}
          sidebarOpen={sidebarOpen} onOpenSidebar={() => setSidebarOpen(true)} />
        {desktop ? <div className="desktop-workspace-content">
          <main className="content-scroller" role="tabpanel" id={`workspace-panel-${desktop.id}`}
            aria-labelledby={`workspace-tab-${desktop.id}-${desktop.id}`} tabIndex={0}>
            <div className="content-inner">{tab?.picker ? <WorkspacePagePicker groups={groups} /> : <RouteAccess><Outlet /></RouteAccess>}</div>
          </main>
        </div> : <main className="content-scroller" id="main-content">
          <div className="content-inner"><RouteAccess><Outlet /></RouteAccess></div>
        </main>}
      </div>

      <footer className="app-footer">
        <span>Oryx Live Desktop</span>
        <span className="footer-spacer" />
        <span role="status">{progress.state === "idle" ? "Ready" : "Opening page…"}</span>
      </footer>
    </div></WorkspaceLinkMenu>
    </PageSearchProvider>
  );
}
