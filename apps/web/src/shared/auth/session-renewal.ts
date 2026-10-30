import { tokenStore } from "./token-store";
import { send, json } from "./session-transport";
import { SessionRequestError } from "./session-errors";
import { z } from "zod";
import type { DomainEntitiesAuthLoginWithRefreshToken } from "@/shared/api/generated/auth";

// The backend requires a client id on renewal but does not use its value; "web" matches the client it issues tokens for.
const clientId = "web";
const problem = z.object({ errors: z.array(z.object({ code: z.string() })) });

export async function renewSession(accept: (response: Response, version: number) => Promise<string>): Promise<boolean> {
  const version = tokenStore.version();
  await tokenStore.restore();
  if (version !== tokenStore.version()) return Boolean(tokenStore.accessToken());
  const refreshToken = tokenStore.refreshToken() ?? (await tokenStore.borrow());
  if (version !== tokenStore.version()) return Boolean(tokenStore.accessToken());
  if (!refreshToken) return false;
  const response = await send("/api/v1/auth/login-with-refresh-token", {
    method: "POST",
    headers: { "Content-Type": "application/json", Module: "Authentication", SubModule: "Login" },
    body: JSON.stringify({ clientId, refreshToken } satisfies DomainEntitiesAuthLoginWithRefreshToken),
  });
  if (version !== tokenStore.version()) return Boolean(tokenStore.accessToken());
  if (!response.ok) {
    const parsed = problem.safeParse(await json(response));
    const codes = parsed.success ? parsed.data.errors.map((error) => error.code) : [];
    if (version !== tokenStore.version()) return Boolean(tokenStore.accessToken());
    // User.NotFound: the token is known but its account is gone, for example after the server's database is reset.
    if ([400, 401].includes(response.status) || codes.includes("Token.NotFound") || codes.includes("User.NotFound") || codes.includes("Token.Expired") || codes.includes("Login.Disabled")) {
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
