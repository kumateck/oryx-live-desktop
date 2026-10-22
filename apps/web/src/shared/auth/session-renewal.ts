import { tokenStore } from "./token-store";
import { send, json } from "./session-transport";
import { SessionRequestError } from "./session-errors";
import { z } from "zod";

const problem = z.object({ errors: z.array(z.object({ code: z.string() })) });

export async function renewSession(accept: (response: Response, version: number) => Promise<string>): Promise<boolean> {
  const version = tokenStore.version();
  await tokenStore.restore();
  if (version !== tokenStore.version()) return Boolean(tokenStore.accessToken());
  const refreshToken = tokenStore.refreshToken();
  if (!refreshToken) return false;
  const response = await send("/api/v1/auth/login-with-refresh-token", {
    method: "POST",
    headers: { "Content-Type": "application/json", Module: "Authentication", SubModule: "Login" },
    body: JSON.stringify({ refreshToken }),
  });
  if (version !== tokenStore.version()) return Boolean(tokenStore.accessToken());
  if (!response.ok) {
    const parsed = problem.safeParse(await json(response));
    const codes = parsed.success ? parsed.data.errors.map((error) => error.code) : [];
    if (version !== tokenStore.version()) return Boolean(tokenStore.accessToken());
    if ([400, 401].includes(response.status) || codes.includes("Token.NotFound") || codes.includes("Token.Expired") || codes.includes("Login.Disabled")) {
      tokenStore.clear();
      await tokenStore.flush();
      return false;
    }
    throw new SessionRequestError(response.status === 429 ? "throttled" : "server", response.status);
  }
  try {
    await accept(response, version);
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") return Boolean(tokenStore.accessToken());
    throw error;
  }
  return true;
}

/** Abort just this waiter, leaving the shared server request and encrypted save running. */
export function waitForRenewal(pending: Promise<boolean>, signal?: AbortSignal): Promise<boolean> {
  if (!signal) return pending;
  return new Promise((resolve, reject) => {
    const abort = () => {
      cleanup();
      reject(new DOMException("Page closed", "AbortError"));
    };
    const cleanup = () => signal.removeEventListener("abort", abort);
    if (signal.aborted) {
      abort();
      return;
    }
    signal.addEventListener("abort", abort, { once: true });
    pending.then(
      (value) => {
        cleanup();
        resolve(value);
      },
      (error: Error) => {
        cleanup();
        reject(error);
      },
    );
  });
}
