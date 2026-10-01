import { vi } from "vitest";
import { logoutSession } from "../shared/auth/session-api";
import { tokenStore } from "../shared/auth/token-store";

export const userId = "258da105-a506-44a9-8ff5-8d005a54f294";

interface BackendOptions {
  permissions?: string[];
  /** Status of the user and permission requests; 401 simulates a rejected access token. */
  profileStatus?: number;
  /** Status of the refresh-token exchange. */
  refreshStatus?: number;
  login?: () => Response;
  avatar?: string | null;
  disabled?: boolean;
  /** Type of the user's department: 0 production, 1 non-production, 2 research and development. */
  departmentType?: 0 | 1 | 2;
}

const tokens = (name: string) => Response.json({ userId, accessToken: `access-${name}`, refreshToken: `refresh-${name}`, expiresIn: 900, avatar: null });

/** Routes fetch to a stand-in for the existing backend endpoints the session uses. */
export function stubBackend(options: BackendOptions = {}) {
  const state = { ...options };
  const fetcher = vi.fn<typeof fetch>(async (input) => {
    const path = String(input).split("?")[0] ?? "";
    if (path === "/api/v1/auth/login") return state.login ? state.login() : tokens("login");
    if (path === "/api/v1/auth/login-with-refresh-token") {
      return (state.refreshStatus ?? 200) === 200 ? tokens("renewed") : new Response(null, { status: state.refreshStatus ?? 200 });
    }
    if ((state.profileStatus ?? 200) !== 200) return new Response(null, { status: state.profileStatus ?? 200 });
    if (path === "/api/v1/user/authenticated") return Response.json({
      id: userId, firstName: "Ada", lastName: "Mensah", email: "ada@example.com", isDisabled: state.disabled ?? false,
      avatar: state.avatar ?? null, department: { id: "558da105-a506-44a9-8ff5-8d005a54f294", name: "Quality", type: state.departmentType ?? 0 },
    });
    if (path === `/api/v1/permission/user/${userId}`) return Response.json([
      { module: "Access", isActive: true, children: (state.permissions ?? []).map((key) => ({ key, types: ["Access"] })) },
    ]);
    return new Response(null, { status: 404 });
  });
  vi.stubGlobal("fetch", fetcher);
  return { fetcher, set: (change: BackendOptions) => { Object.assign(state, change); } };
}

/** Starts a test as a user returning after a reload: a refresh token is stored, nothing is in memory. */
export function rememberSession(): void {
  logoutSession();
  tokenStore.set({ accessToken: "", refreshToken: "refresh-stored" });
}

export function forgetSession(): void {
  logoutSession();
  vi.unstubAllGlobals();
}
