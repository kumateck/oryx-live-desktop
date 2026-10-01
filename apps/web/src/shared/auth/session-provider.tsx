import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { currentSession, loginSession, logoutSession, SessionRequestError, type SessionView } from "./session-api";
import { openSessionChannel, type SessionSignal } from "./session-channel";
import { onSessionExpired } from "./session-events";

export type SignedOutReason = "expired" | "signed-out" | "disabled";

export type SessionState =
  | { status: "loading" }
  | { status: "anonymous"; reason: SignedOutReason | null }
  | { status: "authenticated"; session: SessionView }
  | { status: "error"; message: string };

interface SessionContextValue {
  state: SessionState;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  /** Re-runs the startup check after a failure, showing the loading state. */
  retry: () => Promise<void>;
  /** Re-reads the user and permissions without interrupting the workspace. */
  refresh: () => Promise<void>;
}

const SessionContext = createContext<SessionContextValue | null>(null);
const revalidateAfterMs = 60_000;

function sameSession(a: SessionView, b: SessionView): boolean {
  return JSON.stringify(a) === JSON.stringify(b);
}

export function SessionProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<SessionState>({ status: "loading" });
  const revision = useRef(0);
  const checkedAt = useRef(0);
  const status = useRef(state.status);
  const announce = useRef<(signal: SessionSignal) => void>(() => {});
  useEffect(() => { status.current = state.status; }, [state.status]);

  const load = useCallback(async (signal?: AbortSignal) => {
    const request = ++revision.current;
    try {
      const session = await currentSession(signal);
      if (request !== revision.current || signal?.aborted) return;
      checkedAt.current = Date.now();
      setState(session ? { status: "authenticated", session } : { status: "anonymous", reason: null });
    } catch (error) {
      if (request !== revision.current || signal?.aborted) return;
      setState(error instanceof SessionRequestError && error.reason === "disabled"
        ? { status: "anonymous", reason: "disabled" }
        : { status: "error", message: error instanceof SessionRequestError ? error.message : "Cannot reach the customer server." });
    }
  }, []);

  const refresh = useCallback(async () => {
    const request = ++revision.current;
    try {
      const session = await currentSession();
      if (request !== revision.current) return;
      checkedAt.current = Date.now();
      setState((current) => !session ? { status: "anonymous", reason: current.status === "authenticated" ? "expired" : null }
        : current.status === "authenticated" && sameSession(current.session, session) ? current
          : { status: "authenticated", session });
    } catch (error) {
      if (request !== revision.current) return;
      // A dropped connection must not close a workspace with unsaved work; only the server can end the session.
      if (error instanceof SessionRequestError && error.reason === "disabled") setState({ status: "anonymous", reason: "disabled" });
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    void load(controller.signal);
    return () => controller.abort();
  }, [load]);

  useEffect(() => onSessionExpired(() => {
    ++revision.current;
    setState((current) => current.status === "authenticated" ? { status: "anonymous", reason: "expired" } : current);
  }), []);

  // Permissions and the cookie can change while the window is in the background.
  useEffect(() => {
    const revalidate = () => {
      if (document.visibilityState !== "visible" || status.current !== "authenticated") return;
      if (Date.now() - checkedAt.current >= revalidateAfterMs) void refresh();
    };
    document.addEventListener("visibilitychange", revalidate);
    window.addEventListener("online", revalidate);
    return () => {
      document.removeEventListener("visibilitychange", revalidate);
      window.removeEventListener("online", revalidate);
    };
  }, [refresh]);

  useEffect(() => {
    const channel = openSessionChannel((signal) => {
      if (signal === "signed-in") { void refresh(); return; }
      ++revision.current;
      setState((current) => current.status === "authenticated" ? { status: "anonymous", reason: "signed-out" } : current);
    });
    announce.current = channel.announce;
    return () => { announce.current = () => {}; channel.close(); };
  }, [refresh]);

  const login = useCallback(async (email: string, password: string) => {
    const request = ++revision.current;
    const session = await loginSession(email, password);
    checkedAt.current = Date.now();
    announce.current("signed-in");
    if (request === revision.current) setState({ status: "authenticated", session });
  }, []);

  const logout = useCallback(async () => {
    logoutSession();
    ++revision.current;
    announce.current("signed-out");
    setState({ status: "anonymous", reason: "signed-out" });
  }, []);

  const retry = useCallback(async () => { setState({ status: "loading" }); await load(); }, [load]);
  const value = useMemo(() => ({ state, login, logout, retry, refresh }), [state, login, logout, retry, refresh]);
  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

export function useSession(): SessionContextValue {
  const session = useContext(SessionContext);
  if (!session) throw new Error("SessionProvider is missing");
  return session;
}

export function useCurrentUser(): SessionView["user"] | null {
  const { state } = useSession();
  return state.status === "authenticated" ? state.session.user : null;
}
