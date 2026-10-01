// Holds the backend's bearer tokens for this window.
// The access token lives in memory only. The refresh token is also kept in sessionStorage so a
// reload restores the session; it is never written to localStorage and is gone when the window closes.
const refreshKey = "oryx-session-refresh";

let accessToken: string | null = null;
let refreshToken: string | null = null;

function stored(): string | null {
  try { return sessionStorage.getItem(refreshKey); } catch { return null; }
}

export const tokenStore = {
  accessToken: (): string | null => accessToken,
  refreshToken: (): string | null => refreshToken ?? stored(),
  set(tokens: { accessToken: string; refreshToken: string | null }): void {
    accessToken = tokens.accessToken;
    refreshToken = tokens.refreshToken;
    try {
      if (tokens.refreshToken) sessionStorage.setItem(refreshKey, tokens.refreshToken);
      else sessionStorage.removeItem(refreshKey);
    } catch { /* storage unavailable: the session lasts until reload */ }
  },
  clear(): void {
    accessToken = null;
    refreshToken = null;
    try { sessionStorage.removeItem(refreshKey); } catch { /* nothing stored */ }
  },
};
