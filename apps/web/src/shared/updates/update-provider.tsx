import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { type DesktopUpdatesBridge, type DesktopUpdateState, type WebRelease, newerVersion } from "../../../../../shared/desktop-updates";
import { hasUnsavedUpdateWork } from "./leave-safety";
import { WebUpdateDialog } from "./web-update-dialog";
import { fetchWebRelease, matchesRunningWebRelease, prepareWebRefresh, replaceWebPage, runningWebCommit } from "./web-release";

declare global { interface Window { oryxUpdates?: DesktopUpdatesBridge } }
interface UpdatesContext {
  desktop: DesktopUpdateState | null;
  web: WebRelease | null;
  open: () => void;
}
const Context = createContext<UpdatesContext>({ desktop: null, web: null, open: () => {} });
export const useReleaseUpdates = () => useContext(Context);
export function UpdateProvider({ children }: { children: ReactNode }) {
  const [desktop, setDesktop] = useState<DesktopUpdateState | null>(null);
  const [web, setWeb] = useState<WebRelease | null>(null);
  const [open, setOpen] = useState(false);
  const [error, setError] = useState("");
  const [refreshing, setRefreshing] = useState(false);
  const refreshRequest = useRef<AbortController | null>(null);
  const dismissed = useRef("");
  useEffect(() => () => { refreshRequest.current?.abort(); }, []);
  useEffect(() => {
    const bridge = window.oryxUpdates;
    if (!bridge) return;
    let active = true;
    const receive = (state: DesktopUpdateState) => { if (active) setDesktop(state); };
    const unsubscribe = bridge.onStatus(receive);
    void bridge.status().then(receive).catch(() => {});
    return () => { active = false; unsubscribe(); };
  }, []);
  useEffect(() => {
    let current = runningWebCommit();
    const controller = new AbortController(); let loading = false;
    const check = async () => {
      if (loading || document.visibilityState !== "visible") return;
      loading = true;
      try {
        const signal = AbortSignal.any([controller.signal, AbortSignal.timeout(10_000)]);
        const release = await fetchWebRelease(signal);
        if (!current) {
          const matches = await matchesRunningWebRelease(signal);
          if (matches === null) return;
          if (matches) current = release.commit;
        }
        if (controller.signal.aborted) return;
        if (release.commit === current) { setWeb(null); setOpen(false); return; }
        setWeb(release);
        if (dismissed.current !== release.commit) setOpen(true);
      } catch { /* Keep the running version during outages, invalid metadata or an interrupted deployment. */ }
      finally { loading = false; }
    };
    void check();
    const interval = setInterval(() => { void check(); }, 60_000);
    const wake = () => { void check(); };
    window.addEventListener("focus", wake); window.addEventListener("online", wake); document.addEventListener("visibilitychange", wake);
    return () => { controller.abort(); clearInterval(interval); window.removeEventListener("focus", wake); window.removeEventListener("online", wake); document.removeEventListener("visibilitychange", wake); };
  }, []);
  const show = useCallback(() => {
    setError("");
    if (window.oryxUpdates) { setOpen(false); void window.oryxUpdates.open().catch(() => { setError("The desktop updater could not be opened. Restart Oryx and try again."); setOpen(true); }); }
    else setOpen(true);
  }, []);
  const value = useMemo(() => ({ desktop, web, open: web ? () => setOpen(true) : show }), [desktop, web, show]);
  const required = Boolean(web && (desktop || window.oryxSession || window.oryxUpdates) && newerVersion(web.minimumShellVersion, desktop?.currentVersion ?? "0.1.0"));
  const reload = async () => {
    if (!web || refreshRequest.current) return;
    if (hasUnsavedUpdateWork()) { setError("Save or discard your unsaved changes before refreshing Oryx."); return; }
    if (required) { show(); return; }
    const controller = new AbortController();
    refreshRequest.current = controller;
    setRefreshing(true); setError("");
    try {
      const address = await prepareWebRefresh(web, AbortSignal.any([controller.signal, AbortSignal.timeout(10_000)]));
      if (controller.signal.aborted) return;
      if (hasUnsavedUpdateWork()) { setError("Save or discard your unsaved changes before refreshing Oryx."); return; }
      replaceWebPage(address);
    } catch {
      if (!controller.signal.aborted) setError("The latest release could not be loaded. Check your connection and try again. Your current page is still open.");
    } finally {
      refreshRequest.current = null;
      if (!controller.signal.aborted) setRefreshing(false);
    }
  };
  return <Context.Provider value={value}>{children}<WebUpdateDialog open={open} release={web} required={required} error={error} refreshing={refreshing}
    close={() => { if (refreshRequest.current) return; dismissed.current = web?.commit ?? ""; setOpen(false); setError(""); }}
    reload={() => { void reload(); }} updateDesktop={show} /></Context.Provider>;
}
