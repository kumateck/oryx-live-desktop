import { SessionRequestError } from "./session-errors";

const requestTimeoutMs = 15_000;

/** A stalled or failed connection becomes a "network" failure; a caller's own abort is passed through. */
export async function send(path: string, init: RequestInit, signal?: AbortSignal): Promise<Response> {
  const controller = new AbortController();
  const cancel = () => controller.abort();
  signal?.addEventListener("abort", cancel, { once: true });
  if (signal?.aborted) controller.abort();
  const timer = setTimeout(cancel, requestTimeoutMs);
  try {
    return await fetch(path, { ...init, credentials: "omit", cache: "no-store", signal: controller.signal });
  } catch (error) {
    if (signal?.aborted) throw error;
    throw new SessionRequestError("network", 0);
  } finally {
    clearTimeout(timer);
    signal?.removeEventListener("abort", cancel);
  }
}

type JsonBody = string | number | boolean | object | null;

export async function json(response: Response): Promise<JsonBody> {
  try {
    const body: JsonBody = await response.json();
    return body;
  } catch {
    return null;
  }
}
