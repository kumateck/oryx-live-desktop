import { FileText, Plus, Settings, type LucideIcon } from "lucide-react";
import { groupIcons } from "@/modules/navigation/group-icons";
import { activeNavigation, type NavigationGroup } from "@/modules/navigation/navigation-model";
import type { WorkspaceTab } from "./workspace-tabs";

/** The module icon of the page's navigation group, so tabs from different areas are recognisable at a glance. */
export function tabIcon(tab: WorkspaceTab, groups: readonly NavigationGroup[]): LucideIcon {
  if (tab.picker) return Plus;
  if (tab.location.pathname.startsWith("/settings")) return Settings;
  const groupId = activeNavigation(groups, tab.location.pathname, tab.location.search)?.groupId;
  return groupId && groupId in groupIcons ? groupIcons[groupId as keyof typeof groupIcons] : FileText;
}
