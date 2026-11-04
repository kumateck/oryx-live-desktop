import { useState, type ReactNode } from "react";
import { ExternalLink } from "lucide-react";
import { ContextMenu, ContextMenuContent, ContextMenuItem, ContextMenuTrigger } from "@/components/ui/context-menu";
import { useDesktopTab } from "./context";
import { internalDestination, type TabLocation } from "./destinations";

export function WorkspaceLinkMenu({ children }: { children: ReactNode }) {
  const desktop = useDesktopTab();
  const [destination, setDestination] = useState<TabLocation | null>(null);
  if (!desktop) return children;
  return <ContextMenu><ContextMenuTrigger asChild>
    <div className="desktop-link-surface" onContextMenuCapture={(event) => {
      const link = event.target instanceof Element ? event.target.closest("a[href]") : null;
      const target = link instanceof HTMLAnchorElement && !link.hasAttribute("download") ? internalDestination(link.href, window.location.origin) : null;
      if (!target) { event.stopPropagation(); setDestination(null); return; }
      setDestination(target);
    }}>{children}</div>
  </ContextMenuTrigger>
    {destination ? <ContextMenuContent><ContextMenuItem onSelect={() => desktop.workspace.open(destination)}><ExternalLink />Open in new tab</ContextMenuItem></ContextMenuContent> : null}
  </ContextMenu>;
}
