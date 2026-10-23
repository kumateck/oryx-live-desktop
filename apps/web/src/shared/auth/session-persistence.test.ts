// @vitest-environment jsdom
import { afterEach, expect, it, vi } from "vitest";
const userId = "258da105-a506-44a9-8ff5-8d005a54f294";
const tokens = () => Response.json({ userId, accessToken: "next-access", refreshToken: "next-refresh" });
afterEach(() => { sessionStorage.clear(); delete window.oryxSession; vi.unstubAllGlobals(); vi.resetModules(); });

it("one page's cancellation does not cancel the renewal needed by another page", async () => {
  const { tokenStore } = await import("./token-store");
  tokenStore.set({ accessToken: "", refreshToken: "kept" });
  let release = () => {};
  const ready = new Promise<void>((resolve) => { release = resolve; });
  const fetcher = vi.fn<typeof fetch>(async () => { await ready; return tokens(); });
  vi.stubGlobal("fetch", fetcher);
  const { refreshTokens } = await import("./session-api");
  const controller = new AbortController();
  const cancelled = refreshTokens(controller.signal);
  const resumed = refreshTokens();
  controller.abort();
  await expect(cancelled).rejects.toMatchObject({ name: "AbortError" });
  release();
  expect(await resumed).toBe(true);
  expect(fetcher).toHaveBeenCalledTimes(1);
  expect(tokenStore.refreshToken()).toBe("next-refresh");
});

it("sign-out wins over an already running renewal", async () => {
  const { tokenStore } = await import("./token-store");
  tokenStore.set({ accessToken: "", refreshToken: "kept" });
  let release = () => {};
  const ready = new Promise<void>((resolve) => { release = resolve; });
  vi.stubGlobal("fetch", vi.fn<typeof fetch>(async () => { await ready; return tokens(); }));
  const { refreshTokens, logoutSession } = await import("./session-api");
  const renewal = refreshTokens();
  await vi.waitFor(() => expect(fetch).toHaveBeenCalledOnce());
  logoutSession();
  release();
  expect(await renewal).toBe(false);
  expect(tokenStore.refreshToken()).toBeNull();
  expect(tokenStore.accessToken()).toBeNull();
});

it("coalesces vault restoration and never restores a token after sign-out", async () => {
  let release = (_token: string | null) => {};
  window.oryxSession = { load: vi.fn(() => new Promise<string | null>((resolve) => { release = resolve; })), save: vi.fn(async () => {}) };
  const { tokenStore } = await import("./token-store");
  const first = tokenStore.restore();
  const second = tokenStore.restore();
  expect(window.oryxSession.load).toHaveBeenCalledOnce();
  tokenStore.clear();
  release("old-kept-token");
  await Promise.all([first, second]);
  expect(tokenStore.refreshToken()).toBeNull();
});

it("confirms the encrypted save before completing renewal", async () => {
  let release = () => {};
  const saved = new Promise<void>((resolve) => { release = resolve; });
  window.oryxSession = { load: vi.fn(async () => "kept"), save: vi.fn(() => saved) };
  vi.stubGlobal("fetch", vi.fn<typeof fetch>(async () => tokens()));
  const { refreshTokens } = await import("./session-api");
  let completed = false;
  const renewal = refreshTokens().then((result) => { completed = true; return result; });
  await vi.waitFor(() => expect(window.oryxSession?.save).toHaveBeenCalledWith("next-refresh"));
  expect(completed).toBe(false);
  release();
  expect(await renewal).toBe(true);
});

it.each([429, 503, 404, 408])("keeps the stored session after a temporary or unrecognized refresh failure (%s)", async (status) => {
  const { tokenStore } = await import("./token-store");
  tokenStore.set({ accessToken: "", refreshToken: "kept" });
  vi.stubGlobal("fetch", vi.fn<typeof fetch>(async () => new Response(null, { status })));
  const { refreshTokens } = await import("./session-api");
  await expect(refreshTokens()).rejects.toHaveProperty("status", status);
  expect(tokenStore.refreshToken()).toBe("kept");
});

it.each(["Token.NotFound", "User.NotFound"])("clears the stored session when the backend no longer knows it (%s)", async (code) => {
  const { tokenStore } = await import("./token-store");
  tokenStore.set({ accessToken: "", refreshToken: "gone" });
  vi.stubGlobal("fetch", vi.fn<typeof fetch>(async () => Response.json({ errors: [{ code, description: "x" }] }, { status: 404 })));
  const { refreshTokens } = await import("./session-api");
  expect(await refreshTokens()).toBe(false);
  expect(tokenStore.refreshToken()).toBeNull();
});

it("uses the most recent encrypted token ahead of an older window copy on restart", async () => {
  sessionStorage.setItem("oryx-session-refresh", "older");
  window.oryxSession = { load: vi.fn(async () => "latest"), save: vi.fn(async () => {}) };
  const { tokenStore } = await import("./token-store");
  await tokenStore.restore();
  expect(tokenStore.refreshToken()).toBe("latest");
});

it("reports a failed encrypted save and retains the server token for recovery", async () => {
  window.oryxSession = { load: vi.fn(async () => "kept"), save: vi.fn(async () => { throw new Error("keyring unavailable"); }) };
  vi.stubGlobal("fetch", vi.fn<typeof fetch>(async () => tokens()));
  const { refreshTokens } = await import("./session-api");
  const { tokenStore } = await import("./token-store");
  await expect(refreshTokens()).rejects.toMatchObject({ reason: "storage" });
  expect(tokenStore.refreshToken()).toBe("next-refresh");
});
