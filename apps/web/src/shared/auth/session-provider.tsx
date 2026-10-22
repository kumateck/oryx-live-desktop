import { tokenStore } from "./token-store";
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { currentSession, loginSession, logoutSession, SessionRequestError, type SessionView } from "./session-api";
import { openSessionChannel, type SessionSignal } from "./session-channel";
import { onPermissionDenied, onSessionExpired } from "./session-events";
import { allowsRequirement, type AccessContext, type PermissionRequirement } from "./access";

export type SignedOutReason = "expired" | "signed-out" | "disabled";

export type SessionState =
  | { status: "loading" }
  | { status: "anonymous"; reason: SignedOutReason | null }
  | { status: "authenticated"; session: SessionView }
  | { status: "error"; message: string };

interface SessionContextValue {
  state: SessionState;
  accessContext: AccessContext;
  /** Checks the latest confirmed session, including for callbacks retained by an open dialog. */
  allowsNow: (requirement: PermissionRequirement) => boolean;
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

function sessionAccess(session: SessionView | null): AccessContext {
  return session ? { state: "authenticated", permissions: new Set(session.permissions), departmentType: session.user.departmentType }
    : { state: "anonymous" };
}

export function SessionProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<SessionState>({ status: "loading" });
  const accessContext = useMemo<AccessContext>(() => sessionAccess(state.status === "authenticated" ? state.session : null), [state]);
  const committedAccess = useRef<AccessContext>({ state: "anonymous" });
  const allowsNow = useCallback((requirement: PermissionRequirement) => allowsRequirement(requirement, committedAccess.current), []);
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
      committedAccess.current = sessionAccess(session);
      setState(session ? { status: "authenticated", session } : { status: "anonymous", reason: null });
    } catch (error) {
      if (request !== revision.current || signal?.aborted) return;
      committedAccess.current = { state: "anonymous" };
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
      // In-flight workflows must see revocation even before React commits the next render.
      committedAccess.current = sessionAccess(session);
      setState((current) => !session ? { status: "anonymous", reason: current.status === "authenticated" ? "expired" : null }
        : current.status === "authenticated" && sameSession(current.session, session) ? current
          : { status: "authenticated", session });
    } catch (error) {
      if (request !== revision.current) return;
      // A dropped connection must not close a workspace with unsaved work; only the server can end the session.
      if (error instanceof SessionRequestError && error.reason === "disabled") {
        committedAccess.current = { state: "anonymous" };
        setState({ status: "anonymous", reason: "disabled" });
      }
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    void load(controller.signal);
    return () => controller.abort();
  }, [load]);

  useEffect(() => onSessionExpired(() => {
    ++revision.current;
    committedAccess.current = { state: "anonymous" };
    setState((current) => current.status === "authenticated" ? { status: "anonymous", reason: "expired" } : current);
  }), []);

  useEffect(() => {
    let pending = false;
    let lastCheck = 0;
    return onPermissionDenied(() => {
      if (status.current !== "authenticated" || pending || Date.now() - lastCheck < 5_000) return;
      pending = true;
      lastCheck = Date.now();
      void refresh().finally(() => { pending = false; });
    });
  }, [refresh]);

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
      logoutSession();
      ++revision.current;
      committedAccess.current = { state: "anonymous" };
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
    if (request === revision.current) {
      committedAccess.current = sessionAccess(session);
      setState({ status: "authenticated", session });
    }
  }, []);

  const logout = useCallback(async () => {
    logoutSession();
    ++revision.current;
    committedAccess.current = { state: "anonymous" };
    announce.current("signed-out");
    setState({ status: "anonymous", reason: "signed-out" });
    await tokenStore.flush();
  }, []);

  const retry = useCallback(async () => { committedAccess.current = { state: "anonymous" }; setState({ status: "loading" }); await load(); }, [load]);
  const value = useMemo(() => ({ state, accessContext, allowsNow, login, logout, retry, refresh }), [state, accessContext, allowsNow, login, logout, retry, refresh]);
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
