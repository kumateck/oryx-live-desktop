import { SessionRequestError } from "./session-errors";
// Bearer access stays in memory. Reloads use sessionStorage; desktop restarts use the OS encrypted vault.
const refreshKey = "oryx-session-refresh";
interface SessionBridge {
  load(): Promise<string | null>;
  save(refreshToken: string | null): Promise<void>;
}
declare global {
  interface Window {
    oryxSession?: SessionBridge;
  }
}
let accessToken: string | null = null;
let refreshToken: string | null = null;
let restored = false;
let revision = 0;
let restoring: Promise<void> | null = null;
let writing = Promise.resolve();

function stored(): string | null {
  try {
    return sessionStorage.getItem(refreshKey);
  } catch {
    return null;
  }
}
function bridge(): SessionBridge | null {
  return typeof window !== "undefined" && window.oryxSession ? window.oryxSession : null;
}
function remember(token: string | null): void {
  try {
    if (token) sessionStorage.setItem(refreshKey, token);
    else sessionStorage.removeItem(refreshKey);
  } catch {
    /* The encrypted desktop vault still supports restoration. */
  }
}
function keep(token: string | null): void {
  const shell = bridge();
  if (!shell) return;
  writing = shell.save(token).catch(() => {
    throw new SessionRequestError("storage", 0);
  });
  // Explicit flush reports failures; observing here prevents an unhandled rejection before the caller awaits it.
  void writing.catch(() => undefined);
}

export const tokenStore = {
  version: (): number => revision,
  accessToken: (): string | null => accessToken,
  refreshToken: (): string | null => refreshToken ?? stored(),
  flush: (): Promise<void> => writing,
  async restore(): Promise<void> {
    if (restored) return;
    restoring ??= (async () => {
      const version = revision;
      const shell = bridge();
      const kept = shell
        ? await shell.load().catch(() => {
            throw new SessionRequestError("storage", 0);
          })
        : stored();
      if (version !== revision) return;
      refreshToken = kept ?? stored();
      remember(refreshToken);
      restored = true;
    })().finally(() => {
      restoring = null;
    });
    return restoring;
  },
  set(tokens: { accessToken: string; refreshToken: string | null }): void {
    ++revision;
    accessToken = tokens.accessToken;
    refreshToken = tokens.refreshToken;
    restored = true;
    remember(tokens.refreshToken);
    keep(tokens.refreshToken);
  },
  clear(): void {
    ++revision;
    accessToken = null;
    refreshToken = null;
    restored = true;
    remember(null);
    keep(null);
  },
};
