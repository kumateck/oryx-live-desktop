export interface TabLocation { pathname: string; search: string; hash: string }
export const tabAddress = (location: TabLocation): string => `${location.pathname}${location.search}${location.hash}`;

/** All non-presentation query parameters contribute to identity, including module-specific scopes. */
const viewParameters = new Set(["search", "page", "pageSize", "sort", "sortBy", "sortOrder", "q", "__oryx_release", "__oryx_check"]);
export function destinationKey(location: TabLocation): string {
  const params = new URLSearchParams(location.search);
  for (const key of viewParameters) params.delete(key);
  params.sort();
  return `${location.pathname.replace(/\/$/, "") || "/"}?${params}`;
}

export function internalDestination(address: string, origin: string): TabLocation | null {
  try {
    const url = new URL(address, origin);
    if (url.origin !== origin || !["http:", "https:"].includes(url.protocol) || url.username || url.password) return null;
    // Public authentication and file/API destinations do not belong in workspace tabs.
    if (/^\/(api|login|logout|forgot-password|reset-password|onboarding)(\/|$)/.test(url.pathname)) return null;
    return { pathname: url.pathname, search: url.search, hash: url.hash };
  } catch { return null; }
}

export function fallbackTabTitle(location: TabLocation): string {
  const parts = location.pathname.split("/").filter(Boolean);
  const last = parts.at(-1) ?? "Home";
  if (/^[0-9a-f-]{32,36}$/i.test(last)) return `${parts.at(-2)?.replaceAll("-", " ") ?? "Record"} · ${last.slice(0, 8)}`;
  return last.replaceAll("-", " ").replace(/^./, (letter) => letter.toUpperCase());
}
