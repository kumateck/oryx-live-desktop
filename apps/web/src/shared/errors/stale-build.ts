import { hasUnsavedUpdateWork } from "../updates/leave-safety";
// A window opened before a release still runs the previous build. When it opens a page it has not loaded yet, it asks
// for that page's code under the old file name. The server keeps earlier builds' files (deploy/nginx.conf.template),
// but if one is gone anyway, the window loads the new release instead of showing a dead end.

const reloadedKey = "oryx-reloaded-for-release";
/** A reload within this long of the last one is not repeated: the new release itself is failing to load. */
const quietMs = 60_000;

/** Whether an error is a page's code failing to load, as browsers and Vite word it. */
export function isStaleBuildError(error: Error | null | undefined): boolean {
  if (!error) return false;
  return /dynamically imported module|Importing a module script failed|error loading dynamically imported module|Unable to preload CSS/i.test(error.message);
}

/** Loads the current release once. Returns false when it just did, so the caller shows the error instead of looping. */
export function reloadForNewRelease(now = Date.now()): boolean {
  if (typeof window.dispatchEvent === "function" && hasUnsavedUpdateWork()) return false;
  let last = 0;
  try { last = Number(sessionStorage.getItem(reloadedKey) ?? "0"); } catch { /* storage unavailable */ }
  if (now - last < quietMs) return false;
  try { sessionStorage.setItem(reloadedKey, String(now)); } catch { /* reload anyway */ }
  window.location.reload();
  return true;
}

/** Vite reports a failed code load before React sees it; reload then, so the user never sees the error page. */
export function reloadOnStaleBuild(): void {
  window.addEventListener("vite:preloadError", (event) => { if (reloadForNewRelease()) event.preventDefault(); });
}
