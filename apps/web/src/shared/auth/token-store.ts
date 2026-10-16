// Holds the backend's bearer tokens for this window.
// The access token lives in memory only. The refresh token is also kept in sessionStorage so a
// reload restores the session; it is never written to localStorage and is gone when the window closes.
// In the installed app it is also kept by the desktop shell, encrypted by the operating system, so the
// session survives a restart until the server ends it or the user signs out.
const refreshKey = "oryx-session-refresh";

/** The desktop shell's kept sign-in (apps/desktop/src/bridge.ts). Absent in a browser. */
interface SessionBridge { load(): Promise<string | null>; save(refreshToken: string | null): Promise<void> }
declare global { interface Window { oryxSession?: SessionBridge } }

let accessToken: string | null = null;
let refreshToken: string | null = null;
let restored = false;

function stored(): string | null {
  try { return sessionStorage.getItem(refreshKey); } catch { return null; }
}

function bridge(): SessionBridge | null {
  return typeof window !== "undefined" && window.oryxSession ? window.oryxSession : null;
}

function remember(token: string | null): void {
  try {
    if (token) sessionStorage.setItem(refreshKey, token);
    else sessionStorage.removeItem(refreshKey);
  } catch { /* storage unavailable: the session lasts until reload */ }
}

/** The shell may refuse (another server's page) or have no OS encryption; the session then lasts as in a browser. */
function keep(token: string | null): void {
  void bridge()?.save(token).catch(() => undefined);
}

export const tokenStore = {
  accessToken: (): string | null => accessToken,
  refreshToken: (): string | null => refreshToken ?? stored(),
  /** Reads the sign-in the desktop shell kept, once per window, when this window has none of its own. */
  async restore(): Promise<void> {
    if (restored || refreshToken || stored()) { restored = true; return; }
    restored = true;
    const shell = bridge();
    if (!shell) return;
    try {
      const kept = await shell.load();
      if (kept && !refreshToken) { refreshToken = kept; remember(kept); }
    } catch { /* nothing kept, or refused */ }
  },
  set(tokens: { accessToken: string; refreshToken: string | null }): void {
    accessToken = tokens.accessToken;
    refreshToken = tokens.refreshToken;
    restored = true;
    remember(tokens.refreshToken);
    keep(tokens.refreshToken);
  },
  clear(): void {
    accessToken = null;
    refreshToken = null;
    restored = true;
    remember(null);
    keep(null);
  },
};
