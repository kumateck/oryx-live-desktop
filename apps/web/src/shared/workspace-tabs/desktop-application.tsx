import { useEffect, useState, useSyncExternalStore } from "react";
import { useStore } from "react-redux";
import { toast } from "sonner";
import { routes } from "../../routes/generated";
import { ApiProvider, type ApiStore } from "../api/api-provider";
import { apiWritesPending } from "../api/api-write-safety";
import { useSession } from "../auth/session-provider";
import { WorkspaceTabs } from "./workspace-tabs";
import { WorkspaceTabView } from "./tab-view";
import { tabAddress } from "./destinations";
import { useDesktopNavigation } from "./use-desktop-navigation";
import { useWorkspaceLeaveSafety } from "./use-workspace-leave-safety";
import { scopedDestinationKey } from "./scoped-destination";
import "./workspace-tabs.css";
const useApiStore = useStore.withTypes<ApiStore>();

function DesktopRouters() {
  const { allowsNow, state } = useSession();
  const store = useApiStore();
  const pending = useSyncExternalStore(store.subscribe, () => apiWritesPending(store));
  const [workspace] = useState(() => new WorkspaceTabs(routes, () => apiWritesPending(store), (location) => scopedDestinationKey(location, allowsNow),
    () => toast.error("Wait for the current save to finish before switching pages.")));
  const snapshot = useSyncExternalStore(workspace.subscribe, workspace.getSnapshot);
  useEffect(() => {
    workspace.open({ pathname: window.location.pathname, search: window.location.search, hash: window.location.hash });
    return () => workspace.dispose();
  }, [workspace]);
  useWorkspaceLeaveSafety(workspace);
  const active = snapshot.tabs.find((tab) => tab.id === snapshot.activeId);
  useEffect(() => {
    if (!active) return;
    // Memory histories are independent; refresh and reconnect still open the visible destination.
    window.history.replaceState(null, "", tabAddress(active.location));
    document.title = `${active.title} — Oryx Live`;
  }, [active]);
  useDesktopNavigation(workspace, state.status === "authenticated");
  return snapshot.tabs.map((tab) => <WorkspaceTabView key={tab.id} tab={tab} workspace={workspace} active={tab.id === snapshot.activeId} pending={pending} />);
}

export default function DesktopApplication() {
  const { state } = useSession();
  // No retained forms or routers can survive an account or department boundary.
  const scope = state.status === "authenticated" ? `${state.session.user.id}:${state.session.user.departmentId ?? ""}` : "public";
  return <ApiProvider key={scope}><DesktopRouters /></ApiProvider>;
}
