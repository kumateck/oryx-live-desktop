import { useState } from "react";
import { Outlet, useNavigation as useRouteProgress } from "react-router";
import wordmarkUrl from "../../../../../assets/oryx-wordmark.svg";
import { useNavigation } from "../../modules/navigation/use-navigation";
import { PageSearchProvider } from "../../shared/search/page-search";
import { HeaderActions } from "./header-actions";
import { RouteAccess } from "./route-access";
import { WorkspaceNavigation } from "./workspace-navigation";

export function WorkspaceShell() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const progress = useRouteProgress();
  const { groups, active, pathname } = useNavigation();
  const title = groups.find((group) => group.id === active?.groupId)?.label ?? "Workspace";

  return (
    <PageSearchProvider>
    <div className={`workspace ${sidebarOpen ? "sidebar-open" : ""}`}>
      <header className="app-header">
        <button className="icon-button" type="button" aria-label={sidebarOpen ? "Close navigation" : "Open navigation"}
          aria-expanded={sidebarOpen} onClick={() => setSidebarOpen((open) => !open)}>☰</button>
        <span className="brand-logo" role="img" aria-label="Oryx"
          style={{ maskImage: `url("${wordmarkUrl}")`, WebkitMaskImage: `url("${wordmarkUrl}")` }} />
        <span className="header-divider" aria-hidden="true" />
        <span className="header-title">{title}</span>
        <span className="header-spacer" />
        <HeaderActions pages={groups} />
      </header>

      <div className="workspace-body">
        <WorkspaceNavigation groups={groups} active={active} pathname={pathname}
          sidebarOpen={sidebarOpen} onOpenSidebar={() => setSidebarOpen(true)} />
        <main className="content-scroller" id="main-content">
          <div className="content-inner"><RouteAccess><Outlet /></RouteAccess></div>
        </main>
      </div>

      <footer className="app-footer">
        <span>Oryx Live Desktop</span>
        <span className="footer-spacer" />
        <span role="status">{progress.state === "idle" ? "Ready" : "Opening page…"}</span>
      </footer>
    </div>
    </PageSearchProvider>
  );
}
