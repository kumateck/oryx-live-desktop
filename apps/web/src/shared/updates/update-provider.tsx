import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { type DesktopUpdatesBridge, type DesktopUpdateState, type WebRelease, newerVersion, parseJson, readWebRelease } from "../../../../../shared/desktop-updates";
import { canApplyWebRelease, hasUnsavedUpdateWork } from "./leave-safety";
import { WebUpdateDialog } from "./web-update-dialog";

declare const ORYX_WEB_COMMIT: string;
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
  const current = useRef(typeof ORYX_WEB_COMMIT === "string" && /^[a-f0-9]{40}$/.test(ORYX_WEB_COMMIT) ? ORYX_WEB_COMMIT : "");
  const dismissed = useRef("");
  const native = useRef<DesktopUpdateState | null>(null);
  useEffect(() => {
    const bridge = window.oryxUpdates;
    if (!bridge) return;
    let active = true;
    const receive = (state: DesktopUpdateState) => { if (active) { native.current = state; setDesktop(state); } };
    const unsubscribe = bridge.onStatus(receive);
    void bridge.status().then(receive).catch(() => {});
    return () => { active = false; unsubscribe(); };
  }, []);
  useEffect(() => {
    const controller = new AbortController(); let loading = false;
    const check = async () => {
      if (loading || document.visibilityState !== "visible") return;
      loading = true;
      try {
        const response = await fetch("/deployment.json", { cache: "no-store", credentials: "omit", redirect: "error", signal: AbortSignal.any([controller.signal, AbortSignal.timeout(10_000)]) });
        if (!response.ok) return;
        const release = readWebRelease(parseJson(await response.text()));
        if (controller.signal.aborted) return;
        if (!current.current) { current.current = release.commit; return; }
        if (release.commit === current.current) { setWeb(null); setOpen(false); return; }
        const version = native.current?.currentVersion ?? (window.oryxSession ? "0.1.0" : null);
        const needsShell = Boolean(version && newerVersion(release.minimumShellVersion, version));
        setWeb(release);
        if (!needsShell && (!window.oryxUpdates || native.current) && dismissed.current !== release.commit && canApplyWebRelease()) { window.location.reload(); return; }
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
  const required = Boolean(web && (desktop || window.oryxSession) && newerVersion(web.minimumShellVersion, desktop?.currentVersion ?? "0.1.0"));
  return <Context.Provider value={value}>{children}<WebUpdateDialog open={open} release={web} required={required} error={error}
    close={() => { dismissed.current = web?.commit ?? ""; setOpen(false); setError(""); }}
    reload={() => {
      if (hasUnsavedUpdateWork()) { setError("Save or discard your unsaved changes before refreshing Oryx."); return; }
      if (required) { show(); return; }
      window.location.reload();
    }} updateDesktop={show} /></Context.Provider>;
}
