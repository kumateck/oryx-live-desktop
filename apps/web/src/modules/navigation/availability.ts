import type { NavigationGroup, NavigationItem } from "./navigation-model.ts";

export function pagePath(file: string): string {
  const segments = file.replace(/^.*?pages\//, "").replace(/\/page\.tsx$/, "").split("/");
  return `/${segments.filter((segment) => !segment.startsWith("(")).join("/")}`;
}
export function hasConcretePage(destination: string, pages: readonly string[]): boolean {
  const path = destination.split("?")[0] ?? "";
  const parts = path.split("/");
  return pages.some((page) => {
    if (page.includes("[...")) return false;
    const pattern = page.split("/");
    return pattern.length === parts.length && pattern.every((segment, index) => segment.startsWith("[") ? Boolean(parts[index]) : segment === parts[index]);
  });
}
/** A missing destination may remain a heading only when it has available children. */
export function availableNavigation(groups: readonly NavigationGroup[], pages: readonly string[]): NavigationGroup[] {
  const visit = (item: NavigationItem): NavigationItem[] => {
    const children = item.children?.flatMap(visit);
    const path = item.path && hasConcretePage(item.path, pages) ? item.path : undefined;
    if (!path && !children?.length) return [];
    return [{ id: item.id, label: item.label, ...(path ? { path } : {}), ...(item.permissions ? { permissions: item.permissions } : {}), ...(item.accounts ? { accounts: item.accounts } : {}), ...(children?.length ? { children } : {}) }];
  };
  return groups.flatMap((group) => {
    const items = group.items.flatMap(visit);
    return items.length ? [{ ...group, items }] : [];
  });
}
