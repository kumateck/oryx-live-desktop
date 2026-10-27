import { Download, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useReleaseUpdates } from "./update-provider";
export function UpdateButton() {
  const { desktop, web, open } = useReleaseUpdates();
  if (!desktop && !web && !window.oryxSession) return null;
  const available = desktop?.latestVersion || web;
  const percent = desktop?.total ? Math.min(100, Math.floor(desktop.received / desktop.total * 100)) : 0;
  const label = desktop?.phase === "downloading" ? `Downloading desktop update: ${percent}%` : desktop?.phase === "ready" ? "Install desktop update and restart" : available ? "An Oryx update is available" : "Check for Oryx updates";
  return <Button type="button" size="icon-sm" variant="outline" className="header-action" onClick={open} aria-label={label} title={label}>
    {desktop ? <Download /> : <RefreshCw />}
    {available ? <span className="notification-count" aria-hidden="true">{desktop?.phase === "downloading" ? `${percent}%` : "!"}</span> : null}
  </Button>;
}
