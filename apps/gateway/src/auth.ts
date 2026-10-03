import { createHash } from "node:crypto";

export type Verified = { ok: true; userId: string } | { ok: false; reason: "rejected" | "unavailable" };
type Fetcher = (input: string, init: RequestInit) => Promise<Response>;

/**
 * Asks the backend who a token belongs to. The gateway never decides this itself: a token the backend
 * no longer accepts is refused here too. Results are remembered briefly, keyed by a hash of the token,
 * so a reconnecting client does not cost a backend request every time.
 */
export function createVerifier({ apiOrigin, fetcher = fetch, now = Date.now, rememberMs = 60_000, timeoutMs = 8_000 }: { apiOrigin: string; fetcher?: Fetcher; now?: () => number; rememberMs?: number; timeoutMs?: number }) {
  const remembered = new Map<string, { userId: string; until: number }>();
  const key = (token: string) => createHash("sha256").update(token).digest("hex");

  return async function verify(token: unknown): Promise<Verified> {
    if (typeof token !== "string" || token.length < 20 || token.length > 8192) return { ok: false, reason: "rejected" };
    const id = key(token);
    const known = remembered.get(id);
    if (known && known.until > now()) return { ok: true, userId: known.userId };
    remembered.delete(id);
    let response: Response;
    try { response = await fetcher(`${apiOrigin}/api/v1/user/authenticated`, { headers: { Authorization: `Bearer ${token}`, Accept: "application/json" }, signal: AbortSignal.timeout(timeoutMs) }); }
    catch { return { ok: false, reason: "unavailable" }; }
    if (response.status === 401 || response.status === 403) return { ok: false, reason: "rejected" };
    if (!response.ok) return { ok: false, reason: "unavailable" };
    const body = await response.json().catch(() => null) as { id?: unknown; isDisabled?: unknown } | null;
    const userId = typeof body?.id === "string" && body.id ? body.id.toLowerCase() : null;
    // A disabled account may still hold a token that has not expired; it gets nothing.
    if (!userId || body?.isDisabled === true) return { ok: false, reason: "rejected" };
    // Old entries are dropped as new ones arrive, so the map cannot grow without limit.
    if (remembered.size > 5_000) for (const [entry, value] of remembered) if (value.until <= now()) remembered.delete(entry);
    remembered.set(id, { userId, until: now() + rememberMs });
    return { ok: true, userId };
  };
}
