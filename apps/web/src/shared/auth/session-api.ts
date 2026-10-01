import { z } from "zod";
import { tokenStore } from "./token-store";

// Same endpoints Oryx Next uses; the desktop adds nothing to the backend.
const loginPath = "/api/v1/auth/login";
const refreshPath = "/api/v1/auth/login-with-refresh-token";
const audit = { Module: "Authentication", SubModule: "Login" };
const avatarPath = /^\/api\/v1\/file\/avatar\/[^/?#\\]+$/;

export interface SessionUser { id: string; name: string; email: string | null; department: string | null; avatar: string | null }
export interface SessionView { user: SessionUser; permissions: string[] }
export type SessionFailure = "credentials" | "disabled" | "throttled" | "server" | "network" | "invalid-response";

const failureMessages: Record<SessionFailure, string> = {
  credentials: "The email or password is incorrect.",
  disabled: "This account is disabled. Contact your administrator.",
  throttled: "Too many sign-in attempts. Wait a minute and try again.",
  server: "The customer server could not complete the request. Try again shortly.",
  network: "Cannot reach the customer server. Check the connection and try again.",
  "invalid-response": "The customer server returned an invalid session.",
};

export class SessionRequestError extends Error {
  constructor(readonly reason: SessionFailure, readonly status: number) {
    super(failureMessages[reason]);
    this.name = "SessionRequestError";
  }
}

const tokensSchema = z.object({
  userId: z.uuid(),
  accessToken: z.string().min(1),
  refreshToken: z.string().min(1).nullish().transform((value) => value ?? null),
});
const problemSchema = z.object({ errors: z.array(z.object({ code: z.string() })).min(1) });
const userSchema = z.object({
  id: z.uuid(),
  firstName: z.string().nullish(),
  lastName: z.string().nullish(),
  email: z.string().nullish(),
  isDisabled: z.boolean().default(false),
  avatar: z.string().nullish(),
  department: z.object({ name: z.string().nullish() }).nullish(),
});
const permissionsSchema = z.array(z.object({
  isActive: z.boolean().default(true),
  children: z.array(z.object({ key: z.string().nullish(), types: z.array(z.string()).nullish() })).nullish(),
}));

/** The backend returns an absolute http:// avatar address; only its file path on this origin is used. */
export function sameOriginAvatar(value: string | null | undefined): string | null {
  if (!value) return null;
  let path = value;
  if (/^https?:\/\//i.test(value)) { try { path = new URL(value).pathname; } catch { return null; } }
  return avatarPath.test(path) && !path.includes("..") ? path : null;
}

/** Keys the user holds, by the same rule as Oryx Next: an active module and the "Access" type. */
export function grantedPermissions(modules: z.infer<typeof permissionsSchema>): string[] {
  const keys = new Set<string>();
  for (const module of modules) {
    if (!module.isActive) continue;
    for (const child of module.children ?? []) if (child.key && child.types?.includes("Access")) keys.add(child.key);
  }
  return [...keys];
}

const requestTimeoutMs = 15_000;

/** A stalled or failed connection becomes a "network" failure; a caller's own abort is passed through. */
async function send(path: string, init: RequestInit, signal?: AbortSignal): Promise<Response> {
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

async function json(response: Response): Promise<JsonBody> {
  try { const body: JsonBody = await response.json(); return body; } catch { return null; }
}

async function loginFailure(response: Response): Promise<SessionRequestError> {
  if (response.status === 429) return new SessionRequestError("throttled", 429);
  // The backend answers 400 for wrong credentials and 412 for a disabled account or its own fault;
  // the error code is the only reliable way to tell them apart.
  const problem = problemSchema.safeParse(await json(response));
  const code = problem.success ? problem.data.errors[0]?.code : null;
  if (code === "Users.Details") return new SessionRequestError("credentials", response.status);
  if (code === "Login.Disabled") return new SessionRequestError("disabled", response.status);
  if (response.status === 400 || response.status === 401 || response.status === 422) return new SessionRequestError("credentials", response.status);
  return new SessionRequestError("server", response.status);
}

let currentUserId: string | null = null;

async function acceptTokens(response: Response): Promise<string> {
  const parsed = tokensSchema.safeParse(await json(response));
  if (!parsed.success) throw new SessionRequestError("invalid-response", 502);
  tokenStore.set({ accessToken: parsed.data.accessToken, refreshToken: parsed.data.refreshToken });
  currentUserId = parsed.data.userId;
  return parsed.data.userId;
}

let refreshing: Promise<boolean> | null = null;

/**
 * Exchanges the refresh token for new tokens. Concurrent callers share one request, because the
 * backend replaces the refresh token each time. Resolves false when the session has ended.
 */
export function refreshTokens(signal?: AbortSignal): Promise<boolean> {
  refreshing ??= (async () => {
    const refreshToken = tokenStore.refreshToken();
    if (!refreshToken) return false;
    const response = await send(refreshPath, {
      method: "POST", headers: { "Content-Type": "application/json", ...audit }, body: JSON.stringify({ refreshToken }),
    }, signal);
    if (response.status >= 500) throw new SessionRequestError("server", response.status);
    if (!response.ok) { tokenStore.clear(); return false; }
    await acceptTokens(response);
    return true;
  })().finally(() => { refreshing = null; });
  return refreshing;
}

async function authorized(path: string, signal?: AbortSignal): Promise<Response> {
  const request = () => send(path, { headers: { Authorization: `Bearer ${tokenStore.accessToken() ?? ""}`, ...audit } }, signal);
  const response = await request();
  return response.status === 401 && await refreshTokens(signal) ? request() : response;
}

/** Reads the signed-in user and permissions. Null means the backend no longer accepts the session. */
async function loadSession(userId: string, signal?: AbortSignal): Promise<SessionView | null> {
  const [userResponse, permissionResponse] = await Promise.all([
    authorized("/api/v1/user/authenticated", signal),
    authorized(`/api/v1/permission/user/${userId}`, signal),
  ]);
  for (const response of [userResponse, permissionResponse]) {
    if (response.status === 401) { tokenStore.clear(); return null; }
    if (!response.ok) throw new SessionRequestError(response.status === 403 ? "disabled" : "server", response.status);
  }
  const user = userSchema.safeParse(await json(userResponse));
  const permissions = permissionsSchema.safeParse(await json(permissionResponse));
  if (!user.success || !permissions.success) throw new SessionRequestError("invalid-response", 502);
  if (user.data.isDisabled) { tokenStore.clear(); throw new SessionRequestError("disabled", 403); }
  return {
    user: {
      id: user.data.id,
      name: `${user.data.firstName ?? ""} ${user.data.lastName ?? ""}`.trim(),
      email: user.data.email ?? null,
      department: user.data.department?.name ?? null,
      avatar: sameOriginAvatar(user.data.avatar),
    },
    permissions: grantedPermissions(permissions.data),
  };
}

/** Restores the session after a reload, or re-reads it while signed in. Null means signed out. */
export async function currentSession(signal?: AbortSignal): Promise<SessionView | null> {
  if (!tokenStore.accessToken() || !currentUserId) {
    if (!await refreshTokens(signal)) return null;
  }
  return currentUserId ? loadSession(currentUserId, signal) : null;
}

export async function loginSession(email: string, password: string): Promise<SessionView> {
  const response = await send(loginPath, {
    method: "POST", headers: { "Content-Type": "application/json", ...audit }, body: JSON.stringify({ email, password }),
  });
  if (!response.ok) throw await loginFailure(response);
  const userId = await acceptTokens(response);
  const session = await loadSession(userId);
  if (!session) throw new SessionRequestError("invalid-response", 502);
  return session;
}

/** The backend has no sign-out endpoint; signing out discards this window's tokens. */
export function logoutSession(): void {
  tokenStore.clear();
  currentUserId = null;
}
