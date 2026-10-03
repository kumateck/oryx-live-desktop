import { useState } from "react";
import { Link } from "react-router";
import { ChevronRight, Circle } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "../ui/tooltip";
import type { NavigationGroupId } from "../../modules/navigation/catalog.generated";
import { groupIcons } from "../../modules/navigation/group-icons";
import type { ActiveNavigation, NavigationGroup, NavigationItem } from "../../modules/navigation/navigation-model";

function isGroupId(id: string): id is NavigationGroupId {
  return id in groupIcons;
}

function Entry({ item, active, depth }: { item: NavigationItem; active: ActiveNavigation | null; depth: number }) {
  const current = active?.itemId === item.id;
  if (!item.children) return item.path ? <Link to={item.path} aria-current={current ? "page" : undefined}
    className={`sidebar-link ${current ? "active" : ""}`} style={{ paddingLeft: 10 + depth * 12 }}>{item.label}</Link> : null;
  return <details className="sidebar-section" open={active?.trail.includes(item.id) || current || undefined}>
    <summary style={{ paddingLeft: 10 + depth * 12 }}><span className="min-w-0 flex-1">{item.label}</span><ChevronRight aria-hidden="true" className="sidebar-section-chevron" /></summary>
    {item.path ? <Link to={item.path} aria-current={current ? "page" : undefined}
      className={`sidebar-link ${current ? "active" : ""}`} style={{ paddingLeft: 22 + depth * 12 }}>{item.label} overview</Link> : null}
    {item.children.map((child) => <Entry key={child.id} item={child} active={active} depth={depth + 1} />)}
  </details>;
}

export function WorkspaceNavigation({ groups, active, pathname, sidebarOpen, onOpenSidebar }: {
  groups: readonly NavigationGroup[];
  active: ActiveNavigation | null;
  pathname: string;
  sidebarOpen: boolean;
  onOpenSidebar: () => void;
}) {
  // A group picked from the rail stays open until the user navigates somewhere else.
  const [picked, setPicked] = useState<{ at: string; id: string } | null>(null);
  const selectedId = picked?.at === pathname ? picked.id : active?.groupId ?? groups[0]?.id;
  const selected = groups.find((group) => group.id === selectedId) ?? groups[0];

  return <>
    <nav className="icon-rail" aria-label="Modules">
      {groups.map((group) => {
        const Icon = isGroupId(group.id) ? groupIcons[group.id] : Circle;
        const isSelected = group.id === selected?.id;
        return <Tooltip key={group.id}>
          <TooltipTrigger asChild>
            <button type="button" aria-label={group.label} aria-pressed={isSelected}
              className={`rail-link ${isSelected ? "active" : ""} ${active?.groupId === group.id ? "current" : ""}`}
              onClick={() => { setPicked({ at: pathname, id: group.id }); onOpenSidebar(); }}>
              <Icon aria-hidden="true" size={19} />
            </button>
          </TooltipTrigger>
          <TooltipContent side="right" sideOffset={6}>{group.label}</TooltipContent>
        </Tooltip>;
      })}
    </nav>
    {sidebarOpen && selected ? <aside className="module-sidebar" aria-label={`${selected.label} navigation`}>
      <div className="sidebar-heading">{selected.label}</div>
      <div className="sidebar-items" key={selected.id}>
        {selected.items.map((item) => <Entry key={item.id} item={item} active={active} depth={0} />)}
      </div>
    </aside> : null}
  </>;
}
