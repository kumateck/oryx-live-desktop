import { canAccess, type AccessContext } from "../../shared/auth/access.ts";

export interface NavigationItem {
  readonly id: string;
  readonly label: string;
  /** App path, optionally with a query string that selects a tab. */
  readonly path?: string;
  /** Shown when the user holds any of these. Absent means no permission is required. */
  readonly permissions?: readonly string[];
  readonly children?: readonly NavigationItem[];
}

export interface NavigationGroup {
  readonly id: string;
  readonly label: string;
  readonly items: readonly NavigationItem[];
}

function allowed(item: NavigationItem, context: AccessContext): boolean {
  return item.permissions
    ? canAccess({ kind: "some", permissions: item.permissions }, context)
    : canAccess({ kind: "authenticated" }, context);
}

function visibleItem(item: NavigationItem, context: AccessContext): NavigationItem | null {
  if (!allowed(item, context)) return null;
  if (!item.children) return item;
  const children = item.children.flatMap((child) => visibleItem(child, context) ?? []);
  // A heading with nothing visible under it is hidden; an entry with its own page stays.
  if (children.length === 0) return item.path ? { id: item.id, label: item.label, path: item.path } : null;
  return { ...item, children };
}

/** Groups and entries the user may see, in catalog order. Empty groups are dropped. */
export function visibleNavigation(groups: readonly NavigationGroup[], context: AccessContext): NavigationGroup[] {
  return groups.flatMap((group) => {
    const items = group.items.flatMap((item) => visibleItem(item, context) ?? []);
    return items.length ? [{ ...group, items }] : [];
  });
}

/** How well an entry's path matches the current address: higher is more specific, -1 is no match. */
function matchScore(path: string, pathname: string, search: string): number {
  const [itemPath = "", itemQuery = ""] = path.split("?");
  if (pathname !== itemPath && !pathname.startsWith(`${itemPath}/`)) return -1;
  const exact = pathname === itemPath ? 1000 : 0;
  if (!itemQuery) return exact + itemPath.length * 2;
  const current = new URLSearchParams(search);
  const wanted = [...new URLSearchParams(itemQuery)];
  return wanted.every(([key, value]) => current.get(key) === value) ? exact + itemPath.length * 2 + 1 : -1;
}

export interface ActiveNavigation { readonly groupId: string; readonly itemId: string; readonly trail: readonly string[] }

/** The entry that best matches the address, with the IDs of its ancestors. */
export function activeNavigation(groups: readonly NavigationGroup[], pathname: string, search = ""): ActiveNavigation | null {
  let best: (ActiveNavigation & { score: number }) | null = null;
  const visit = (groupId: string, item: NavigationItem, trail: readonly string[]) => {
    const score = item.path ? matchScore(item.path, pathname, search) : -1;
    // Later entries win ties so a child is preferred over a parent that shares its path.
    if (score >= 0 && (!best || score >= best.score)) best = { groupId, itemId: item.id, trail, score };
    for (const child of item.children ?? []) visit(groupId, child, [...trail, item.id]);
  };
  for (const group of groups) for (const item of group.items) visit(group.id, item, []);
  return best;
}

export interface NavigationMatch { readonly label: string; readonly path: string; readonly context: string }

/** Flat list of pages for search, with the group and heading each one sits under. */
export function navigationPages(groups: readonly NavigationGroup[]): NavigationMatch[] {
  const pages = new Map<string, NavigationMatch>();
  const visit = (item: NavigationItem, context: string) => {
    if (item.path && !pages.has(item.path)) pages.set(item.path, { label: item.label, path: item.path, context });
    for (const child of item.children ?? []) visit(child, `${context} · ${item.label}`);
  };
  for (const group of groups) for (const item of group.items) visit(item, group.label);
  return [...pages.values()];
}

export interface NavigationCrumb { readonly label: string; readonly path?: string }

/**
 * Where a page sits in the navigation: its group, any headings above it, and the sidebar entry
 * itself. Only the entry is a page, so only it carries a path; group and headings are plain text.
 */
export function navigationTrail(groups: readonly NavigationGroup[], pathname: string, search = ""): NavigationCrumb[] {
  const active = activeNavigation(groups, pathname, search);
  const group = groups.find((item) => item.id === active?.groupId);
  if (!active || !group) return [];
  const crumbs: NavigationCrumb[] = [{ label: group.label }];
  let level: readonly NavigationItem[] = group.items;
  for (const id of [...active.trail, active.itemId]) {
    const item = level.find((candidate) => candidate.id === id);
    if (!item) break;
    // A heading and its first entry often share a name ("Dashboard" over "Overview" is fine, "Users" over "Users" is noise).
    if (crumbs[crumbs.length - 1]?.label !== item.label) {
      crumbs.push(id === active.itemId && item.path ? { label: item.label, path: item.path.split("?")[0] ?? item.path } : { label: item.label });
    }
    level = item.children ?? [];
  }
  return crumbs;
}
