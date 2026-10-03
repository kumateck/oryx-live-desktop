export interface PageCrumb {
  /** Null while the name is still loading; a placeholder is shown. */
  label: string | null;
  /** Leave out for the current page, and for steps that are not pages. */
  to?: string;
}

function routeAddress(to: string): URL {
  const url = new URL(to, "https://oryx.invalid");
  url.pathname = url.pathname.replace(/\/+$/, "") || "/";
  return url;
}

function sameParentRoute(inferred: string, explicit: string): boolean {
  const base = routeAddress(inferred);
  const parent = routeAddress(explicit);
  if (base.origin !== parent.origin || base.pathname !== parent.pathname) return false;
  // A page can add filters to a generic list link; a different queue is not the same parent.
  return [...base.searchParams].every(([key, value]) => parent.searchParams.getAll(key).includes(value));
}

/**
 * A page may supply its list parent as well as its record/action crumbs. That parent
 * anchors the explicit trail in the navigation trail instead of being appended twice.
 * Labels are not identities: a record may have the same name as a parent page.
 */
export function mergeBreadcrumbTrail(base: readonly PageCrumb[], items: readonly PageCrumb[]): PageCrumb[] {
  const parent = items[0];
  if (!parent?.to) return [...base, ...items];
  const destination = parent.to;
  const anchor = base.findIndex((crumb) => crumb.to && sameParentRoute(crumb.to, destination));
  return anchor < 0 ? [...base, ...items] : [...base.slice(0, anchor), ...items];
}
