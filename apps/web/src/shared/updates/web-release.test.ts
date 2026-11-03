// @vitest-environment jsdom
import { afterEach, expect, it, vi } from "vitest";
import { fetchWebRelease, matchesRunningWebRelease, prepareWebRefresh, webRefreshUrl } from "./web-release";

const commit = "a".repeat(40);
const release = { commit, minimumShellVersion: "0.1.0" };
const signal = () => AbortSignal.timeout(10_000);
const html = (asset: string) => `<meta name="application-name" content="Oryx Live"><script type="module" src="/assets/${asset}.js"></script>`;
afterEach(() => { vi.unstubAllGlobals(); document.head.innerHTML = ""; });

it("release checks bypass the browser cache and get a unique URL each time", async () => {
  const fetcher = vi.fn(async () => Response.json(release));
  vi.stubGlobal("fetch", fetcher);
  await fetchWebRelease(signal());
  await fetchWebRelease(signal());
  expect(fetcher.mock.calls[0]).not.toEqual(fetcher.mock.calls[1]);
  expect(fetcher).toHaveBeenCalledWith(expect.stringContaining("/deployment.json?__oryx_check="), expect.objectContaining({ cache: "no-store", credentials: "omit", redirect: "error" }));
});

it("only adopts a missing build identity when its loaded assets match fresh HTML", async () => {
  document.head.innerHTML = html("old");
  vi.stubGlobal("fetch", async () => new Response(html("old")));
  expect(await matchesRunningWebRelease(signal())).toBe(true);
  vi.stubGlobal("fetch", async () => new Response(html("new")));
  expect(await matchesRunningWebRelease(signal())).toBe(false);
});

it("refresh preserves the origin, route, filters and fragment, with a new cache key on every retry", () => {
  const original = "http://oryx.local:3001/products/123?tab=packing&filter=a%20b#quantity";
  const address = webRefreshUrl(original, commit);
  const url = new URL(address);
  expect(url.origin).toBe("http://oryx.local:3001");
  expect(url.pathname).toBe("/products/123");
  expect(url.searchParams.get("tab")).toBe("packing");
  expect(url.searchParams.get("filter")).toBe("a b");
  expect(url.hash).toBe("#quantity");
  expect(url.searchParams.get("__oryx_release")).toContain(commit);
  expect(webRefreshUrl(address, commit)).not.toBe(address);
});

it("works on intranet HTTP where the secure-context randomUUID API is unavailable", () => {
  const getRandomValues = crypto.getRandomValues.bind(crypto);
  vi.stubGlobal("crypto", { getRandomValues });
  expect(webRefreshUrl("http://oryx.local:3001/", commit)).toContain("__oryx_release=");
});

it("refuses a release that changed during preflight, including a raised minimum shell requirement", async () => {
  vi.stubGlobal("fetch", async () => Response.json({ ...release, minimumShellVersion: "0.3.0" }));
  await expect(prepareWebRefresh(release, signal())).rejects.toThrow("available release changed");
});

it("an HTML error page returned with status 200 cannot replace a running app", async () => {
  vi.stubGlobal("fetch", async (url: string) => url.includes("deployment.json") ? Response.json(release) : new Response("<h1>Server offline</h1>"));
  await expect(prepareWebRefresh(release, signal())).rejects.toThrow("did not return the Oryx");
});
