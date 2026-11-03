import { parseJson, readWebRelease, type WebRelease } from "../../../../../shared/desktop-updates";

const requestOptions = { cache: "no-store", credentials: "omit", redirect: "error" } satisfies RequestInit;

declare const ORYX_WEB_COMMIT: string;
export function runningWebCommit(): string {
  return typeof ORYX_WEB_COMMIT === "string" && /^[a-f0-9]{40}$/.test(ORYX_WEB_COMMIT) ? ORYX_WEB_COMMIT : "";
}

// getRandomValues also works on supported intranet HTTP origins; randomUUID requires HTTPS.
function cacheKey(): string {
  return crypto.getRandomValues(new Uint32Array(4)).join("-");
}

/** A fresh URL also avoids stale responses retained by an intermediary cache. */
function freshUrl(path: string): string {
  const url = new URL(path, window.location.href);
  url.searchParams.set("__oryx_check", cacheKey());
  return url.href;
}

export async function fetchWebRelease(signal: AbortSignal): Promise<WebRelease> {
  const response = await fetch(freshUrl("/deployment.json"), { ...requestOptions, signal });
  if (!response.ok) throw new Error("Release metadata is unavailable");
  return readWebRelease(parseJson(await response.text()));
}

function entryAssets(page: Document): string[] {
  return Array.from(page.querySelectorAll('script[type="module"][src], link[rel="stylesheet"][href]'))
    .map((element) => element.getAttribute("src") ?? element.getAttribute("href") ?? "")
    .filter((path) => path.startsWith("/assets/"))
    .sort();
}

async function fetchWebPage(url: string, signal: AbortSignal): Promise<Document> {
  const response = await fetch(url, { ...requestOptions, signal });
  if (!response.ok) throw new Error("The web application is unavailable");
  const page = new DOMParser().parseFromString(await response.text(), "text/html");
  if (page.querySelector('meta[name="application-name"]')?.getAttribute("content") !== "Oryx Live" || !entryAssets(page).length) {
    throw new Error("The server did not return the Oryx web application");
  }
  return page;
}

/** Older builds without an embedded commit must verify their loaded assets before adopting server metadata. */
export async function matchesRunningWebRelease(signal: AbortSignal): Promise<boolean | null> {
  const running = entryAssets(document);
  if (!running.length) return null; // Development uses source modules rather than production assets.
  const latest = entryAssets(await fetchWebPage(freshUrl("/index.html"), signal));
  return JSON.stringify(running) === JSON.stringify(latest);
}

export function webRefreshUrl(address: string, commit: string): string {
  const url = new URL(address);
  url.searchParams.set("__oryx_release", `${commit}.${cacheKey()}`);
  return url.href;
}

export function replaceWebPage(address: string): void {
  window.location.replace(address);
}

/** Check connectivity and HTML before leaving a usable page. Never clear sessions or stored drafts. */
export async function prepareWebRefresh(release: WebRelease, signal: AbortSignal): Promise<string> {
  const latest = await fetchWebRelease(signal);
  if (latest.commit !== release.commit || latest.minimumShellVersion !== release.minimumShellVersion) {
    throw new Error("The available release changed. Check for updates again before refreshing.");
  }
  const address = webRefreshUrl(window.location.href, release.commit);
  const request = new URL(address);
  request.hash = "";
  await fetchWebPage(request.href, signal);
  return address;
}
