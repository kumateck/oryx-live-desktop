// @vitest-environment jsdom
import { afterEach, expect, it, vi } from "vitest";

afterEach(() => { vi.unstubAllGlobals(); sessionStorage.clear(); delete window.oryxSession; vi.resetModules(); });

it("after a restart of the installed app, signs in again with the sign-in the shell kept, and keeps each new one", async () => {
  const saved: (string | null)[] = [];
  window.oryxSession = { load: vi.fn(async () => "refresh-kept"), save: vi.fn(async (token: string | null) => { saved.push(token); }) };
  const bodies: unknown[] = [];
  vi.stubGlobal("fetch", vi.fn<typeof fetch>(async (input, init) => {
    const path = String(input).split("?")[0];
    if (path === "/api/v1/auth/login-with-refresh-token") { bodies.push(JSON.parse(String(init?.body))); return Response.json({ userId: "258da105-a506-44a9-8ff5-8d005a54f294", accessToken: "a2", refreshToken: "refresh-next" }); }
    if (path === "/api/v1/user/authenticated") return Response.json({ id: "258da105-a506-44a9-8ff5-8d005a54f294", firstName: "Ada" });
    return Response.json([]);
  }));
  const { currentSession, logoutSession } = await import("./session-api");
  const session = await currentSession();
  expect(session?.user.name).toBe("Ada");
  expect(bodies).toEqual([{ clientId: "web", refreshToken: "refresh-kept" }]);
  // The server replaces the refresh token each time; the shell keeps the newest.
  expect(saved).toEqual(["refresh-next"]);
  logoutSession();
  expect(saved).toEqual(["refresh-next", null]);
});

it("in a browser, without the shell, nothing is asked of it", async () => {
  vi.stubGlobal("fetch", vi.fn<typeof fetch>(async () => new Response(null, { status: 401 })));
  const { currentSession } = await import("./session-api");
  expect(await currentSession()).toBeNull();
});

it("in a browser, a new tab signs in with the sign-in an open tab holds", async () => {
  const signedIn = await import("./token-store");
  signedIn.tokenStore.set({ accessToken: "a1", refreshToken: "refresh-open-tab" });
  // A new tab starts with its own empty sessionStorage and its own copy of the module.
  sessionStorage.clear();
  vi.resetModules();
  const bodies: unknown[] = [];
  vi.stubGlobal("fetch", vi.fn<typeof fetch>(async (input, init) => {
    const path = String(input).split("?")[0];
    if (path === "/api/v1/auth/login-with-refresh-token") { bodies.push(JSON.parse(String(init?.body))); return Response.json({ userId: "258da105-a506-44a9-8ff5-8d005a54f294", accessToken: "a2", refreshToken: "refresh-new-tab" }); }
    if (path === "/api/v1/user/authenticated") return Response.json({ id: "258da105-a506-44a9-8ff5-8d005a54f294", firstName: "Ada" });
    return Response.json([]);
  }));
  const { currentSession } = await import("./session-api");
  expect((await currentSession())?.user.name).toBe("Ada");
  expect(bodies).toEqual([{ clientId: "web", refreshToken: "refresh-open-tab" }]);
  // Sign both tabs out so they answer no later test.
  (await import("./token-store")).tokenStore.clear();
  signedIn.tokenStore.clear();
});

it("in a browser, a new tab stays signed out when no open tab is signed in", async () => {
  const fetcher = vi.fn<typeof fetch>(async () => new Response(null, { status: 401 }));
  vi.stubGlobal("fetch", fetcher);
  const { currentSession } = await import("./session-api");
  expect(await currentSession()).toBeNull();
  expect(fetcher).not.toHaveBeenCalled();
});
