// @vitest-environment jsdom
import { afterEach, expect, it, vi } from "vitest";
import { forgetSession, rememberSession, stubBackend, userId } from "../../test/backend";
import { currentSession, grantedPermissions, loginSession, logoutSession, refreshTokens, sameOriginAvatar } from "./session-api";
import { tokenStore } from "./token-store";

afterEach(forgetSession);

const problem = (status: number, code: string) => () => Response.json({ title: "x", errors: [{ code, description: "x" }] }, { status });

it("signs in through the existing login endpoint and builds the session from user and permission data", async () => {
  const { fetcher } = stubBackend({ permissions: ["CanViewRoles"] });
  const session = await loginSession("ada@example.com", "password");
  expect(session).toEqual({
    user: { id: userId, name: "Ada Mensah", email: "ada@example.com", department: "Quality", departmentId: "558da105-a506-44a9-8ff5-8d005a54f294", departmentType: 0, avatar: null },
    permissions: ["CanViewRoles"],
  });
  const [path, request] = fetcher.mock.calls[0] ?? [];
  expect(path).toBe("/api/v1/auth/login");
  expect(request?.body).toBe(JSON.stringify({ email: "ada@example.com", password: "password" }));
  const profileHeaders = new Headers(fetcher.mock.calls[1]?.[1]?.headers);
  expect(profileHeaders.get("Authorization")).toBe("Bearer access-login");
});

it("keeps tokens out of localStorage and the access token out of all storage", async () => {
  stubBackend();
  await loginSession("ada@example.com", "password");
  expect(localStorage.length).toBe(0);
  expect(Object.values({ ...sessionStorage }).join(" ")).not.toContain("access-login");
  expect(tokenStore.refreshToken()).toBe("refresh-login");
  logoutSession();
  expect(sessionStorage.length).toBe(0);
  expect(tokenStore.accessToken()).toBeNull();
});

it.each([
  [problem(400, "Users.Details"), "credentials"],
  [problem(412, "Login.Disabled"), "disabled"],
  [problem(412, "Login.Error"), "server"],
  [() => new Response(null, { status: 429 }), "throttled"],
  [() => new Response(null, { status: 500 }), "server"],
  [() => Response.json({ userId, accessToken: "" }), "invalid-response"],
] as const)("explains a failed sign-in (%#) as %s", async (login, reason) => {
  stubBackend({ login });
  await expect(loginSession("ada@example.com", "password")).rejects.toMatchObject({ reason });
  expect(tokenStore.refreshToken()).toBeNull();
});

it("reports an unreachable server separately from bad credentials", async () => {
  vi.stubGlobal("fetch", vi.fn<typeof fetch>().mockRejectedValue(new TypeError("offline")));
  await expect(loginSession("ada@example.com", "password")).rejects.toMatchObject({ reason: "network" });
});

it("is signed out when nothing is stored, without calling the server", async () => {
  const { fetcher } = stubBackend();
  expect(await currentSession()).toBeNull();
  expect(fetcher).not.toHaveBeenCalled();
});

it("restores the session after a reload from the stored refresh token", async () => {
  const { fetcher } = stubBackend({ permissions: ["CanViewRoles"] });
  rememberSession();
  expect((await currentSession())?.permissions).toEqual(["CanViewRoles"]);
  expect(fetcher.mock.calls[0]?.[0]).toBe("/api/v1/auth/login-with-refresh-token");
  expect(tokenStore.refreshToken()).toBe("refresh-renewed");
});

it("ends the session when the refresh token is rejected, but not when the server is down", async () => {
  const backend = stubBackend({ refreshStatus: 400 });
  rememberSession();
  expect(await currentSession()).toBeNull();
  expect(tokenStore.refreshToken()).toBeNull();
  rememberSession();
  backend.set({ refreshStatus: 503 });
  await expect(currentSession()).rejects.toMatchObject({ reason: "server" });
  expect(tokenStore.refreshToken()).toBe("refresh-stored");
});

it("shares one refresh between concurrent callers", async () => {
  const { fetcher } = stubBackend();
  rememberSession();
  expect(await Promise.all([refreshTokens(), refreshTokens(), refreshTokens()])).toEqual([true, true, true]);
  expect(fetcher).toHaveBeenCalledTimes(1);
});

it("refuses a disabled account", async () => {
  stubBackend({ disabled: true });
  await expect(loginSession("ada@example.com", "password")).rejects.toMatchObject({ reason: "disabled" });
  expect(tokenStore.refreshToken()).toBeNull();
});

it("counts only active modules and the Access type as granted", () => {
  expect(grantedPermissions([
    { isActive: true, children: [{ key: "A", types: ["Access"] }, { key: "B", types: [] }, { key: "A", types: ["Access"] }, { key: null, types: ["Access"] }] },
    { isActive: false, children: [{ key: "C", types: ["Access"] }] },
    { isActive: true, children: null },
  ])).toEqual(["A"]);
});

it.each([
  ["http://10.0.0.5:8086/api/v1/file/avatar/3f2a.png", "/api/v1/file/avatar/3f2a.png"],
  ["/api/v1/file/avatar/3f2a.png", "/api/v1/file/avatar/3f2a.png"],
  ["https://elsewhere.example/tracker.png", null],
  ["http://10.0.0.5/api/v1/file/avatar/../signature/x.png", null],
  ["javascript:alert(1)", null],
  [null, null],
])("uses only the avatar file path on this origin (%s)", (avatar, expected) => {
  expect(sameOriginAvatar(avatar)).toBe(expected);
});
