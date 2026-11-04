export const passwordResetScheme = "oryx-live";
const keyPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export interface DesktopPasswordReset { origin: string; key: string }

export function passwordResetOrigin(value: string): string | null {
  try {
    const url = new URL(value);
    return ["http:", "https:"].includes(url.protocol) && !url.username && !url.password &&
      url.pathname === "/" && !url.search && !url.hash ? url.origin : null;
  } catch { return null; }
}

/** A narrow, versioned OS entry point: no arbitrary path, command, or server switch. */
export function parseDesktopPasswordReset(value: string): DesktopPasswordReset | null {
  if (value.length > 4096) return null;
  try {
    const url = new URL(value);
    if (url.protocol !== `${passwordResetScheme}:` || url.hostname !== "reset-password" || url.port || url.username || url.password ||
      (url.pathname !== "" && url.pathname !== "/") || url.hash || [...url.searchParams.keys()].some((key) => !["site", "key"].includes(key)) ||
      url.searchParams.getAll("site").length !== 1 || url.searchParams.getAll("key").length !== 1) return null;
    const origin = passwordResetOrigin(url.searchParams.get("site") ?? "");
    const key = url.searchParams.get("key") ?? "";
    return origin && keyPattern.test(key) ? { origin, key } : null;
  } catch { return null; }
}

export function desktopPasswordResetLink(origin: string, key: string): string | null {
  const site = passwordResetOrigin(origin);
  if (!site || !keyPattern.test(key)) return null;
  const url = new URL(`${passwordResetScheme}://reset-password`);
  url.searchParams.set("site", site);
  url.searchParams.set("key", key);
  return url.href;
}

export function passwordResetPage(link: DesktopPasswordReset, configuredOrigin: string): string | null {
  if (passwordResetOrigin(configuredOrigin) !== link.origin || !keyPattern.test(link.key)) return null;
  const url = new URL("/reset-password", link.origin);
  url.searchParams.set("key", link.key);
  // Presentation only: prevent the isolated reset window from handing back to itself.
  url.searchParams.set("desktop", "1");
  return url.href;
}
