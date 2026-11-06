import { parseSiteUrl } from "../site-config.ts";

/** Where every install looks for desktop releases unless a build or launch names another source. */
export const defaultUpdateOrigin = "https://oryx.kumateck.com";

const loopbackHosts = new Set(["localhost", "127.0.0.1", "[::1]"]);

/**
 * A build-time source is reached over the internet by every install, so it must use HTTPS; plain HTTP is
 * accepted only for a loopback test server. Signatures are verified whichever scheme is used.
 */
export function parseBuildUpdateOrigin(input: string): string {
  const origin = parseSiteUrl(input);
  const url = new URL(origin);
  if (url.protocol !== "https:" && !loopbackHosts.has(url.hostname)) throw new Error("The desktop update source must use HTTPS");
  return origin;
}

export interface UpdateSource { origin: string; warning: string }

/**
 * Picks the update source: `ORYX_UPDATE_ORIGIN` at launch (testing or staging), else the source compiled into
 * the build, else the default. An unusable launch value is ignored, so a typo never leaves an install without updates.
 */
export function resolveUpdateSource(built: string, launch: string | undefined): UpdateSource {
  let origin = defaultUpdateOrigin;
  if (built.trim()) origin = parseBuildUpdateOrigin(built);
  if (!launch?.trim()) return { origin, warning: "" };
  try { return { origin: parseSiteUrl(launch), warning: "" }; }
  catch { return { origin, warning: `Ignored ORYX_UPDATE_ORIGIN: it is not a server origin. Using ${origin}.` }; }
}

/** The update source first, then the connected server as a fallback; each origin once. */
export function feedOrigins(updateOrigin: string, site: string): string[] {
  return [...new Set([updateOrigin, site].filter(Boolean))];
}
