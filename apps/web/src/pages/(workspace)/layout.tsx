import { WorkspaceShell } from "../../components/shell/workspace-shell";
import { SessionGate } from "../../shared/auth/session-gate";
import { ApiProvider } from "../../shared/api/api-provider";
import { useDesktopTab } from "../../shared/workspace-tabs/context";

export default function WorkspaceLayout() {
  const desktop = useDesktopTab();
  return <SessionGate>{desktop ? <WorkspaceShell /> : <ApiProvider><WorkspaceShell /></ApiProvider>}</SessionGate>;
}
