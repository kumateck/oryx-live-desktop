import { SessionRequestError } from "./session-errors";
import { randomId } from "@/shared/ids/random-id";
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
// In a browser each tab keeps its own sessionStorage, so a new tab asks the open Oryx tabs for their sign-in.
// BroadcastChannel only reaches pages of this origin. Closing every tab still ends the browser session.
type PeerMessage = { kind: "ask"; id: string } | { kind: "give"; id: string; token: string };
const peerChannelName = "oryx-session-token";
const peerWaitMs = 500;
let peers: BroadcastChannel | null = null;

function isPeerMessage(value: unknown): value is PeerMessage {
  if (typeof value !== "object" || value === null) return false;
  const message = value as Record<string, unknown>;
  return typeof message.id === "string" && (message.kind === "ask" || (message.kind === "give" && typeof message.token === "string" && message.token !== ""));
}
function peerChannel(): BroadcastChannel | null {
  if (peers || typeof BroadcastChannel === "undefined" || bridge()) return peers;
  peers = new BroadcastChannel(peerChannelName);
  peers.addEventListener("message", (event: MessageEvent) => {
    const message: unknown = event.data;
    if (!isPeerMessage(message) || message.kind !== "ask") return;
    const token = refreshToken ?? stored();
    if (token) peers?.postMessage({ kind: "give", id: message.id, token } satisfies PeerMessage);
  });
  return peers;
}
async function askPeers(): Promise<string | null> {
  const channel = peerChannel();
  if (!channel) return Promise.resolve(null);
  const id = randomId();
  return new Promise((resolve) => {
    const finish = (token: string | null) => { clearTimeout(timer); channel.removeEventListener("message", listen); resolve(token); };
    const listen = (event: MessageEvent) => {
      const message: unknown = event.data;
      if (isPeerMessage(message) && message.kind === "give" && message.id === id) finish(message.token);
    };
    const timer = setTimeout(() => finish(null), peerWaitMs);
    channel.addEventListener("message", listen);
    channel.postMessage({ kind: "ask", id } satisfies PeerMessage);
  });
}

function remember(token: string | null): void {
  if (token) peerChannel();
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
  /** With no sign-in of its own, a browser tab takes the one an open Oryx tab holds, if any answers in time. */
  async borrow(): Promise<string | null> {
    const own = refreshToken ?? stored();
    if (own) return own;
    const version = revision;
    // Asking other tabs only saves a sign-in; if it fails, the user simply signs in again.
    const token = await askPeers().catch(() => null);
    if (!token || version !== revision) return refreshToken ?? stored();
    refreshToken = token;
    restored = true;
    remember(token);
    return token;
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
