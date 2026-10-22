// @vitest-environment jsdom
import { configureStore } from "@reduxjs/toolkit";
import { afterEach, expect, it } from "vitest";
import { forgetSession, rememberSession, stubBackend } from "../../test/backend";
import { onPermissionDenied, onSessionExpired } from "../auth/session-events";
import { tokenStore } from "../auth/token-store";
import { api } from "./base-api";

afterEach(forgetSession);

const probeApi = api.injectEndpoints({ overrideExisting: true, endpoints: (build) => ({
  sessionProbe: build.query<void, void>({ query: () => "/api/v1/role" }),
  forbiddenWriteProbe: build.mutation<void, void>({ query: () => ({ url: "/api/v1/role", method: "POST" }) }),
}) });

function probe() {
  const store = configureStore({ reducer: { [api.reducerPath]: api.reducer },
    middleware: (defaults) => defaults().concat(api.middleware) });
  return store.dispatch(probeApi.endpoints.sessionProbe.initiate(undefined, { forceRefetch: true }));
}

function requestsTo(fetcher: ReturnType<typeof stubBackend>["fetcher"], path: string) {
  return fetcher.mock.calls.map(([input]) => input instanceof Request ? input : null)
    .filter((request): request is Request => request !== null && new URL(request.url).pathname === path);
}

it("renews the access token and repeats a request the backend rejected", async () => {
  const { fetcher } = stubBackend({ profileStatus: 401 });
  rememberSession();
  let expired = 0;
  const unsubscribe = onSessionExpired(() => { expired += 1; });
  let calls = 0;
  const original = fetcher.getMockImplementation();
  fetcher.mockImplementation(async (input, init) => {
    if (input instanceof Request && new URL(input.url).pathname === "/api/v1/role") return new Response(calls++ === 0 ? null : "[]", { status: calls === 1 ? 401 : 200 });
    return original ? original(input, init) : new Response(null, { status: 500 });
  });
  const result = await probe();
  unsubscribe();
  expect(result.isSuccess).toBe(true);
  expect(expired).toBe(0);
  expect(requestsTo(fetcher, "/api/v1/role").map((request) => request.headers.get("Authorization"))).toEqual([null, "Bearer access-renewed"]);
  expect(tokenStore.refreshToken()).toBe("refresh-renewed");
});

it("refreshes access after a forbidden mutation without retrying it or expiring the session", async () => {
  const { fetcher } = stubBackend();
  rememberSession();
  const original = fetcher.getMockImplementation();
  fetcher.mockImplementation(async (input, init) => input instanceof Request
    ? new Response(null, { status: 403 })
    : original ? original(input, init) : new Response(null, { status: 500 }));
  let denied = 0;
  let expired = 0;
  const unsubscribeDenied = onPermissionDenied(() => { denied += 1; });
  const unsubscribeExpired = onSessionExpired(() => { expired += 1; });
  const store = configureStore({ reducer: { [api.reducerPath]: api.reducer }, middleware: (defaults) => defaults().concat(api.middleware) });
  try {
    const result = await store.dispatch(probeApi.endpoints.forbiddenWriteProbe.initiate());
    expect(result).toMatchObject({ error: { status: 403 } });
    expect(requestsTo(fetcher, "/api/v1/role")).toHaveLength(1);
    expect(denied).toBe(1);
    expect(expired).toBe(0);
  } finally { unsubscribeDenied(); unsubscribeExpired(); store.dispatch(api.util.resetApiState()); }
});

it("expires the workspace when the session cannot be renewed", async () => {
  const { fetcher } = stubBackend({ profileStatus: 401, refreshStatus: 400 });
  rememberSession();
  let expired = 0;
  const unsubscribe = onSessionExpired(() => { expired += 1; });
  await probe();
  unsubscribe();
  expect(expired).toBe(1);
  expect(requestsTo(fetcher, "/api/v1/role")).toHaveLength(1);
});

it.each([429, 503])("does not expire the workspace or replay a write when renewal is temporarily unavailable (%s)", async (refreshStatus) => {
  const { fetcher } = stubBackend({ refreshStatus });
  rememberSession();
  const original = fetcher.getMockImplementation();
  fetcher.mockImplementation(async (input, init) => input instanceof Request ? new Response(null, { status: 401 })
    : original ? original(input, init) : new Response(null, { status: 500 }));
  let expired = 0;
  const unsubscribe = onSessionExpired(() => { expired += 1; });
  const store = configureStore({ reducer: { [api.reducerPath]: api.reducer }, middleware: (defaults) => defaults().concat(api.middleware) });
  try {
    await store.dispatch(probeApi.endpoints.forbiddenWriteProbe.initiate());
    expect(expired).toBe(0);
    expect(tokenStore.refreshToken()).toBe("refresh-stored");
    expect(requestsTo(fetcher, "/api/v1/role")).toHaveLength(1);
  } finally { unsubscribe(); store.dispatch(api.util.resetApiState()); }
});
