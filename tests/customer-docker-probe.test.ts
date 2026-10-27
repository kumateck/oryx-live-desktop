import assert from "node:assert/strict";
import test from "node:test";
import { createServer } from "node:http";
import { readFileSync } from "node:fs";
import { object, parse } from "../deploy/customer-server/data.ts";
import { localSwaggerOrigin, verifyApiConnectivity, verifyCriticalCompatibility } from "../deploy/customer-docker/probe-checks.ts";

const contract = object(parse(readFileSync("contracts/openapi/backend.v1.json", "utf8")));

test("application API connectivity accepts expected authorization responses without requesting Swagger", async () => {
  for (const status of [200, 401, 403]) {
    const calls: string[] = [];
    await verifyApiConnectivity("http://oryx_api:5001", { fetcher: async (input, init) => {
      calls.push(String(input)); assert.equal(init?.headers, undefined);
      return Response.json({}, { status });
    } });
    assert.deepEqual(calls, ["http://oryx_api:5001/api/v1/user/authenticated"]);
  }
});

test("Swagger uses a genuine configured loopback URL with no Host spoofing and a 60-second timeout", async (context) => {
  const original = AbortSignal.timeout;
  const deadlines: number[] = [];
  context.mock.method(AbortSignal, "timeout", (duration: number) => { deadlines.push(duration); return original(duration); });
  await verifyCriticalCompatibility("http://127.0.0.1:8080", contract, { fetcher: async (input, init) => {
    assert.equal(String(input), "http://127.0.0.1:8080/swagger/v1/swagger.json");
    assert.equal(init?.headers, undefined); assert.equal(init?.redirect, "manual");
    return Response.json(contract);
  } });
  assert.deepEqual(deadlines, [60_000]);
});

test("API readiness and a denied Docker Swagger URL remain independent checks", async () => {
  await verifyApiConnectivity("http://oryx_api:5001", { fetcher: async () => new Response(null, { status: 401 }) });
  const denied = await verifyCriticalCompatibility("http://127.0.0.1:8080", contract, { fetcher: async () => new Response(null, { status: 401 }) });
  assert.equal(denied.verified, false); assert.match(denied.warnings.join(), /\[Swagger:http\].*HTTP 401/);
  const redirected = await verifyCriticalCompatibility("http://127.0.0.1:8080", contract, { fetcher: async () => new Response(null, { status: 302, headers: { Location: "http://elsewhere.test" } }) });
  assert.match(redirected.warnings.join(), /\[Swagger:http\].*HTTP 302/);
});

test("Swagger rejects nonlocal origins and credentials before making a request", async () => {
  assert.equal(localSwaggerOrigin("http://127.0.0.1:8080"), "http://127.0.0.1:8080");
  assert.equal(localSwaggerOrigin("https://localhost:8443"), "https://localhost:8443");
  assert.equal(localSwaggerOrigin("http://[::1]:8080"), "http://[::1]:8080");
  for (const origin of ["http://oryx_api:5001", "http://example.test", "http://user:password@127.0.0.1:8080", "http://127.0.0.1:8080/swagger"]) {
    let called = false;
    const result = await verifyCriticalCompatibility(origin, contract, { fetcher: async () => { called = true; return Response.json(contract); } });
    assert.equal(result.verified, false); assert.ok(result.warnings.length);
    assert.equal(called, false);
  }
});

test("unavailable or invalid Swagger warns without blocking a reachable backend", async () => {
  const offline = await verifyCriticalCompatibility("http://127.0.0.1:8080", contract, { fetcher: async () => { throw new TypeError("fetch failed", { cause: { code: "ECONNREFUSED" } }); } });
  assert.equal(offline.verified, false); assert.match(offline.warnings.join(), /\[Swagger:connection\].*ECONNREFUSED/);
  for (const body of ["<html>Sign in</html>", "{", "[]", '{"openapi":"3.0.1"}']) {
    const result = await verifyCriticalCompatibility("http://127.0.0.1:8080", contract, { fetcher: async () => new Response(body) });
    assert.equal(result.verified, false); assert.match(result.warnings.join(), /\[Swagger:json\]/);
  }
});

function stalledFetch(body: boolean): typeof fetch {
  return async (_input, init) => {
    const signal = init?.signal;
    if (!signal) throw new Error("Timeout signal missing");
    if (!body) return new Promise<Response>((resolve, reject) => {
      const timer = setTimeout(() => resolve(Response.json(contract)), 1000);
      signal.addEventListener("abort", () => { clearTimeout(timer); reject(new DOMException("Request aborted", "AbortError")); }, { once: true });
    });
    return new Response(new ReadableStream<Uint8Array>({ start(controller) {
      const timer = setTimeout(() => { controller.enqueue(new TextEncoder().encode(JSON.stringify(contract))); controller.close(); }, 1000);
      signal.addEventListener("abort", () => { clearTimeout(timer); controller.error(new DOMException("Body aborted", "AbortError")); }, { once: true });
    } }));
  };
}

test("the Swagger timeout covers both connection/header wait and the full response body", async () => {
  for (const body of [false, true]) {
    const result = await verifyCriticalCompatibility("http://127.0.0.1:8080", contract, { fetcher: stalledFetch(body), timeoutMs: 10 });
    assert.equal(result.verified, false); assert.match(result.warnings.join(), /\[Swagger:timeout\].*exceeded 0.01s/);
  }
});

test("a local HTTP fixture observes the real loopback Host while the API can remain protected", async () => {
  const seen: { path: string; host: string | undefined }[] = [];
  const server = createServer((request, response) => {
    seen.push({ path: request.url ?? "", host: request.headers.host });
    response.setHeader("Content-Type", "application/json");
    response.statusCode = request.url?.startsWith("/api/") ? 401 : 200;
    response.end(JSON.stringify(contract));
  });
  await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
  const address = server.address();
  if (!address || typeof address === "string") throw new Error("HTTP fixture did not bind");
  const origin = `http://127.0.0.1:${address.port}`;
  try {
    await verifyApiConnectivity(origin);
    await verifyCriticalCompatibility(origin, contract);
    assert.deepEqual(seen, [
      { path: "/api/v1/user/authenticated", host: `127.0.0.1:${address.port}` },
      { path: "/swagger/v1/swagger.json", host: `127.0.0.1:${address.port}` },
    ]);
  } finally { await new Promise<void>((resolve) => server.close(() => resolve())); }
});

test("unreachable, redirected and failing application APIs remain deployment blockers", async () => {
  for (const status of [302, 404, 500]) {
    await assert.rejects(verifyApiConnectivity("http://oryx_api:5001", { fetcher: async () => new Response(null, { status }) }), new RegExp(`\\[API:http\\].*HTTP ${status}`));
  }
  await assert.rejects(verifyApiConnectivity("http://oryx_api:5001", { fetcher: async () => { throw new TypeError("fetch failed", { cause: { code: "ECONNREFUSED" } }); } }), /\[API:connection\].*ECONNREFUSED/);
  await assert.rejects(verifyApiConnectivity("http://oryx_api:5001", { fetcher: stalledFetch(false), timeoutMs: 10 }), /\[API:timeout\]/);
});
