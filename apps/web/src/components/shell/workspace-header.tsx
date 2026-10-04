import { PanelLeft } from "lucide-react";
import wordmarkUrl from "../../../../../assets/oryx-wordmark.svg";
import type { NavigationGroup } from "../../modules/navigation/navigation-model";
import { Button } from "../ui/button";
import { Separator } from "../ui/separator";
import { Tooltip, TooltipContent, TooltipTrigger } from "../ui/tooltip";
import { HeaderActions } from "./header-actions";

interface WorkspaceHeaderProps {
  title: string;
  sidebarOpen: boolean;
  onToggleSidebar: () => void;
  groups: readonly NavigationGroup[];
}

export function WorkspaceHeader({ title, sidebarOpen, onToggleSidebar, groups }: WorkspaceHeaderProps) {
  const toggleLabel = sidebarOpen ? "Close navigation" : "Open navigation";
  return <header className="app-header">
    <div className="header-navigation">
      <span className="brand-logo" role="img" aria-label="Oryx"
        style={{ maskImage: `url("${wordmarkUrl}")`, WebkitMaskImage: `url("${wordmarkUrl}")` }} />
      <Tooltip>
        <TooltipTrigger asChild>
          <Button variant="ghost" size="icon-sm" className="icon-button" type="button"
            aria-label={toggleLabel} aria-expanded={sidebarOpen} aria-controls="module-navigation" onClick={onToggleSidebar}>
            <PanelLeft aria-hidden="true" className="size-[18px]" />
          </Button>
        </TooltipTrigger>
        <TooltipContent side="bottom" sideOffset={6}>{toggleLabel}</TooltipContent>
      </Tooltip>
      <Separator orientation="vertical" className="header-divider" />
    </div>
    <div className="header-content">
      <span className="header-title">{title}</span>
      <span className="header-spacer" />
      <HeaderActions pages={groups} />
    </div>
  </header>;
}
