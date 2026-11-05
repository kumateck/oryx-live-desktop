import { PanelLeft } from "lucide-react";
import wordmarkUrl from "../../../../../assets/oryx-wordmark.svg";
import type { NavigationGroup } from "../../modules/navigation/navigation-model";
import { Button } from "../ui/button";
import { Separator } from "../ui/separator";
import { Tooltip, TooltipContent, TooltipTrigger } from "../ui/tooltip";
import { HeaderActions } from "./header-actions";
import { useDesktopTab } from "../../shared/workspace-tabs/context";
import { WorkspaceTabStrip } from "../../shared/workspace-tabs/tab-strip";
import { WorkspaceTabHistory } from "../../shared/workspace-tabs/tab-history";

interface WorkspaceHeaderProps {
  title: string;
  sidebarOpen: boolean;
  onToggleSidebar: () => void;
  groups: readonly NavigationGroup[];
  navigationId?: string;
}

export function WorkspaceHeader({ title, sidebarOpen, onToggleSidebar, groups, navigationId = "module-navigation" }: WorkspaceHeaderProps) {
  const desktop = useDesktopTab();
  const toggleLabel = sidebarOpen ? "Close navigation" : "Open navigation";
  return <header className={`app-header${desktop ? " desktop-workspace-header" : ""}`}>
    <div className="header-navigation">
      <span className="brand-logo" role="img" aria-label="Oryx"
        style={{ maskImage: `url("${wordmarkUrl}")`, WebkitMaskImage: `url("${wordmarkUrl}")` }} />
      {desktop ? <WorkspaceTabHistory /> : null}
      <Tooltip>
        <TooltipTrigger asChild>
          <Button variant="ghost" size="icon-sm" className="icon-button" type="button"
            aria-label={toggleLabel} aria-expanded={sidebarOpen} aria-controls={navigationId} onClick={onToggleSidebar}>
            <PanelLeft aria-hidden="true" className="size-[18px]" />
          </Button>
        </TooltipTrigger>
        <TooltipContent side="bottom" sideOffset={6}>{toggleLabel}</TooltipContent>
      </Tooltip>
      {desktop ? null : <Separator orientation="vertical" className="header-divider" />}
    </div>
    <div className="header-content">
      {desktop ? <WorkspaceTabStrip groups={groups} /> : <><span className="header-title">{title}</span><span className="header-spacer" /></>}
      <HeaderActions pages={groups} />
    </div>
  </header>;
}
