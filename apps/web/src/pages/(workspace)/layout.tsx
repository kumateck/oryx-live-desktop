import { WorkspaceShell } from "../../components/shell/workspace-shell";
import { SessionGate } from "../../shared/auth/session-gate";
import { ApiProvider } from "../../shared/api/api-provider";

export default function WorkspaceLayout() {
  return <SessionGate><ApiProvider><WorkspaceShell /></ApiProvider></SessionGate>;
}
